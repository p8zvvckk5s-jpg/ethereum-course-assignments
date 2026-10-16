# Assignment Lab 3 Ethereum

This folder contains the Solidity programs and reproducible local tests used for Assignment/Lab #3. The reentrancy example is intentionally vulnerable and must be used only on a private development chain or an authorized test network with test funds.

## Included contracts

- `HelloWorld.sol` returns `Hello, world!` and emits the same text in an event so the result is visible in a transaction receipt.
- `StorageTest.sol` stores an array of 32 `bytes32` values, totaling 1 KiB.
- `Dangerous.sol` reproduces the assignment's vulnerable withdrawal order.
- `ReentrancyAttacker.sol` demonstrates the vulnerability on a local chain.
- `SafeVault.sol` applies checks-effects-interactions and a reentrancy guard.

## Local verification

```text
npm ci
npm test
```

The scripts write machine-readable results to `evidence/`. The modern test compiles for the Paris EVM target so the bytecode runs on the local Ganache test chain. Local tests do not prove a Sepolia deployment. Sepolia contract and transaction identifiers should be recorded separately after the wallet owner confirms those transactions.
