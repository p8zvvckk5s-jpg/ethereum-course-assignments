import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ganache from "ganache";
import solc from "solc";
import { BrowserProvider, ContractFactory, parseEther } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const sources = {};
for (const name of ["HelloWorld.sol", "StorageTest.sol", "SafeVault.sol"]) {
  sources[name] = { content: fs.readFileSync(path.join(root, "contracts", name), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((entry) => entry.severity === "error");
assert.equal(errors.length, 0, errors.map((entry) => entry.formattedMessage).join("\n"));

const rpc = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 3 } });
const provider = new BrowserProvider(rpc);
const signer = await provider.getSigner(0);

async function deploy(file, name) {
  const artifact = output.contracts[file][name];
  const factory = new ContractFactory(artifact.abi, `0x${artifact.evm.bytecode.object}`, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  return contract;
}

const hello = await deploy("HelloWorld.sol", "HelloWorld");
assert.equal(await hello.hello.staticCall(), "Hello, world!");
const helloReceipt = await (await hello.hello()).wait();
assert.equal(helloReceipt.status, 1);

const storage = await deploy("StorageTest.sol", "StorageTest");
const values = Array.from({ length: 32 }, (_, index) => {
  const byte = (index + 1).toString(16).padStart(2, "0");
  return `0x${byte}${"00".repeat(31)}`;
});
const storageReceipt = await (await storage.put(values)).wait();
assert.equal(await storage.length(), 32n);
assert.equal(await storage.data(31), values[31]);

const vault = await deploy("SafeVault.sol", "SafeVault");
await (await vault.depositMoney({ value: parseEther("1") })).wait();
await (await vault.withdraw(parseEther("0.4"))).wait();
assert.equal(await vault.deposits(await signer.getAddress()), parseEther("0.6"));

const evidence = {
  compiler: solc.version(),
  optimizer: { enabled: true, runs: 200 },
  helloWorld: { returned: "Hello, world!", transactionGasUsed: helloReceipt.gasUsed.toString() },
  storage1KiB: {
    inputWords: 32,
    inputBytes: 1024,
    transactionGasUsed: storageReceipt.gasUsed.toString(),
    note: "Local Ganache measurement; network and compiler conditions are recorded separately in the report.",
  },
  safeVault: { remainingDepositWei: (await vault.deposits(await signer.getAddress())).toString() },
};
fs.mkdirSync(path.join(root, "evidence"), { recursive: true });
fs.writeFileSync(path.join(root, "evidence", "local-modern-tests.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
rpc.disconnect();
