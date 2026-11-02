# Assignment / Lab #4 — Programming Deliverables

This folder contains the programming work for GEC Academy Assignment / Lab #4:

- a corrected version of the unsigned-integer voting example;
- a Web3.js scanner for the first Ethereum contract-creation transaction;
- an ERC-20-compatible `XYZCoin` written for Solidity 0.5.1;
- Truffle migrations and Mocha tests, including the required `truffle-assertions` checks.

## Install and test

```text
npm install
npm run compile
npm test
```

The compiler is pinned to `solc` 0.5.1 and optimization is enabled in `truffle-config.js`.

## Run the Web3 scanner

1. Create an Infura account and a project.
2. Copy `.env.example` to `.env`.
3. Put the project's HTTPS endpoint in `INFURA_MAINNET_URL`.
4. Run `npm run find:first-contract`.

The scanner requests full transaction objects, works in bounded concurrent batches, and identifies contract creation by a transaction whose `to` field is `null`. The real `.env` file is intentionally ignored by Git.
