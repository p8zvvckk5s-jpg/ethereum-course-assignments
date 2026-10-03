# Assignment 2 Casino DApp

Educational test-network exercise based on the specified Merunas Grincalaitis tutorial. No real funds. Not audited for production use.

## What is actually completed

- English Part I answers are in the accompanying Word report.
- Live Oraclize-library and local mock bytecode compile with Solidity 0.4.24.
- Local automated results are in `evidence/local-tests.json`. They test contract logic, not the external oracle or its proof.
- React frontend and a reproducible Webpack build are included.
- A Sepolia deployment and one `0.001` test-ETH bet are verified in `evidence/sepolia-deployment.json`.
- The repository is publicly available at https://github.com/p8zvvckk5s-jpg/ethereum-course-assignments.
- The published static DApp is available at the IPFS root CID `bafybeicmwmi6imwpgtf63sbvpoeb7dqa7onrrxtldfmjkpx6orqzv62n5y`; a verified gateway URL is https://bafybeicmwmi6imwpgtf63sbvpoeb7dqa7onrrxtldfmjkpx6orqzv62n5y.ipfs.dweb.link/.
- The 100-participant public round and genuine oracle callback are **not claimed**; they require 100 distinct participant addresses and coordination with the instructor/TA.

## Install and run

Use Node.js with npm (tested using Node 24). Run commands from this `dapp` directory.

```text
npm ci
npm test
npm run build
npm run demo
```

Open `http://127.0.0.1:8088`. The demonstration starts a fresh isolated chain at `127.0.0.1:8547` and prepares 99 bets. Choose **Connect local test account**, select a number, place the 100th bet, request a result, then use **Simulate callback locally**. This controlled callback is not secure randomness. The terminal must remain running. Stop with Ctrl+C. Restarting loses this disposable chain.

For the Sepolia interface instead, stop the demonstration, then run:

```text
npm start
```

The static configuration in `public/config.json` is Sepolia by default. The local demonstration overrides it only in memory; it never writes a mock contract address into the publishable configuration.

## Actual Sepolia deployment

Verified contract: `0xCBa5edaAf9d6407A85531091C3762Ae6bfCF30c3`

Deployment transaction: `0xeee0ecc55a8dd03507e96afe978fcf0f50c8be8f7b1a3a32f7871e67b1b0b000`

Verified bet transaction: `0xddbdda9cdbb081ced423dd02e8014acf18e541eafdedb528900ba9fcd4c7dc42`

1. Use a separate test wallet and select Ethereum Sepolia, chain ID 11155111. Obtain test ETH from an appropriate faucet or ask the instructor/TA. Do not buy mainnet ETH merely to meet a faucet condition. Never share a seed phrase or private key.
2. Run the static interface with `npm start`, connect your Sepolia wallet, and review the deployment inputs. The minimum bet defaults to 0.001 test ETH and the round size is fixed to 100 by the form. The displayed oracle reserve is configurable and is not a guarantee of the live oracle's price.
3. Click **Deploy on Sepolia** and approve only the expected deployment in your wallet. The page embeds the **live** `artifacts/Casino.json`, never the local mock artifact. Record the confirmed address and deployment transaction hash. If the old oracle resolver or service is unavailable, stop and report the error; do not substitute mock deployment evidence.
4. Paste the actual address into the interface and reconnect if needed. Place a test bet and record the successful transaction. The tutorial's one-address-per-round rule means a complete 100-bet public round needs 100 participating addresses. Arrange this with the TA rather than sending private keys or buying funds.
5. After 100 bets, separately fund the oracle reserve if necessary and call **Request oracle result**. Verify a real oracle callback and settlement before describing randomness as tested. The configured callback allowance is 600,000 gas; real proof verification and service pricing have not been empirically verified on Sepolia.
6. Winners claim with the completed round number. If there is no winner, each participant can claim the original stake. A seven-day expiry from the first bet allows refunds for a stalled or incomplete round. This recoverability policy has a selective-withholding fairness limitation, discussed in the report.
7. Set `public/config.json` to `{"chainId":11155111,"mode":"sepolia","address":"YOUR_ACTUAL_ADDRESS"}` and run `npm run build` again. Do not replace the address with a local-chain address.

