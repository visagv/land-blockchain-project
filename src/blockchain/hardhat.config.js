require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    ganache: {
      // Ganache GUI default RPC URL. If you use Ganache CLI, it's usually the same.
      url: "http://127.0.0.1:8545",
      // Ganache prints 10 test accounts with private keys when it starts.
      // Paste one of those private keys below (keep the 0x prefix).
      accounts: [process.env.GANACHE_PRIVATE_KEY || "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"],
    },
  },
};
