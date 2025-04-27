import { ethers } from "hardhat";
import dotenv from "dotenv";
import { FootballSquares } from "../typechain-types";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY || !process.env.PRIVATE_KEY_2) {
    throw new Error("Please set PRIVATE_KEY and PRIVATE_KEY_2 in your .env file");
  }

  // Create two wallet instances
  const wallet1 = new ethers.Wallet(process.env.PRIVATE_KEY);
  const wallet2 = new ethers.Wallet(process.env.PRIVATE_KEY_2);

  // Connect to Sepolia network
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC);
  const signer1 = wallet1.connect(provider);
  const signer2 = wallet2.connect(provider);

  // Check balances
  const balance1 = await provider.getBalance(wallet1.address);
  const balance2 = await provider.getBalance(wallet2.address);
  console.log(`Wallet 1 balance: ${ethers.formatEther(balance1)} ETH`);
  console.log(`Wallet 2 balance: ${ethers.formatEther(balance2)} ETH`);

  // Get contract instance
  const contractAddress = "0xD02d6CbD95BCcf5bf235f544D1693783AfBA7f01";
  const contract = await ethers.getContractAt("FootballSquares", contractAddress, signer1) as FootballSquares;

  // Check game state
  const gameStarted = await contract.gameStarted();
  const gameEnded = await contract.gameEnded();
  console.log(`Game started: ${gameStarted}`);
  console.log(`Game ended: ${gameEnded}`);

  // Reset game if needed
  if (gameStarted) {
    if (gameEnded) {
      console.log("Resetting ended game...");
      const tx = await contract.resetGame();
      await tx.wait();
    } else {
      console.log("Force resetting active game...");
      const tx = await contract.forceReset();
      await tx.wait();
    }
    console.log("Game reset complete");

    // Verify game state after reset
    const gameStartedAfterReset = await contract.gameStarted();
    const gameEndedAfterReset = await contract.gameEnded();
    console.log(`Game state after reset - Started: ${gameStartedAfterReset}, Ended: ${gameEndedAfterReset}`);
  }

  // Start a new game
  console.log("Starting new game...");
  const startTx = await contract.startGame();
  await startTx.wait();
  console.log("Game started");

  // Verify game state after start
  const gameStartedAfterStart = await contract.gameStarted();
  console.log(`Game started state: ${gameStartedAfterStart}`);

  // Get entry price
  const entryPrice = await contract.entryPrice();
  console.log(`Entry price: ${ethers.formatEther(entryPrice)} ETH`);

  // Wallet 1 buys square 52
  console.log("Wallet 1 buying square 52...");
  const tx1 = await contract.connect(signer1).buySquare(52, { value: entryPrice });
  await tx1.wait();
  console.log("Square 52 purchased");

  // Wallet 2 buys square 53
  console.log("Wallet 2 buying square 53...");
  const tx2 = await contract.connect(signer2).buySquare(53, { value: entryPrice });
  await tx2.wait();
  console.log("Square 53 purchased");

  // End the game with a score that should make square 53 win
  console.log("Ending game with score 5-3...");
  const endTx = await contract.endGame(5, 3);
  await endTx.wait();
  console.log("Game ended");

  // Get the winning square (should be 53)
  const winningSquare = await contract.squares(53);
  console.log(`Winning square owner: ${winningSquare.player}`);
  console.log(`Winning amount: ${ethers.formatEther(entryPrice * BigInt(2))} ETH`);

  // Check final balances
  const finalBalance1 = await provider.getBalance(wallet1.address);
  const finalBalance2 = await provider.getBalance(wallet2.address);
  console.log(`Final Wallet 1 balance: ${ethers.formatEther(finalBalance1)} ETH`);
  console.log(`Final Wallet 2 balance: ${ethers.formatEther(finalBalance2)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 