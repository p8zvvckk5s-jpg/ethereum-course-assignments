# Assignment / Lab #3 — primary-source research notes

Research snapshot: **2026-10-16 (Asia/Shanghai)**. These notes use official Ethereum/Solidity/EIP documentation, first-party source repositories, Etherscan, and Parity's own incident report. They are research inputs rather than a claim that a live deployment or Remix experiment was performed.

## 1. Ethereum storage and gas

### 1(a) Memory versus storage

- `storage` is each contract account's persistent 256-bit-key/256-bit-value store. It survives calls and transactions, changes Ethereum state, and is comparatively expensive to initialize or modify.
- `memory` is a fresh, cleared, byte-addressed working area for each message call. It is temporary and disappears when the call ends. Expanding it costs gas, with the expansion component growing superlinearly/quadratically.
- Reference: Solidity, “Storage, Transient Storage, Memory and the Stack”: <https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html#storage-transient-storage-memory-and-the-stack>

### 1(b) Why zero-to-nonzero is more expensive than clearing a slot

- A zero-to-nonzero write creates a newly occupied persistent state-trie value, so `SSTORE_SET_GAS` is 20,000 gas.
- A nonzero slot already exists; resetting/changing it uses the lower reset schedule. Clearing it also helps state hygiene and can earn a refund. Under the current post-London schedule the clearing refund is **4,800 gas**, not the historical 15,000 quoted in the assignment.
- Exact `SSTORE` accounting is conditional on the slot's original, current, and new values. It is not accurately described by a universal “20,000 vs 5,000” rule anymore.
- EIP-2200 (structured `SSTORE` net metering): <https://eips.ethereum.org/EIPS/eip-2200>
- EIP-2929 (cold/warm state access; a first access to a slot adds a 2,100-gas cold-access charge): <https://eips.ethereum.org/EIPS/eip-2929>
- EIP-3529 (refund reduced to 4,800; refunds capped at one fifth of gas used): <https://eips.ethereum.org/EIPS/eip-3529>

### 1(c) Dated 1 KiB estimate requested by the assignment

The assignment says to count only zero-to-nonzero `SSTORE` operations and disregard everything else:

1. `1 KiB = 1,024 bytes`.
2. One storage word is `32 bytes`, so `1,024 / 32 = 32` slots.
3. Historical/simple schedule: `32 × 20,000 = 640,000 gas`.
4. Etherscan snapshot retrieved 2026-10-16: median gas price **0.12 Gwei** and ETH price **USD 1,860.26**.
5. `640,000 × 0.12 × 10^-9 = 0.0000768 ETH`.
6. `0.0000768 × 1,860.26 = USD 0.142867968`, approximately **USD 0.14**.

Etherscan sources:

- Etherscan main page (ETH price and median gas price): <https://etherscan.io/>
- Etherscan Gas Tracker: <https://etherscan.io/gastracker>

Assumptions to state in the answer: the values are a point-in-time snapshot; gas and ETH/USD fluctuate; this simplified number excludes cold-slot charges, transaction intrinsic gas, calldata, ABI decoding, memory, control flow, and array bookkeeping.

**Modern-protocol caveat:** if each of the 32 slots is cold, EIP-2929 adds `32 × 2,100 = 67,200` gas. Counting just the 32 cold zero-to-nonzero slot writes gives `707,200 gas`, about `0.000084864 ETH` or **USD 0.16** using the same snapshot. This caveat should be separate from the assignment's requested simplified 640,000-gas calculation.

### 1(d) Remix empirical experiment

The supplied contract stores a dynamic `bytes32[]`, so the actual transaction necessarily costs more than the 32-slot simplified estimate. Record the exact `gas used` from the Remix transaction receipt rather than inventing a value. At the same price snapshot, convert it with:

`USD = gasUsed × 0.12 × 10^-9 × 1,860.26`

The 32-element array provided by the assignment represents exactly 1 KiB of element data. The actual transaction additionally pays for:

- the base transaction/intrinsic charge;
- calldata bytes (including selector, dynamic-array offset, length, and data);
- dynamic-array length storage;
- cold-slot access charges;
- ABI decoding and memory expansion/copying;
- loop/index/control-flow and other EVM opcodes.

