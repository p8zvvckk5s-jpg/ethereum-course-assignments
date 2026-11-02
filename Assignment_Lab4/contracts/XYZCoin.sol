pragma solidity 0.5.1;

import "./ERC20.sol";

contract XYZCoin is ERC20 {
    string public constant name = "XYZ Coin";
    string public constant symbol = "XYZ";
    uint8 public constant decimals = 0;

    uint256 private tokenTotalSupply = 1000;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowed;

    constructor() public {
        balances[msg.sender] = tokenTotalSupply;
        emit Transfer(address(0), msg.sender, tokenTotalSupply);
    }

    function totalSupply() external view returns (uint256) {
        return tokenTotalSupply;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return balances[owner];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "Recipient cannot be the zero address");
        require(balances[msg.sender] >= value, "Insufficient balance");

        balances[msg.sender] -= value;
        balances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "Spender cannot be the zero address");

        allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return allowed[owner][spender];
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(to != address(0), "Recipient cannot be the zero address");
        require(balances[from] >= value, "Insufficient balance");
        require(allowed[from][msg.sender] >= value, "Insufficient allowance");

        balances[from] -= value;
        balances[to] += value;
        allowed[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
