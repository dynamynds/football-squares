"use client";

import { useAccount, useContractRead, useContractWrite, useNetwork, useWaitForTransaction } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants';
import { useState, useEffect } from "react";

export const GameControls = () => {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [winningSquareIndex, setWinningSquareIndex] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);
  const [startGameTxHash, setStartGameTxHash] = useState<string | null>(null);
  const [endGameTxHash, setEndGameTxHash] = useState<string | null>(null);
  const [forceResetTxHash, setForceResetTxHash] = useState<string | null>(null);

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

  const { chain } = useNetwork();
  const isCorrectChain = chain?.id === 11155111; // Ethereum Sepolia chain ID

  const { writeAsync: startGame, isLoading: isStartingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "startGame",
    onSuccess: (data) => {
      setStartGameTxHash(data.hash);
    }
  });

  const { writeAsync: endGame, isLoading: isEndingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "endGame",
    onSuccess: (data) => {
      setEndGameTxHash(data.hash);
    }
  });

  const { writeAsync: forceReset, isLoading: isForceResetting } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "forceReset",
    onSuccess: (data) => {
      setForceResetTxHash(data.hash);
    }
  });

  const { isLoading: waitForStartGame } = useWaitForTransaction({
    hash: startGameTxHash as `0x${string}`,
    onSuccess: () => {
      setStartGameTxHash(null);
    }
  });

  const { isLoading: waitForEndGame } = useWaitForTransaction({
    hash: endGameTxHash as `0x${string}`,
    onSuccess: () => {
      setEndGameTxHash(null);
    }
  });

  const { isLoading: waitForForceReset } = useWaitForTransaction({
    hash: forceResetTxHash as `0x${string}`,
    onSuccess: () => {
      setForceResetTxHash(null);
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isCorrectChain) {
      alert("Please switch to Sepolia network");
      return;
    }

    if (!homeScore || !awayScore) {
      alert("Please enter both scores");
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      alert("Please enter valid scores");
      return;
    }

    try {
      if (gameEnded) {
        await forceReset?.();
        await waitForForceReset;
      }

      await startGame?.({
        args: [homeScoreNum, awayScoreNum] as [number, number]
      });
      await waitForStartGame;
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game. Please try again.");
    }
  };

  const handleEndGame = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isCorrectChain) {
      alert("Please switch to Sepolia network");
      return;
    }

    if (!homeScore || !awayScore) {
      alert("Please enter both scores");
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      alert("Please enter valid scores");
      return;
    }

    // Calculate winning square
    const winningRow = homeScoreNum % 10;
    const winningCol = awayScoreNum % 10;
    const winningIndex = winningRow * 10 + winningCol;

    try {
      await endGame?.({
        args: [homeScoreNum, awayScoreNum] as [number, number]
      });
      await waitForEndGame;
    } catch (error) {
      console.error("Error ending game:", error);
      if (error instanceof Error && error.message.includes("No winner")) {
        setError(`Cannot end game: The winning square (Row ${winningRow}, Column ${winningCol}) has not been purchased yet.`);
      } else {
        setError("Error ending game. Please try again.");
      }
    }
  };

  const isAdmin = owner?.toLowerCase() === address?.toLowerCase();

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="card">
      <h3>Admin Controls</h3>
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      {(!gameStarted || gameEnded) && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Score</label>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter home score"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Away Score</label>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter away score"
                min="0"
              />
            </div>
          </div>
          <button 
            onClick={handleStartGame}
            className="button"
            disabled={isStartingGame || isForceResetting}
          >
            {isStartingGame || isForceResetting ? "Processing..." : "Start New Game"}
          </button>
        </div>
      )}
      {gameStarted && !gameEnded && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Score</label>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter home score"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Away Score</label>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter away score"
                min="0"
              />
            </div>
          </div>
          {homeScore && awayScore && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">
                Winning square will be: Row {parseInt(homeScore) % 10}, Column {parseInt(awayScore) % 10}
              </p>
            </div>
          )}
          <button 
            onClick={handleEndGame}
            className="button"
            disabled={isEndingGame}
          >
            {isEndingGame ? "Processing..." : "End Game"}
          </button>
        </div>
      )}
    </div>
  );
}; 