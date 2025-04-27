import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import type { FootballSquares } from "../typechain-types";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }

  const contractAddress = "0xD02d6CbD95BCcf5bf235f544D1693783AfBA7f01";
  console.log(`Testing game at address: ${contractAddress}`);

  // Get the signer from the private key
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Using account: ${signer.address}`);

  // Check account balance
  const balance = await provider.getBalance(signer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  // Get contract instance
  const contract = (await ethers.getContractAt("FootballSquares", contractAddress, signer)) as FootballSquares;

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
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Reset transaction failed");
    } else {
      console.log("Force resetting active game...");
      const tx = await contract.forceReset();
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Force reset transaction failed");
    }
    console.log("Game reset successfully!");
  }

  // Start new game
  console.log("Starting new game...");
  const startTx = await contract.startGame();
  const startReceipt = await startTx.wait();
  if (!startReceipt) throw new Error("Start game transaction failed");
  console.log("Game started successfully!");

  // Purchase one square to test the functionality
  console.log("Purchasing square...");
  const entryPrice = await contract.entryPrice();
  console.log(`Entry price: ${ethers.formatEther(entryPrice)} ETH`);
  
  // Purchase square 52
  const squareIndex = 52;
  const tx = await contract.buySquare(squareIndex, { value: entryPrice });
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction failed");
  console.log(`Purchased square ${squareIndex}`);

  // Verify square purchase
  console.log("\nVerifying square purchase:");
  const square = await contract.squares(squareIndex);
  console.log(`Square ${squareIndex}: owned by ${square.player}`);

  // Display current prize pool
  const prizePool = entryPrice;
  console.log(`\nCurrent prize pool: ${ethers.formatEther(prizePool)} ETH`);

  // End the game with a score that would hit square 51 (empty)
  // This should make square 52 win (next to the right)
  console.log("\nEnding game with score (5,1) - square 51 is empty, so square 52 should win...");
  const endTx = await contract.endGame(5, 1);
  const endReceipt = await endTx.wait();
  if (!endReceipt) throw new Error("End game transaction failed");
  console.log("Game ended successfully!");

  // Get the winning square (should be 52)
  const winningSquare = await contract.squares(52);
  console.log(`\nWinning square owner: ${winningSquare.player}`);
  console.log(`Winning amount: ${ethers.formatEther(prizePool)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 