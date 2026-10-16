# Ethereum Course Assignments

Coursework for **Introduction to Ethereum and Cloud Blockchain Solutions Engineering**.

## Contents

- `Assignment_Lab2/Report/Assignment_Lab2.docx` — written answers and lab report.
- `Assignment_Lab2/DApp/` — Solidity contract, frontend, test scripts, and local verification evidence.
- `Assignment_Lab3/Assignment_Lab3.docx` — written answers for storage, gas, Solidity, Parity, testnets, and reentrancy.
- `Assignment_Lab3/` — reproducible local Solidity contracts, tests, evidence, and research sources.

## Assignment 3 quick start

```text
cd Assignment_Lab3
npm ci
npm test
```

The Lab 3 test suite runs only on a local Ganache chain and does not claim a Sepolia deployment.

## Assignment 2 quick start

```text
cd Assignment_Lab2/DApp
npm install
npm test
npm run build
```

Verified Sepolia contract: `0xCBa5edaAf9d6407A85531091C3762Ae6bfCF30c3`.

The deployment and one `0.001` test-ETH bet are recorded in `Assignment_Lab2/DApp/evidence/sepolia-deployment.json`. The 100-participant oracle callback was not claimed or attempted.

Published DApp: https://bafybeicmwmi6imwpgtf63sbvpoeb7dqa7onrrxtldfmjkpx6orqzv62n5y.ipfs.dweb.link/
