pragma solidity ^0.4.22;

// LOCAL TEST SHIM ONLY: replaces the import during the local build.
// Does not verify a Ledger proof or generate unpredictable randomness.
// Never deploy this bytecode to Sepolia or mainnet.
contract usingOraclize {
    byte constant proofType_Ledger = 0x30;
    address private mockOperator = msg.sender;
    uint private mockCounter;
    function oraclize_setProof(byte) internal {}
    function oraclize_cbAddress() internal view returns(address) { return mockOperator; }
    function oraclize_getPrice(string, uint) internal pure returns(uint) { return 0; }
    function oraclize_newRandomDSQuery(uint, uint, uint) internal returns(bytes32) {
        return keccak256(abi.encodePacked(address(this), ++mockCounter));
    }
    modifier oraclize_randomDS_proofVerify(bytes32, string, bytes) { _; }
}
