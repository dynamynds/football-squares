import { ethers } from "hardhat";

async function main() {
  // Get signers (Hardhat provides 20 test accounts)
  const signers = await ethers.getSigners();
  const [owner] = signers;

  // Fund all accounts with 1 ETH each
  console.log("Funding accounts...");
  for (let i = 1; i < signers.length; i++) {
    const signer = signers[i];
    await owner.sendTransaction({
      to: signer.address,
      value: ethers.parseEther("1.0")
    });
    console.log(`Funded account ${i}: ${signer.address}`);
  }

  // Deploy the contract
  const entryPrice = ethers.parseEther("0.1"); // 0.1 ETH per square
  const FootballSquares = await ethers.getContractFactory("FootballSquares");
  const game = await FootballSquares.deploy(entryPrice);
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
