require("dotenv").config();
const { Web3 } = require("web3");

const endpoint = process.env.INFURA_MAINNET_URL;
if (!endpoint || endpoint.includes("YOUR_INFURA_PROJECT_ID")) {
  throw new Error("Set INFURA_MAINNET_URL in a local .env file before running the scanner.");
}

const startBlock = Number(process.env.START_BLOCK || 0);
const endBlock = Number(process.env.END_BLOCK || 60000);
const batchSize = Math.max(1, Number(process.env.BATCH_SIZE || 10));
const web3 = new Web3(endpoint);

async function findFirstContractCreation() {
  for (let first = startBlock; first <= endBlock; first += batchSize) {
    const last = Math.min(first + batchSize - 1, endBlock);
    const numbers = Array.from({ length: last - first + 1 }, (_, index) => first + index);
    const blocks = await Promise.all(numbers.map((number) => web3.eth.getBlock(number, true)));

    for (const block of blocks) {
      const creation = block.transactions.find((transaction) => transaction.to === null);
      if (creation) {
        console.log(JSON.stringify({
          blockNumber: Number(block.number),
          transactionHash: creation.hash,
          creator: creation.from,
          contractAddress: "Read the transaction receipt to obtain the created address"
        }, null, 2));
        return creation.hash;
      }
    }

    console.log(`Scanned through block ${last}`);
  }

  throw new Error(`No contract-creation transaction was found in blocks ${startBlock}-${endBlock}.`);
}

findFirstContractCreation()
  .then(async (hash) => {
    const receipt = await web3.eth.getTransactionReceipt(hash);
    console.log(`Created contract address: ${receipt.contractAddress}`);
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
