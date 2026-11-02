const ganache = require("ganache");
let testProvider;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    test: {
      provider: () => {
        if (!testProvider) {
          testProvider = ganache.provider({
            logging: { quiet: true },
            wallet: { deterministic: true }
          });
        }
        return testProvider;
      },
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "./node_modules/solc/soljson.js",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  mocha: {
    timeout: 100000
  }
};
