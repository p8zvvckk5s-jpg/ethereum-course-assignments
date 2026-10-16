// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title StorageTest
/// @notice Stores an arbitrary bytes32 array so the gas cost of 1 KiB can be measured.
contract StorageTest {
    bytes32[] public data;

    function put(bytes32[] calldata values) external {
        data = values;
    }

    function length() external view returns (uint256) {
        return data.length;
    }
}
