"use client";

import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants';
import { useState, useEffect } from "react";

export const GameControls = () => {
  const { address, isConnected } = useAccount();
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [winningSquareIndex, setWinningSquareIndex] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);

  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "owner",
  });

  const { data: gameStarted } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "gameStarted",
  });

  const { data: gameEnded } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "gameEnded",
  });

  const { data: homeScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "homeScoreLastDigit",
  });

  const { data: awayScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "awayScoreLastDigit",
  });

  const { data: squares } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getMySquares",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: winningSquareOwner } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "squares",
    args: [winningSquareIndex],
    enabled: winningSquareIndex !== 0n,
  });

  const { writeAsync: startGame, isLoading: isStartingGame } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'startGame',
  });

  const { writeAsync: endGame, isLoading: isEndingGame } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'endGame',
    args: [parseInt(homeScore), parseInt(awayScore)],
  });

  const { writeAsync: forceReset, isLoading: isResetting } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'forceReset',
  });

  useEffect(() => {
    if (squares) {
      console.log("All purchased squares:", squares);
      squares.forEach(squareIndex => {
        const row = Math.floor(Number(squareIndex) / 10);
        const col = Number(squareIndex) % 10;
        console.log(`Square ${Number(squareIndex)}: Row ${row}, Column ${col}`);
      });
    }
  }, [squares]);

  useEffect(() => {
    if (winningSquareOwner) {
      console.log("Winning square owner:", winningSquareOwner);
      if (winningSquareOwner[0] === "0x0000000000000000000000000000000000000000") {
        console.log("No winner: The winning square has not been purchased");
        setWinningSquareIndex(0n);
      }
    }
  }, [winningSquareOwner]);

  const handleStartGame = async () => {
    try {
      setError(null);
      
      // If game is in progress, try to end it first
      if (gameStarted && !gameEnded) {
        try {
          await endGame();
          // Wait for the game to end
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error("Error ending game:", error);
          setError("Failed to end current game. Please try again.");
          return;
        }
      }

      // If game is started, try to force reset it
      if (gameStarted) {
        try {
          await forceReset();
          // Wait for reset to complete
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error("Error force resetting game:", error);
          setError("Failed to reset game state. Please try again.");
          return;
        }
      }

      // Start the new game
      try {
        await startGame();
      } catch (error) {
        console.error("Error starting game:", error);
        setError("Failed to start new game. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Error in game flow:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const isAdmin = owner?.toLowerCase() === address?.toLowerCase();

  if (!isConnected) {
    return (
      <div className="card">
        <h3>Game Controls</h3>
        <p>Please connect your wallet to control the game</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card">
        <h3>Game Controls</h3>
        <p>Only the admin can control the game</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Admin Controls</h3>
      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}
      {(!gameStarted || gameEnded) && (
        <button 
          onClick={handleStartGame}
          className="button"
          disabled={isStartingGame || isResetting}
        >
          {isStartingGame || isResetting ? "Processing..." : "Start New Game"}
        </button>
      )}
      {gameStarted && !gameEnded && (
        <button 
          onClick={() => endGame()}
          className="button"
          disabled={isEndingGame}
        >
          {isEndingGame ? "Ending Game..." : "End Game"}
        </button>
      )}
    </div>
  );
}; 