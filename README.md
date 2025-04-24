# Football Squares - Web3 Game

A decentralized football squares game built with Next.js, Hardhat, and wagmi. Players can purchase squares on a 10x10 grid, and winners are determined by the final score of the game.

## Features

- 🎮 Interactive 10x10 game board
- 💰 Purchase squares with ETH
- 🔒 Secure smart contract implementation
- 📱 Responsive web design
- 🌙 Dark mode support
- 📊 Real-time game status and transaction history
- 👤 Wallet connection with MetaMask

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Smart Contract**: Solidity, Hardhat
- **Web3**: wagmi, ethers.js
- **Testing**: Hardhat, Chai

## Prerequisites

- Node.js (v16 or later)
- MetaMask wallet
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dynamynds/football-squares.git
cd football-squares
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

## Development

1. Start the local Hardhat network:
```bash
npx hardhat node
```

2. In a new terminal, deploy the contract:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the test suite:
```bash
npx hardhat test
```

Run the full grid test:
```bash
npx hardhat run scripts/testFullGrid.ts --network localhost
```

## Smart Contract

The `FootballSquares` contract implements the following features:
- Square purchase with ETH
- Game start/end controls
- Winner determination based on final score
- Prize distribution
- Transaction history tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Smart contract development with [Hardhat](https://hardhat.org/)
- Web3 integration with [wagmi](https://wagmi.sh/)
- Created by [dynamynds](https://github.com/dynamynds)
