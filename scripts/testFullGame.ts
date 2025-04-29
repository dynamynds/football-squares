import { ethers } from "hardhat";
import { FootballSquares } from "../typechain-types";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not set in .env file");
  }

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  const contractAddress = "0x123..."; // Replace with your contract address

  const contract = await ethers.getContractAt("FootballSquares", contractAddress, signer) as FootballSquares;

  // Check game state
  const gameStarted = await contract.gameStarted();
  const gameEnded = await contract.gameEnded();

  if (gameStarted && !gameEnded) {
    console.log("Game is already in progress. Resetting...");
    await contract.forceReset();
  }

  // Set team names
  console.log("Setting team names...");
  await contract.setTeamNames("Home Team", "Away Team");

  // Start game
  console.log("Starting game...");
  await contract.startGame();

  // Buy squares
  console.log("Buying squares...");
  await contract.buySquare(0, { value: await contract.entryPrice() });

  // Check total squares sold
  const totalSquares = await contract.getTotalSquaresSold();
  console.log(`Total squares sold: ${totalSquares.toString()}`);

  // Calculate prize pool
  const entryPrice = await contract.entryPrice();
  const prizePool = entryPrice * totalSquares;
  console.log(`Current prize pool: ${ethers.formatEther(prizePool)} ETH`);

  // End game
  console.log("Ending game...");
  await contract.endGame(7, 3);

  // Check winner
  const winner = await contract.squares(0);
  console.log(`Winner: ${winner[0]}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 