"use client";

import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants';
import { parseEther, formatEther } from "viem";
import { useEffect, useState } from "react";

interface Square {
  player: string;
  row: number;
  col: number;
}

export const GameInfo = () => {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [startGameTxHash, setStartGameTxHash] = useState<string | null>(null);
  const [endGameTxHash, setEndGameTxHash] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

  const { data: entryPrice } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "entryPrice",
  }) as { data: bigint | undefined };

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

  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "owner",
  }) as { data: string | undefined };

  const { data: squaresData } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "squares",
  }) as { data: Square[] | undefined };

  const { data: homeScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'homeScoreLastDigit',
  });

  const { data: awayScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'awayScoreLastDigit',
  });

  const { data: prizePool } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalSquares',
  }) as { data: bigint | undefined };

  const totalSquaresSold = squaresData?.filter(square => square.player !== '0x0000000000000000000000000000000000000000').length || 0;
  const currentPrizePool = BigInt(totalSquaresSold) * (entryPrice || BigInt(0));

  const winningSquareIndex = gameEnded && homeScoreLastDigit !== undefined && awayScoreLastDigit !== undefined
    ? Number(homeScoreLastDigit) * 10 + Number(awayScoreLastDigit)
    : null;

  const winningSquare = winningSquareIndex !== null && squaresData
    ? squaresData[winningSquareIndex]
    : null;

  const { write: startGame, isLoading: isStartingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "startGame",
    onSuccess: (data) => {
      console.log('Start game transaction sent:', data);
      setStartGameTxHash(data.hash);
    },
    onError: (error) => {
      console.error('Error starting game:', error);
      alert('Error starting game. Please try again.');
    }
  });

  const { write: endGame, isLoading: isEndingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "endGame",
    args: [Number(homeScore), Number(awayScore)],
    onSuccess: (data) => {
      console.log('End game transaction sent:', data);
      setEndGameTxHash(data.hash);
    },
    onError: (error) => {
      console.error('Error ending game:', error);
      alert('Error ending game. Please try again.');
    }
  });

  const { isLoading: isStartingGameTx } = useWaitForTransaction({
    hash: startGameTxHash as `0x${string}`,
    onSuccess: (data) => {
      console.log('Start game transaction confirmed:', data);
      setStartGameTxHash(null);
    },
    onError: (error) => {
      console.error('Start game transaction failed:', error);
      setStartGameTxHash(null);
      alert('Failed to start game. Please try again.');
    }
  });

  const { isLoading: isEndingGameTx } = useWaitForTransaction({
    hash: endGameTxHash as `0x${string}`,
    onSuccess: (data) => {
      console.log('End game transaction confirmed:', data);
      setEndGameTxHash(null);
      setHomeScore('');
      setAwayScore('');
    },
    onError: (error) => {
      console.error('End game transaction failed:', error);
      setEndGameTxHash(null);
      alert('Failed to end game. Please try again.');
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-4 bg-white rounded-lg shadow mb-4">
        <h2 className="text-xl font-bold mb-2">Game Information</h2>
        <div className="space-y-2">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = owner?.toLowerCase() === address?.toLowerCase();
  const gameStatus = gameStarted ? (gameEnded ? "Ended" : "Active") : "Not Started";

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Game Information</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Game Status:</span>
          <span className={`font-semibold ${
            gameEnded ? 'text-red-500' :
            gameStarted ? 'text-green-500' :
            'text-yellow-500'
          }`}>
            {gameEnded ? 'Ended' : gameStarted ? 'In Progress' : 'Not Started'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Squares Sold:</span>
          <span className="font-semibold">{totalSquaresSold}/100</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Current Prize Pool:</span>
          <span className="font-semibold">{formatEther(currentPrizePool)} ETH</span>
        </div>

        {gameEnded && winningSquare && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Winning Square:</span>
              <span className="font-semibold">{winningSquareIndex}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Winner:</span>
              <span className="font-semibold">
                {winningSquare.player === address ? 'You!' : winningSquare.player}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prize Won:</span>
              <span className="font-semibold">{formatEther(currentPrizePool)} ETH</span>
            </div>
          </>
        )}

        {isConnected && (
          <p className="text-gray-600">
            Your Address: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        )}
        {isAdmin && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-700">Admin Controls</h3>
            {!gameStarted && (
              <button
                className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={() => startGame?.()}
                disabled={isStartingGame || isStartingGameTx}
              >
                {isStartingGame || isStartingGameTx ? "Starting Game..." : "Start Game"}
              </button>
            )}
            {gameStarted && !gameEnded && (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Home Score"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Away Score"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                </div>
                <button
                  className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={() => endGame?.()}
                  disabled={isEndingGame || isEndingGameTx || !homeScore || !awayScore}
                >
                  {isEndingGame || isEndingGameTx ? "Ending Game..." : "End Game"}
                </button>
              </div>
            )}
            {gameEnded && (
              <button
                className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={() => startGame?.()}
                disabled={isStartingGame || isStartingGameTx}
              >
                {isStartingGame || isStartingGameTx ? "Starting Game..." : "Start New Game"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 