EIP-2028 reduced non-zero calldata from 68 to 16 gas per byte: <https://eips.ethereum.org/EIPS/eip-2028>. Modern data-heavy transactions can also be affected by the calldata floor introduced by EIP-7623: <https://eips.ethereum.org/EIPS/eip-7623>.

### 1(e) Three reasons actual gas is higher than the simple estimate

A concise answer can name: **(1)** the 21,000-gas transaction base/intrinsic charge and calldata charges, **(2)** the extra storage write for the dynamic array's length plus cold-slot access charges, and **(3)** ABI decoding, memory expansion/copying, and loop/control-flow opcodes. These are separate from the 32 simplified element `SSTORE`s.

## 2. July 2017 Parity multi-signature-wallet hack

### 2(a) Definitions

- A multi-signature wallet is a smart-contract wallet whose policy requires a threshold (for example, 2 of 3 owners) to approve an outgoing transaction. It reduces dependence on one private key.
- Parity was a Rust Ethereum client and wallet implementation developed by Parity Technologies. Its archived repository describes it as an Ethereum client for mission-critical use: <https://github.com/openethereum/parity-ethereum>.

### 2(b) `initWallet` root cause and prevention

Parity's own postmortem says the setup functions were supposed to be usable only while a wallet was being created, but they were “entirely unguarded.” The attacker called the publicly reachable initializer again on existing proxy wallets, reset owner/usage parameters, made the attacker's address an owner (effectively controlling the threshold), and then transferred the wallet funds.

Root cause: constructor-like initialization logic was implemented as an ordinary externally callable function and lacked an “only once / only during creation” guard. The proxy/library restructuring made this logic reachable through the wallet's forwarding mechanism.

Prevention:

- initialize ownership atomically during construction, or use a rigorously tested initializer modifier that rejects every call after the first;
- enforce explicit access control and valid owner/threshold invariants;
- avoid public setup functions on live instances;
- test proxy/library initialization and upgrades, review all `.sol` changes as security-critical, and use multisig/timelock defence in depth.

Primary incident source: Parity Technologies, “The Multi-sig Hack: A Postmortem,” 19 July 2017: <https://postmortem.io/incidents/parity--2017-07-19--multi-sig-wallet-hack-postmortem/>.

## 3. Abstract contract, interface, and library

- **Abstract contract:** a base contract that is not directly deployable because it is explicitly `abstract` and/or has unimplemented functions. It may contain state variables, constructors, implemented functions, modifiers, and abstract declarations. A concrete child must implement the remaining functions.
- **Interface:** an ABI-oriented promise of externally callable functions. It cannot contain implemented functions or state variables and cannot have a constructor; functions are external. A contract implements it through inheritance.
- **Library:** reusable code deployed once and normally run in the caller's context using `DELEGATECALL`; it is intended to be stateless and accesses caller storage only through explicitly supplied storage references. Libraries have additional restrictions and cannot be inherited like normal base contracts.

Solidity contracts documentation: <https://docs.soliditylang.org/en/latest/contracts.html#abstract-contracts>, <https://docs.soliditylang.org/en/latest/contracts.html#interfaces>, and <https://docs.soliditylang.org/en/latest/contracts.html#libraries>.

## 4. True / false statements

### 4(a) “Every pure function is a view function.”

**True in the conceptual/subset sense.** `pure` is stricter: it may neither read nor modify contract/blockchain state; `view` forbids modification but permits reads. Therefore every properly pure function satisfies the no-state-modification property of a view function, although Solidity uses distinct mutability labels.

### 4(b) “A transaction that calls a view function does not cost gas because it does not change state.”

**False.** An off-chain `eth_call` executes locally and charges no ETH, but an actual mined transaction consumes gas even if it calls a `view` function. The EVM still executes instructions and validators include the transaction. Ethereum JSON-RPC distinguishes `eth_call` (no transaction, returns returndata) from a sent transaction: <https://ethereum.org/developers/docs/apis/json-rpc/#eth_call>.

### 4(c) “A contract with no payable functions cannot receive Ether.”

