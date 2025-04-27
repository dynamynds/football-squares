import { ethers } from "hardhat";

async function main() {
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("New wallet generated:");
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  
  console.log("\nAdd this to your .env file:");
  console.log(`PRIVATE_KEY2=${wallet.privateKey}`);
  
  console.log("\nIMPORTANT: Make sure to fund this wallet with some ETH on Sepolia testnet!");
  console.log("You can get test ETH from a Sepolia faucet.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 