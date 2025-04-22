require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

// Add your network credentials here
module.exports = {
  solidity: "0.8.19",
  networks: {
    // For local development
    hardhat: {
    },
    // For Sepolia testnet
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: ["YOUR-PRIVATE-KEY"]
    }
  }
};