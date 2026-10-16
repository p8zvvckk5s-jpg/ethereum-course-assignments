// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SafeVault
/// @notice A checks-effects-interactions version of the vulnerable withdraw pattern.
contract SafeVault {
    mapping(address => uint256) public deposits;
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function depositMoney() external payable {
        deposits[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(deposits[msg.sender] >= amount, "insufficient deposit");
        deposits[msg.sender] -= amount;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "transfer failed");
    }
}
