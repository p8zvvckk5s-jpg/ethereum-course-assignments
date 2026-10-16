// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HelloWorld
/// @notice Lab contract for demonstrating deployment, calls, transactions, and logs.
contract HelloWorld {
    event HelloReturned(address indexed caller, string message);

    function hello() external returns (string memory) {
        string memory message = "Hello, world!";
        emit HelloReturned(msg.sender, message);
        return message;
    }
}
