import { ethers } from "hardhat";
import { FootballSquares } from "../typechain-types";
import { expect } from "chai";

async function main() {
  // Get signers (Hardhat provides 20 test accounts)
  const signers = await ethers.getSigners();
  const [owner] = signers;

  // Deploy the contract
  const entryPrice = ethers.parseEther("0.01"); // 0.01 ETH per square
  const FootballSquares = await ethers.getContractFactory("FootballSquares");
  const game = await FootballSquares.deploy(entryPrice);
  await game.waitForDeployment();

  console.log("Contract deployed to:", await game.getAddress());

  // Start the game
  console.log("Starting game...");
  await game.startGame();
  console.log("Game started!");

  // Calculate the winning square index based on the final score
  const homeScore = 24;
  const awayScore = 17;
  const homeLastDigit = homeScore % 10;
  const awayLastDigit = awayScore % 10;
  const winningSquareIndex = homeLastDigit * 10 + awayLastDigit;
  
  console.log(`Winning square will be: ${winningSquareIndex} (${homeLastDigit}-${awayLastDigit})`);

  // Purchase squares, ensuring the winning square is purchased
  console.log("Purchasing squares...");
  const numSquares = 20; // We'll test with 20 squares for now
  
  // First, purchase the winning square
  const winningSquareSigner = signers[0];
  const gameWithWinner = game.connect(winningSquareSigner);
  await gameWithWinner.buySquare(winningSquareIndex, { value: entryPrice });
  console.log(`Winning square ${winningSquareIndex} purchased by ${winningSquareSigner.address}`);
  
  // Then purchase other squares
  for (let i = 0; i < numSquares; i++) {
    if (i === winningSquareIndex) continue; // Skip the winning square as it's already purchased
    
    const signer = signers[i % signers.length];
    const gameWithSigner = game.connect(signer);
    
    try {
      await gameWithSigner.buySquare(i, { value: entryPrice });
      console.log(`Square ${i} purchased by ${signer.address}`);
    } catch (error) {
      console.error(`Failed to purchase square ${i}:`, error);
    }
  }

  // Show current prize pool before ending the game
  const currentPrizePool = await ethers.provider.getBalance(await game.getAddress());
  console.log("\nCurrent Prize Pool:", ethers.formatEther(currentPrizePool), "ETH");

  // End the game
  console.log(`\nEnding game with score: ${homeScore}-${awayScore}`);
  
  try {
    await game.endGame(homeScore, awayScore);
    console.log("Game ended successfully!");
    
    // Get the winner
    const winningSquare = await game.squares(winningSquareIndex);
    
    console.log("\nGame Results:");
    console.log("-------------");
    console.log(`Winning Square: ${winningSquareIndex}`);
    console.log(`Winner: ${winningSquare.player}`);
    console.log(`Prize Won: ${ethers.formatEther(currentPrizePool)} ETH`);
  } catch (error) {
    console.error("Failed to end game:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 