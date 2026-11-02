pragma solidity 0.5.1;

contract Migrations {
    address public owner;
    uint256 public lastCompletedMigration;

    constructor() public {
        owner = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == owner, "Only the owner may run migrations");
        _;
    }

    function setCompleted(uint256 completed) public restricted {
        lastCompletedMigration = completed;
    }
}
