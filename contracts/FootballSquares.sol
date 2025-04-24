// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FootballSquares {
    address public owner;
    uint256 public entryPrice;
    bool public gameStarted;
    bool public gameEnded;

    struct Square {
        address player;
        uint8 row; // 0-9
        uint8 col; // 0-9
    }

    Square[100] public squares;
    mapping(address => uint8[]) public playerSquares; // track user's square indices

    uint8 public homeScoreLastDigit;
    uint8 public awayScoreLastDigit;

    event SquarePurchased(address indexed player, uint8 index);
    event GameStarted();
    event GameEnded(uint8 homeScore, uint8 awayScore, address winner, uint256 prize);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenGameActive() {
        require(gameStarted && !gameEnded, "Game not active");
        _;
    }

    constructor(uint256 _entryPrice) {
        owner = msg.sender;
        entryPrice = _entryPrice;
    }

    function startGame() external onlyOwner {
        require(!gameStarted, "Game already in progress");
        gameStarted = true;
        emit GameStarted();
    }

    function buySquare(uint8 index) external payable whenGameActive {
        require(index < 100, "Invalid index");
        require(msg.value == entryPrice, "Incorrect payment");
        require(squares[index].player == address(0), "Square taken");

        uint8 row = index / 10;
        uint8 col = index % 10;

        squares[index] = Square(msg.sender, row, col);
        playerSquares[msg.sender].push(index);

        emit SquarePurchased(msg.sender, index);
    }

    function endGame(uint8 _homeScore, uint8 _awayScore) external onlyOwner {
        require(gameStarted && !gameEnded, "Game state invalid");

        homeScoreLastDigit = _homeScore % 10;
        awayScoreLastDigit = _awayScore % 10;

        // Calculate winning square
        uint8 winningIndex = homeScoreLastDigit * 10 + awayScoreLastDigit;
        address winner = squares[winningIndex].player;
        require(winner != address(0), "No winner");

        gameEnded = true;
        uint256 prize = address(this).balance;
        payable(winner).transfer(prize);

        emit GameEnded(_homeScore, _awayScore, winner, prize);
    }

    function resetGame() external onlyOwner {
        require(gameEnded, "Game not ended");
        
        // Reset game state
        gameStarted = false;
        gameEnded = false;
        homeScoreLastDigit = 0;
        awayScoreLastDigit = 0;
        
        // Clear all squares
        for (uint8 i = 0; i < 100; i++) {
            squares[i] = Square(address(0), 0, 0);
        }
        
        // Clear player squares mapping
        for (uint8 i = 0; i < 100; i++) {
            address player = squares[i].player;
            if (player != address(0)) {
                delete playerSquares[player];
            }
        }
    }

    function forceReset() external onlyOwner {
        // First, clear all player squares mappings
        for (uint8 i = 0; i < 100; i++) {
            address player = squares[i].player;
            if (player != address(0)) {
                delete playerSquares[player];
            }
        }
        
        // Then reset game state variables
        gameStarted = false;
        gameEnded = false;
        homeScoreLastDigit = 0;
        awayScoreLastDigit = 0;
        
        // Finally, clear all squares
        for (uint8 i = 0; i < 100; i++) {
            squares[i] = Square(address(0), 0, 0);
        }
    }

    function getMySquares(address player) external view returns (uint8[] memory) {
        return playerSquares[player];
    }
}
