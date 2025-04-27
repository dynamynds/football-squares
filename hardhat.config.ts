import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "./tasks/accounts";

dotenv.config();

if (!process.env.PRIVATE_KEY) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

if (!process.env.NEXT_PUBLIC_SEPOLIA_RPC) {
  throw new Error("Please set your NEXT_PUBLIC_SEPOLIA_RPC in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
      chainId: 11155111 // Sepolia chain ID
    },
    sepolia: {
      url: process.env.NEXT_PUBLIC_SEPOLIA_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
      gasMultiplier: 1.2
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
