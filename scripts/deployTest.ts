import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }

  // Get the signer from the private key
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Using account: ${signer.address}`);

  // Check account balance
  const balance = await provider.getBalance(signer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  // Deploy the contract with a lower entry price for testing
  const entryPrice = ethers.parseEther("0.001"); // 0.001 ETH per square
  const FootballSquares = await ethers.getContractFactory("FootballSquares");
  const game = await FootballSquares.connect(signer).deploy(entryPrice);
  await game.waitForDeployment();

  console.log("Contract deployed to:", await game.getAddress());
  console.log("Entry price:", ethers.formatEther(entryPrice), "ETH");

  // Export the contract address for the test script
  console.log("\nCopy this address to use in the test script:");
  console.log(`export CONTRACT_ADDRESS=${await game.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 