**False as an absolute statement.** Ordinary value-bearing calls to nonpayable functions revert, but Ether can be forced to an address by protocol mechanisms such as `SELFDESTRUCT` balance transfer (and historically mining/block rewards). Therefore contract code cannot safely assume its balance is always zero merely because it has no payable entry point. Solidity security guidance: <https://docs.soliditylang.org/en/latest/security-considerations.html#sending-and-receiving-ether>.

### 4(d) “Solidity's standard int and uint datatypes can each hold 2^32 different values.”

**False.** Bare `int` and `uint` are aliases for `int256` and `uint256`, so each has **2^256** possible bit patterns/values. `uint256` ranges from `0` to `2^256 - 1`; `int256` ranges from `-2^255` to `2^255 - 1`. Solidity types documentation: <https://docs.soliditylang.org/en/latest/types.html#integers>.

### 4(e) “If msg.sender == tx.origin, this code was called directly by an externally owned account and not another smart contract.”

**True for the conventional EVM call chain described by these globals:** `msg.sender` is the immediate caller while `tx.origin` is the original transaction sender for the full call chain; they normally differ after an intervening contract call. However, **never use `tx.origin` for authorization**. Solidity explicitly warns against it: <https://docs.soliditylang.org/en/latest/security-considerations.html#tx-origin> and defines the globals at <https://docs.soliditylang.org/en/latest/units-and-global-variables.html#block-and-transaction-properties>.

Solidity mutability definitions (`pure`, `view`, `payable`): <https://docs.soliditylang.org/en/latest/cheatsheet.html#function-visibility-specifiers>.

## 5. Hello World on an Ethereum test network

### 5(a) What a test network is and why to use one

A testnet is a separate Ethereum-protocol network whose balances and transaction history do not carry over to Mainnet. It provides a production-like environment for testing contracts and dapps without risking real-value Mainnet ETH. Test ETH is intended to have no real value and is normally obtained from faucets.

Official network overview: <https://ethereum.org/developers/docs/networks/>.

### 5(b) Current major public Ethereum testnets

As of 2026-10-16, ethereum.org lists **Sepolia** and **Hoodi** as the two public testnets maintained by client developers:

- **Sepolia:** recommended default for smart-contract and application development; smaller and easier to use; permissioned validator set controlled by client/testing teams.
- **Hoodi:** intended for protocol-upgrade, staking, and validator testing; open validator set, large state, longer sync, and more node-storage requirements.

Goerli and Holesky are historical/deprecated and should not be presented as current primary choices. Source: <https://ethereum.org/developers/docs/networks/#which-testnet-should-i-use>.

### 5(c) Wallet/faucet evidence

The assignment requires the student's own evidence: wallet address, Sepolia balance/faucet transaction hash, retrieval date, and an Etherscan link. Do not fabricate these. Ethereum.org lists current Sepolia faucets on the network page above.

### 5(d) Minimal Solidity Hello World

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.5.1 <0.6.0;