Alternative Remix workflow: upload both `contracts/Casino.sol` and `contracts/oraclizeAPI_0.4.sol` into the same folder. Select Solidity 0.4.24 and optimization (200 runs), compile Casino, choose the injected wallet provider and confirm Sepolia. Constructor inputs for the example are minimum bet `1000000000000000` wei and max bets `100`. Deployment value, if supplied, is an oracle reserve, not a player's bet. Confirm all values in your wallet. The source contract itself is not a mainnet safety barrier.

## IPFS and custom domain

Only publish the final `dist` directory after the real Sepolia address is configured. Use a Kubo/IPFS Desktop node or an authorized pinning service to add and pin that directory. Record the returned root CID; keep at least one pin online. Test loading the actual CID from a separate browser session. Relative resource paths are used so a CID subdirectory works.

With an existing Kubo installation, the relevant commands are:

```text
ipfs add -r --cid-version=1 dist
ipfs pin ls YOUR_ACTUAL_ROOT_CID
```

Use an origin-isolated subdomain gateway, for example `https://YOUR_CID.ipfs.dweb.link/`, with your actual CID. Availability must be checked; no gateway availability is promised. Do not publish `.env`, keys, personal data, `node_modules`, source PDFs or local test accounts. Do not enable public access to the local RPC.

If you control a domain, a DNS TXT record named `_dnslink.yourdomain.example` can have value `dnslink=/ipfs/YOUR_ACTUAL_CID`. Configure an appropriate HTTPS DNSLink gateway according to its current instructions. Domain ownership and gateway setup are separate requirements. The supplement's `docs.ipfs.io.ipns.localhost:8080` is a documentation address, not your DApp URL. Do not buy a domain without confirming whether the instructor requires a live custom-domain demonstration.

The CID above was loaded in a separate browser session and the Sepolia configuration was checked. The `*.ipfs.dweb.link` gateway may redirect to an inbrowser.link origin while loading; this is normal gateway behavior. A custom domain was not configured.

## GitHub submission

The public course repository is https://github.com/p8zvvckk5s-jpg/ethereum-course-assignments. Preserve `package-lock.json`, source, tests, licenses and evidence. Do not copy `node_modules` or local chain data. The `.gitignore` excludes them. The TA confirmed that public visibility plus the repository link is sufficient.

## Changes relative to the original

- Constructor round size 100 follows the assignment; the historical repository defaults to 10.
- The oracle import is a pinned local file found at the relocated upstream path.
- Solidity 0.4.24 satisfies both `^0.4.22` and the historical library's `<0.4.25` condition.
- Modern React/Webpack and ethers use `window.ethereum`; no legacy Web3 injection extension is needed. React uses `createElement`, so Babel presets are not required.
- Bets, settlement and claims are separated; query IDs, per-round bets and liabilities are tracked. Repeated callbacks and duplicate claims are rejected. No-winner and expiry behavior is explicit.
- Only the local build substitutes the mock oracle. The public frontend contains live-library bytecode.

Legacy compiler and dependency warnings are expected. The project is isolated and uses test funds only. Compatibility warnings do not certify security. The test suite is not a formal audit.

## Sources and licenses

Tutorial: https://medium.com/@merunasgrincalaitis/the-ultimate-end-to-end-tutorial-to-create-and-deploy-a-fully-descentralized-dapp-in-ethereum-18f0cf6d7e0e

Original source: https://github.com/merlox/casino-ethereum/tree/c23bab027e22d829fafa69a99e07ef2c89512020 (MIT, Copyright 2017 merlox; see TUTORIAL_LICENSE.txt).

Oracle source: https://github.com/provable-things/ethereum-api/blob/a67a1d9bd5f57a5cc80386e2e67bbfd58d07fa14/old-contracts/previous-api-contracts/oraclizeAPI_0.4.sol (see ORACLE_LICENSE.txt and its embedded license).

Wallet: https://docs.metamask.io/metamask-connect/evm/reference/provider-api/

IPFS: https://docs.ipfs.tech/how-to/websites-on-ipfs/custom-domains/

AI assistance: ChatGPT/Codex drafted and revised the adaptation, ran automated local tests, and prepared documentation. Student review and course AI-policy compliance remain necessary.
