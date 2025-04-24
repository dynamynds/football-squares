"use client";

import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants';
import { useState, useEffect } from "react";

export const GameControls = () => {
  const { address } = useAccount();
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [setScoreTxHash, setSetScoreTxHash] = useState<string | null>(null);

  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "owner",
  }) as { data: string | undefined };

  const { data: gameStarted } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "gameStarted",
  }) as { data: boolean | undefined };

  const { data: gameEnded } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "gameEnded",
  }) as { data: boolean | undefined };

  const { data: homeScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "homeScoreLastDigit",
  }) as { data: number | undefined };

  const { data: awayScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "awayScoreLastDigit",
  }) as { data: number | undefined };

  const { data: squares } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getMySquares",
    args: [address as `0x${string}`],
    enabled: !!address,
  }) as { data: number[] | undefined };

  // Add debug logging for squares
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

  const [winningSquareIndex, setWinningSquareIndex] = useState<number | null>(null);

  const { data: winningSquareOwner } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "squares",
    args: [winningSquareIndex],
    enabled: winningSquareIndex !== null,
  }) as { data: [string, number, number] | undefined };

  const { write: endGame, isLoading: isEndingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'endGame',
    args: [parseInt(homeScore), parseInt(awayScore)],
    onSuccess: () => {
      setHomeScore("");
      setAwayScore("");
    }
  });

  const isAdmin = owner?.toLowerCase() === address?.toLowerCase();
  const hasWinningSquare = gameEnded && homeScoreLastDigit !== undefined && awayScoreLastDigit !== undefined;

  const handleSetScores = () => {
    if (!homeScore || !awayScore) {
      alert("Please enter both scores");
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      alert("Please enter valid numbers");
      return;
    }

    if (!gameStarted) {
      alert("Game has not started yet");
      return;
    }

    if (!squares || squares.length === 0) {
      alert("Cannot end game: No squares have been purchased yet");
      return;
    }

    // Calculate the winning square index
    const homeLastDigit = homeScoreNum % 10;
    const awayLastDigit = awayScoreNum % 10;
    const winningSquareIndex = homeLastDigit * 10 + awayLastDigit;

    // Check if the winning square has been purchased
    const hasWinningSquare = squares.some(square => Number(square) === winningSquareIndex);
    console.log("Winning square index:", winningSquareIndex);
    console.log("Purchased squares:", squares);
    console.log("Has winning square:", hasWinningSquare);

    if (!hasWinningSquare) {
      alert(`No winner: The winning square (Row ${homeLastDigit}, Column ${awayLastDigit}) has not been purchased.\n\nYou can either:\n1. Wait for someone to purchase this square\n2. Try different scores that match a purchased square`);
      return;
    }

    endGame?.();
  };

  // Check if the winning square has been purchased
  useEffect(() => {
    if (winningSquareOwner) {
      console.log("Winning square owner:", winningSquareOwner);
      if (winningSquareOwner[0] === "0x0000000000000000000000000000000000000000") {
        alert("No winner: The winning square has not been purchased");
        setWinningSquareIndex(null);
      } else {
        console.log("Calling endGame with scores:", homeScore, awayScore);
        endGame?.();
      }
    }
  }, [winningSquareOwner, endGame, homeScore, awayScore]);

  if (!isAdmin) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Game Controls</h2>
      
      {gameStarted && !gameEnded && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Score
              </label>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter home score"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Away Score
              </label>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter away score"
                min="0"
              />
            </div>
          </div>
          <button
            className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleSetScores}
            disabled={isEndingGame}
          >
            {isEndingGame ? "Ending Game..." : "End Game"}
          </button>
        </div>
      )}

      {gameEnded && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Home Score Last Digit</h3>
              <p className="text-2xl font-bold">{homeScoreLastDigit}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Away Score Last Digit</h3>
              <p className="text-2xl font-bold">{awayScoreLastDigit}</p>
            </div>
          </div>

          {hasWinningSquare && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Game Ended</h3>
              <p className="text-sm text-green-600">
                Winning Square: Row {homeScoreLastDigit}, Column {awayScoreLastDigit}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 