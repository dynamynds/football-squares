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
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

  const { data: entryPrice } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "entryPrice",
  }) as { data: bigint | undefined };

  const { data: gameStarted, isLoading: isLoadingGameStarted } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "gameStarted",
    onSuccess: (data) => {
      console.log('Game started state:', data);
    }
  }) as { data: boolean | undefined; isLoading: boolean };

  const { data: gameEnded, isLoading: isLoadingGameEnded } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "gameEnded",
    onSuccess: (data) => {
      console.log('Game ended state:', data);
    }
  }) as { data: boolean | undefined; isLoading: boolean };

  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "owner",
  }) as { data: string | undefined };

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

  // Get all squares using a loop
  const squaresData: [string, number, number][] = [];
  const squareRefetchers: (() => void)[] = [];

  for (let i = 0; i < 100; i++) {
    const { data: square, refetch: refetchSquare } = useContractRead({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "squares",
      args: [BigInt(i)],
      watch: true,
      cacheTime: 0,
    }) as { data: [string, number, number] | undefined, refetch: () => void };

    if (square) {
      squaresData.push(square);
    }
    squareRefetchers.push(refetchSquare);
  }

  // Periodically refetch all squares data
  useEffect(() => {
    const interval = setInterval(() => {
      squareRefetchers.forEach(refetch => refetch());
    }, 5000); // Refetch every 5 seconds

    return () => clearInterval(interval);
  }, [squareRefetchers]);

  // Calculate total squares sold from squaresData
  const totalSquaresSold = squaresData.filter(square => square[0] !== '0x0000000000000000000000000000000000000000').length;
  const currentPrizePool = BigInt(totalSquaresSold) * (entryPrice || BigInt(0));

  const winningSquareIndex = gameEnded && homeScoreLastDigit !== undefined && awayScoreLastDigit !== undefined
    ? Number(homeScoreLastDigit) * 10 + Number(awayScoreLastDigit)
    : null;

  const winningSquare = winningSquareIndex !== null && squaresData[winningSquareIndex]
    ? squaresData[winningSquareIndex]
    : null;

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
            {isLoadingGameStarted || isLoadingGameEnded ? 'Loading...' : 
             gameEnded ? 'Ended' : 
             gameStarted ? 'In Progress' : 
             'Not Started'}
          </span>
        </div>
        
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-sm text-gray-500">
            <p>Debug Info:</p>
            <p>gameStarted: {String(gameStarted)}</p>
            <p>gameEnded: {String(gameEnded)}</p>
          </div>
        )}

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
                {winningSquare[0] === address ? 'You!' : winningSquare[0]}
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
      </div>
    </div>
  );
}; 