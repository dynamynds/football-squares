import { ethers } from "hardhat";

async function main() {
  // Get signers from Hardhat's local network
  const signers = await ethers.getSigners();
  
  console.log("Hardhat funded accounts:");
  for (let i = 0; i < Math.min(3, signers.length); i++) {
    console.log(`\nAccount ${i + 1}:`);
    console.log("Address:", signers[i].address);
  }

  // Get the network info
  const network = await ethers.provider.getNetwork();
  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.chainId);

  console.log("\nThese accounts are already funded in the local Hardhat network.");
  console.log("To use them in your test script, you can get them like this:");
  console.log(`
const [owner, player1, player2] = await ethers.getSigners();
// Then use them like:
const gameWithPlayer1 = game.connect(player1);
await gameWithPlayer1.buySquare(47, { value: ethers.parseEther("0.01") });
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 