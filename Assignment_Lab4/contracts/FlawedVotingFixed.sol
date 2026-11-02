pragma solidity 0.5.1;

library SafeMath {
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }
}

contract FlawedVotingFixed {
    using SafeMath for uint256;

    mapping(address => uint256) public remainingVotes;
    mapping(uint256 => uint256) public votes;

    constructor() public {
        remainingVotes[msg.sender] = 10;
    }

    function vote(uint256 candidate, uint256 amountOfVotes) public {
        // SafeMath checks the balance before subtracting, so a uint cannot
        // wrap around to an enormous value when amountOfVotes is too large.
        remainingVotes[msg.sender] = remainingVotes[msg.sender].sub(amountOfVotes);
        votes[candidate] += amountOfVotes;
    }
}
