// SPDX-License-Identifier: MIT
pragma solidity 0.4.24;

/// @notice Intentionally vulnerable contract copied from the assignment.
/// @dev Local or test-network education only. Do not deploy with real funds.
contract Dangerous {
    mapping(address => uint256) public deposits;

    function depositMoney() public payable {
        deposits[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(deposits[msg.sender] >= amount);
        if (!msg.sender.call.value(amount)()) {
            revert();
        }
        deposits[msg.sender] -= amount;
    }
}
