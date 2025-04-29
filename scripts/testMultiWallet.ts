import { ethers } from "hardhat";
import dotenv from "dotenv";
import { FootballSquares } from "../typechain-types";

dotenv.config();

async function main() {
  const privateKey1 = process.env.PRIVATE_KEY;
  const privateKey2 = process.env.PRIVATE_KEY2;

  if (!privateKey1 || !privateKey2) {
    throw new Error("Please set both PRIVATE_KEY and PRIVATE_KEY2 in .env file");
  }

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer1 = new ethers.Wallet(privateKey1, provider);
  const signer2 = new ethers.Wallet(privateKey2, provider);
  
  console.log("Using addresses:");
  console.log("Wallet 1:", await signer1.getAddress());
  console.log("Wallet 2:", await signer2.getAddress());
  
  // Check balances
  const balance1 = await provider.getBalance(await signer1.getAddress());
  const balance2 = await provider.getBalance(await signer2.getAddress());
  console.log("Balances:");
  console.log("Wallet 1:", ethers.formatEther(balance1), "ETH");
  console.log("Wallet 2:", ethers.formatEther(balance2), "ETH");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS in .env file");
  }

  const contract1 = await ethers.getContractAt("FootballSquares", contractAddress, signer1) as FootballSquares;
  const contract2 = await ethers.getContractAt("FootballSquares", contractAddress, signer2) as FootballSquares;

  // Check game state
  const gameStarted = await contract1.gameStarted();
  const gameEnded = await contract1.gameEnded();
  
  console.log("Game started state:", gameStarted);
  console.log("Game ended state:", gameEnded);

  if (gameStarted && !gameEnded) {
    console.log("Game is already in progress. Cannot start a new game.");
    return;
  }

  if (gameEnded) {
    console.log("Resetting game...");
    await contract1.forceReset();
    console.log("Game reset complete");
  }

  // Set team names
  console.log("Setting team names...");
  const tx = await contract1.setTeamNames("Steelers", "Cardinals");
  await tx.wait();
  console.log("Team names set successfully");

  // Start the game
  console.log("Starting game...");
  const startTx = await contract1.startGame();
  await startTx.wait();
  console.log("Game started successfully");

  // Wallet 1 purchases square 52
  console.log("Wallet 1 purchasing square 52...");
  const tx1 = await contract1.buySquare(52, { value: await contract1.entryPrice() });
  await tx1.wait();
  console.log("Square 52 purchased by Wallet 1");

  // Wallet 2 purchases square 53
  console.log("Wallet 2 purchasing square 53...");
  const tx2 = await contract2.buySquare(53, { value: await contract2.entryPrice() });
  await tx2.wait();
  console.log("Square 53 purchased by Wallet 2");

  // Display current prize pool
  const entryPrice = await contract1.entryPrice();
  const totalSquaresSold = await contract1.getTotalSquaresSold();
  const prizePool = entryPrice * BigInt(totalSquaresSold);
  console.log("Current prize pool:", ethers.formatEther(prizePool), "ETH");

  // End the game with a score that would hit square 52 (empty)
  // This should make square 53 win (next to the right)
  console.log("Ending game with score (5,2) - square 52 is empty, so square 53 should win...");
  const endTx = await contract1.endGame(5, 2);
  await endTx.wait();
  console.log("Game ended successfully");

  // Display final results
  const homeScore = await contract1.homeScoreLastDigit();
  const awayScore = await contract1.awayScoreLastDigit();
  console.log("Final score digits - Home:", homeScore, "Away:", awayScore);

  const winningSquare = homeScore * 10 + awayScore;
  console.log("Winning square:", winningSquare);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 