contract HelloWorld {
    function hello() public pure returns (string memory) {
        return "Hello, world!";
    }
}
```

For current Solidity one would normally use a recent `0.8.x` compiler, but the range above directly satisfies the assignment's “compiler version >= 0.5.1” wording while remaining compatible with the old syntax context.

### 5(e) Compiler, optimization, and ABI

- Example: `solc --optimize --abi --bin HelloWorld.sol`.
- Solidity says to activate the optimizer before deployment; by default its run-count assumption is 200: <https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options>.
- The ABI is the typed schema and binary encoding used by external software and other contracts to identify functions and encode/decode function arguments, returns, errors, and events. The first four calldata bytes are the function selector. Official ABI specification: <https://docs.soliditylang.org/en/latest/abi-spec.html>.

### 5(f) `--bin` versus `--bin-runtime`

- `--bin` outputs **creation/init bytecode**: constructor/setup code plus the embedded runtime code. This is what is sent in a contract-creation transaction.
- `--bin-runtime` outputs only the **runtime bytecode** that remains at the new contract address after creation; it omits constructor/init execution.
- Therefore use **`--bin` to deploy**. Use `--bin-runtime` to inspect/compare the deployed code.

Primary compiler source distinguishes `object(_contract)` as binary from `runtimeObject(_contract)` as binary-runtime: <https://github.com/argotorg/solidity/blob/develop/solc/CommandLineInterface.cpp>. General compiler usage: <https://docs.soliditylang.org/en/latest/using-the-compiler.html>.

### 5(g) Calling the function and finding its output

- If `hello()` is called normally as a `pure`/`view` function, a wallet/library uses `eth_call`, which creates no transaction and directly returns ABI-encoded returndata.
- If a real transaction is deliberately sent, Etherscan shows the transaction input, status, gas, logs, and state changes, but a top-level Solidity return value is **not a field in the standard transaction receipt**. To make a result permanently visible in a transaction, emit an event and inspect its logs; alternatively call the function with `eth_call` and decode the returned bytes.
- Ethereum JSON-RPC source: `eth_call` returns the executed contract's return value, whereas `eth_getTransactionReceipt` contains status/gas/logs but no return-data field: <https://ethereum.org/developers/docs/apis/json-rpc/#eth_call> and <https://ethereum.org/developers/docs/apis/json-rpc/#eth_gettransactionreceipt>.

## 6. `address.call`, reentrancy, and prevention

### 6(a) Basic contract behavior

`depositMoney()` accepts ETH and credits `deposits[msg.sender]`. `withdraw(amount)` checks that the caller's recorded balance is sufficient, sends `amount` ETH to the caller, and only afterward subtracts `amount` from the recorded deposit.

### 6(b) What the low-level call does

In Solidity 0.4.24, `msg.sender.call.value(amount)()` performs a low-level external message call to `msg.sender`, transfers `amount` wei, supplies empty calldata, and forwards essentially all available gas subject to EVM call rules. If the recipient is a contract, its fallback function executes. The expression returns `false` on failure; the surrounding code reverts in that case.

### 6(c) Reentrancy problem

The external call occurs before `deposits[msg.sender]` is reduced. A malicious recipient fallback can call `withdraw(amount)` again while the original invocation is paused. The repeated call sees the same unchanged credited balance and sends again. Recursion can continue until the victim lacks enough ETH/gas or another condition stops it. When the nested calls unwind, the subtraction occurs too late; in Solidity 0.4.x unchecked arithmetic can also underflow after multiple subtractions.

Official Solidity reentrancy explanation and vulnerable `call` example: <https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy>.

### 6(d) Educational attacker pattern

For a **local/authorized test only**, an attacker contract deposits through the target, calls `withdraw`, and uses its payable fallback to re-enter `withdraw` before the target updates the balance. The recursive fallback should stop when the target balance is less than one withdrawal unit. This demonstrates the flaw; it must not be used against contracts or funds without explicit authorization.

### 6(e) Prevention

Primary fix: follow **Checks–Effects–Interactions**. Save the amount locally and reduce/zero the caller's balance *before* making the external call; if the call fails, `require(success)` reverts the entire transaction, including the state update.

Additional defence in depth:

- add a reentrancy mutex/guard;
- use a pull-withdrawal design;
- keep external calls last and minimize them;
- check every low-level call's return value;
- compile with Solidity 0.8+ for checked arithmetic (although checked arithmetic alone does not fix reentrancy).

Official Solidity guidance and fixed Checks–Effects–Interactions example: <https://docs.soliditylang.org/en/latest/security-considerations.html#use-the-checks-effects-interactions-pattern>.

## Source list (primary/first-party)

1. Ethereum Foundation/community documentation — Networks: <https://ethereum.org/developers/docs/networks/>
2. Ethereum JSON-RPC documentation: <https://ethereum.org/developers/docs/apis/json-rpc/>
3. Solidity documentation — latest: <https://docs.soliditylang.org/en/latest/>
4. Solidity compiler source: <https://github.com/argotorg/solidity>
5. EIP-2200: <https://eips.ethereum.org/EIPS/eip-2200>
6. EIP-2929: <https://eips.ethereum.org/EIPS/eip-2929>
7. EIP-3529: <https://eips.ethereum.org/EIPS/eip-3529>
8. EIP-2028: <https://eips.ethereum.org/EIPS/eip-2028>
9. Parity Technologies incident postmortem: <https://postmortem.io/incidents/parity--2017-07-19--multi-sig-wallet-hack-postmortem/>
10. Archived Parity Ethereum repository: <https://github.com/openethereum/parity-ethereum>
11. Etherscan: <https://etherscan.io/> and <https://etherscan.io/gastracker>
