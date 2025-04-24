import { ethers } from "hardhat";
import { FootballSquares } from "../typechain-types";

async function main() {
  const contractAddress = "0xf708A5fd467c20d280ECdE1A6BD8bc283F87f24B";
  
  // Get the contract
  const FootballSquares = await ethers.getContractFactory("FootballSquares");
  const game = await FootballSquares.attach(contractAddress) as unknown as FootballSquares;

  console.log("Calling forceReset on contract:", contractAddress);
  
  try {
    const tx = await game.forceReset();
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("Force reset successful!");
    
    // Verify the state
    const gameStarted = await game.gameStarted();
    const gameEnded = await game.gameEnded();
    console.log("\nContract state after reset:");
    console.log("Game started:", gameStarted);
    console.log("Game ended:", gameEnded);
  } catch (error) {
    console.error("Error calling forceReset:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 