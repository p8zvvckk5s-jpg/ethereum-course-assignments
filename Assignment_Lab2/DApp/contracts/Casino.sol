pragma solidity ^0.4.22;

import "./oraclizeAPI_0.4.sol";

// Educational adaptation of Merunas Grincalaitis's MIT-licensed tutorial.
// TEST NETWORKS ONLY. Legacy compiler and oracle library are not production advice.
contract Casino is usingOraclize {
    uint public minimumBet;
    uint public maxAmountOfBets;
    uint public roundId = 1;
    uint public totalLiabilities;
    uint public constant CALLBACK_GAS = 600000;
    uint public constant ROUND_TIMEOUT = 7 days;
    bool private withdrawing;

    struct Round {
        uint count;
        uint pot;
        uint started;
        uint winner;
        bool requested;
        bool settled;
        bool refunded;
        bytes32 queryId;
    }
    struct Bet { uint number; uint amount; bool claimed; }
    mapping(uint => Round) public rounds;
    mapping(uint => mapping(address => Bet)) public bets;
    mapping(uint => mapping(uint => uint)) public numberCount;
    mapping(uint => mapping(uint => address)) public firstPlayer;
    mapping(bytes32 => uint) public queryRound;

    event BetPlaced(uint indexed round, address indexed player, uint number, uint amount);
    event RandomnessRequested(uint indexed round, bytes32 indexed queryId);
    event RoundSettled(uint indexed round, uint winner, uint pot, bool refunds);
    event Claimed(uint indexed round, address indexed player, uint amount);

    constructor(uint _minimumBet, uint _maxAmountOfBets) public payable {
        require(_minimumBet > 0, "Minimum bet must be positive");
        require(_maxAmountOfBets > 0 && _maxAmountOfBets <= 100, "Round size must be 1 to 100");
        minimumBet = _minimumBet;
        maxAmountOfBets = _maxAmountOfBets;
        oraclize_setProof(proofType_Ledger);
    }

    // Separate sponsorship pays oracle fees; stakes remain reserved for players.
    function() external payable {}
    function numberOfBets() public view returns(uint) { return rounds[roundId].count; }
    function totalBet() public view returns(uint) { return rounds[roundId].pot; }
    function checkPlayerExists(address player) public view returns(bool) {
        return bets[roundId][player].number != 0;
    }

    function bet(uint numberToBet) external payable {
        Round storage r = rounds[roundId];
        require(!r.settled && !r.requested && r.count < maxAmountOfBets, "Round closed");
        require(r.started == 0 || now < r.started + ROUND_TIMEOUT, "Round expired");
        require(numberToBet >= 1 && numberToBet <= 10, "Choose 1 to 10");
        require(!checkPlayerExists(msg.sender), "One bet per address per round");
        require(msg.value >= minimumBet, "Bet below minimum");
        require(r.pot + msg.value >= r.pot && totalLiabilities + msg.value >= totalLiabilities);
        if (r.started == 0) r.started = now;
        bets[roundId][msg.sender] = Bet(numberToBet, msg.value, false);
        if (numberCount[roundId][numberToBet] == 0) firstPlayer[roundId][numberToBet] = msg.sender;
        numberCount[roundId][numberToBet]++;
        r.count++;
        r.pot += msg.value;
        totalLiabilities += msg.value;
        emit BetPlaced(roundId, msg.sender, numberToBet, msg.value);
    }

    // Any participant may request once 100 bets are collected. Separating this
    // from bet() prevents insufficient oracle reserve from reverting the final bet.
    function requestRandomness() external {
        Round storage r = rounds[roundId];
        require(r.count == maxAmountOfBets && !r.requested && !r.settled, "Not ready");
        require(now < r.started + ROUND_TIMEOUT, "Round expired");
        uint price = oraclize_getPrice("random", CALLBACK_GAS);
        require(address(this).balance >= totalLiabilities + price, "Fund oracle reserve separately");
        r.requested = true;
        r.queryId = oraclize_newRandomDSQuery(0, 7, CALLBACK_GAS);
        require(r.queryId != bytes32(0), "Oracle request failed");
        require(address(this).balance >= totalLiabilities, "Oracle must not spend stakes");
        queryRound[r.queryId] = roundId;
        emit RandomnessRequested(roundId, r.queryId);
    }

    function __callback(bytes32 id, string result, bytes proof)
        public oraclize_randomDS_proofVerify(id, result, proof) {
        require(msg.sender == oraclize_cbAddress(), "Unauthorized oracle");
        uint idRound = queryRound[id];
        require(idRound != 0, "Unknown query");
        Round storage r = rounds[idRound];
        require(r.requested && !r.settled && r.queryId == id, "Stale callback");
        r.winner = uint(keccak256(bytes(result))) % 10 + 1;
        r.refunded = numberCount[idRound][r.winner] == 0;
        r.settled = true;
        emit RoundSettled(idRound, r.winner, r.pot, r.refunded);
        roundId++;
    }

    // Explicit teaching policy for oracle outage or an incomplete round.
    // Timeout refunds weaken fairness against an oracle that selectively withholds
    // a result. This tradeoff is disclosed; it is not a production casino design.
    function refundExpiredRound() external {
        Round storage r = rounds[roundId];
        require(r.started != 0 && now >= r.started + ROUND_TIMEOUT && !r.settled, "Not expired");
        r.refunded = true;
        r.settled = true;
        emit RoundSettled(roundId, 0, r.pot, true);
        roundId++;
    }

    function claimable(uint idRound, address player) public view returns(uint) {
        Round storage r = rounds[idRound];
        Bet storage b = bets[idRound][player];
        if (!r.settled || b.claimed || b.number == 0) return 0;
        if (r.refunded) return b.amount;
        if (b.number != r.winner) return 0;
        uint winners = numberCount[idRound][r.winner];
        uint amount = r.pot / winners;
        if (player == firstPlayer[idRound][r.winner]) amount += r.pot % winners;
        return amount;
    }

    function claim(uint idRound) external {
        require(!withdrawing, "Reentrancy blocked");
        uint amount = claimable(idRound, msg.sender);
        require(amount > 0, "Nothing to claim");
        bets[idRound][msg.sender].claimed = true;
        totalLiabilities -= amount;
        withdrawing = true;
        require(msg.sender.call.value(amount)(""), "Payment failed");
        withdrawing = false;
        emit Claimed(idRound, msg.sender, amount);
    }
}
