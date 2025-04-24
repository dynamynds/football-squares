# Football Squares - Web3 Game Presentation

## Project Overview
A decentralized football squares game that brings the classic game to the blockchain, allowing players to purchase squares with ETH and win prizes based on the final score. This project demonstrates the practical application of Web3 technologies in creating engaging, transparent, and secure gaming experiences.

## Key Features
- 🎮 Interactive 10x10 game board with real-time updates
- 💰 ETH-based square purchases with secure transactions
- 🔒 Smart contract implementation with owner controls
- 📱 Modern, responsive design with dark mode
- 📊 Real-time game status and transaction history
- 👤 Seamless MetaMask wallet integration

## Tech Stack
- **Frontend**: 
  - Next.js 14 (App Router)
  - React 18
  - Tailwind CSS
  - TypeScript
- **Smart Contract**: 
  - Solidity
  - Hardhat
  - OpenZeppelin
- **Web3**: 
  - wagmi
  - ethers.js
  - MetaMask

## Architecture
```
Frontend (Next.js) <-> Web3 (wagmi) <-> Smart Contract (Solidity)
```

## Demo Flow
1. **Setup**
   - Connect MetaMask wallet
   - Switch to local network
   - Get test ETH from faucet

2. **Admin Actions**
   - Start new game
   - Set entry price
   - Monitor game status

3. **Player Actions**
   - Purchase available squares
   - View transaction history
   - Track prize pool

4. **Game End**
   - Admin inputs final score
   - Smart contract determines winner
   - Prize automatically distributed

## Smart Contract Features
- **Game Management**
  - Square purchase system
  - Game state transitions
  - Winner determination
  - Prize distribution
- **Security**
  - Owner-only controls
  - Secure ETH transfers
  - Transparent history
- **Data Tracking**
  - Square ownership
  - Transaction history
  - Prize pool calculation

## Security & Best Practices
- Owner-only game controls
- Secure ETH transfers
- Transparent transaction history
- Smart contract verification
- Input validation
- Error handling
- Gas optimization

## Testing
- Hardhat test suite
- Full grid simulation
- Edge case handling
- Gas usage optimization

## Future Enhancements
- Multiple concurrent games
- Custom entry prices
- Team selection
- Mobile optimization
- Social features
- NFT integration
- DAO governance

## Getting Started
```bash
# Clone repository
git clone https://github.com/dynamynds/football-squares.git
cd football-squares

# Install dependencies
npm install

# Start local network
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy.ts --network localhost

# Start development server
npm run dev
```

## Live Demo
- Local: http://localhost:3000
- Testnet: Coming soon!

## Contact & Resources
- GitHub: [dynamynds](https://github.com/dynamynds)
- Project: [Football Squares](https://github.com/dynamynds/football-squares)
- Documentation: [README.md](README.md)
- Smart Contract: [FootballSquares.sol](contracts/FootballSquares.sol) 