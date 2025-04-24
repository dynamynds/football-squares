"use client";

import { useState, useEffect } from "react";
import { useAccount, useNetwork, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/app/constants';
import { ENTRY_PRICE } from '@/app/contract-config';

interface SquareProps {
  row: number;
  col: number;
  isSelected: boolean;
  onSelect: () => void;
  owner: string | null;
  isWinningSquare: boolean;
}

const Square = ({ row, col, isSelected, onSelect, owner, isWinningSquare }: SquareProps) => {
  const { address } = useAccount();
  const isOwned = owner && owner.toLowerCase() === address?.toLowerCase();
  
  return (
    <div
      style={{
        width: '50px',
        height: '50px',
        border: '2px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: owner ? 'default' : 'pointer',
        backgroundColor: isSelected ? '#bfdbfe' : isOwned ? '#bbf7d0' : owner ? '#e5e7eb' : '#fff',
        position: 'relative',
        opacity: owner ? 0.7 : 1
      }}
      onClick={owner ? undefined : onSelect}
    >
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{row}</div>
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{col}</div>
      {owner && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          fontSize: '10px',
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '0 2px'
        }}>
          {isOwned ? 'You' : `${owner.slice(0, 4)}...${owner.slice(-4)}`}
        </div>
      )}
    </div>
  );
};

export const GameBoard = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [selectedSquares, setSelectedSquares] = useState<number[]>([]);
  const [totalCost, setTotalCost] = useState<bigint>(0n);
  const [squares, setSquares] = useState<Record<string, string>>({});
  const [winningSquare, setWinningSquare] = useState<[number, number] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | null>(null);
  const [startGameTxHash, setStartGameTxHash] = useState<string | null>(null);

  // Debug chain information
  useEffect(() => {
    console.log('Current chain:', chain);
    console.log('Chain ID:', chain?.id);
    console.log('Chain name:', chain?.name);
    console.log('Is connected:', isConnected);
  }, [chain, isConnected]);

  // Check if we're on the correct chain
  const isCorrectChain = chain?.id === 11155111; // Ethereum Sepolia chain ID

  // Read contract state
  const { data: entryPrice, refetch: refetchEntryPrice } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'entryPrice',
  }) as { data: bigint | undefined, refetch: () => void };

  const { data: gameStarted, refetch: refetchGameStarted } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'gameStarted',
  }) as { data: boolean | undefined, refetch: () => void };

  const { data: gameEnded, refetch: refetchGameEnded } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'gameEnded',
  }) as { data: boolean | undefined, refetch: () => void };

  const { data: homeScoreLastDigit, refetch: refetchHomeScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'homeScoreLastDigit',
  }) as { data: number | undefined, refetch: () => void };

  const { data: awayScoreLastDigit, refetch: refetchAwayScoreLastDigit } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'awayScoreLastDigit',
  }) as { data: number | undefined, refetch: () => void };

  // Get square owners with polling
  const { data: squaresData, refetch: refetchSquares } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'squares',
    args: [BigInt(0)], // Start with index 0
    watch: true,
    cacheTime: 0, // Disable caching to ensure fresh data
    enabled: true, // Always enable this read
  }) as { data: [string, number, number] | undefined, refetch: () => Promise<{ data: [string, number, number] | undefined }> };

  // Get all squares
  const [allSquares, setAllSquares] = useState<Record<number, [string, number, number]>>({});

  // Update all squares when data changes
  useEffect(() => {
    const fetchAllSquares = async () => {
      const squares: Record<number, [string, number, number]> = {};
      for (let i = 0; i < 100; i++) {
        try {
          const result = await refetchSquares();
          if (result.data) {
            squares[i] = result.data;
          }
        } catch (error) {
          console.error(`Error fetching square ${i}:`, error);
        }
      }
      setAllSquares(squares);
    };

    fetchAllSquares();
  }, [refetchSquares]);

  // Get user's squares only when address is available
  const { data: userSquares, refetch: refetchUserSquares } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMySquares',
    args: [address as `0x${string}`],
    enabled: !!address,
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  }) as { data: string | undefined };

  // Write contract
  const { write: buySquares, isLoading: isBuyingSquares } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "buySquare",
    onSuccess: (data) => {
      console.log("Purchase transaction sent:", data);
      setPurchaseTxHash(data.hash);
    },
    onError: (error) => {
      console.error("Error purchasing squares:", error);
      alert("Error purchasing squares. Please try again.");
    }
  });

  // Update squares data when contract data changes
  useEffect(() => {
    if (userSquares && Array.isArray(userSquares)) {
      const newSquares: Record<string, string> = {};
      
      // Convert userSquares to a map of owned squares
      userSquares.forEach((squareIndex: bigint) => {
        const row = Math.floor(Number(squareIndex) / 10);
        const col = Number(squareIndex) % 10;
        const key = `${row}-${col}`;
        newSquares[key] = address as string;
      });
      
      console.log('Updating squares with:', newSquares);
      setSquares(newSquares);
    }
  }, [userSquares, address]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUserSquares();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchUserSquares]);

  const { isLoading: isPurchaseTxPending } = useWaitForTransaction({
    hash: purchaseTxHash as `0x${string}`,
    onSuccess: async (data) => {
      console.log('Purchase transaction confirmed:', data);
      setPurchaseTxHash(null);
      // Clear selected squares and refresh game state
      setSelectedSquares([]);
      // Immediately refetch squares data
      await refetchSquares();
      // Then refetch everything else
      await refetchGameState();
    },
    onError: (error) => {
      console.error('Purchase transaction failed:', error);
      setPurchaseTxHash(null);
      alert('Failed to purchase square. Please try again.');
    }
  });

  // Add a function to refetch game state
  const refetchGameState = async () => {
    try {
      // Refetch all basic game state
      await Promise.all([
        refetchEntryPrice?.(),
        refetchGameStarted?.(),
        refetchGameEnded?.(),
        refetchHomeScoreLastDigit?.(),
        refetchAwayScoreLastDigit?.(),
        refetchSquares?.(),
      ]);

      // Refetch user squares separately if address exists
      if (address) {
        try {
          await refetchUserSquares?.();
        } catch (error) {
          console.error('Error refetching user squares:', error);
        }
      }
    } catch (error) {
      console.error('Error refetching game state:', error);
    }
  };

  // Update total cost when squares are selected
  useEffect(() => {
    if (entryPrice) {
      console.log('Effective entry price:', entryPrice);
      const cost = BigInt(selectedSquares.length) * entryPrice;
      console.log('Total cost:', cost);
      setTotalCost(cost);
    }
  }, [selectedSquares, entryPrice]);

  const handleSquareClick = (index: number) => {
    if (gameEnded) {
      return; // Don't allow selection if game has ended
    }
    
    setSelectedSquares(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isCorrectChain) {
      alert("Please switch to Sepolia network");
      return;
    }

    if (selectedSquares.length === 0) {
      alert("Please select at least one square");
      return;
    }

    console.log("Purchasing squares:", selectedSquares);
    console.log("Total cost:", formatEther(totalCost));

    try {
      buySquares?.({
        args: [selectedSquares[0]], // Buy one square at a time
        value: entryPrice
      });
    } catch (error) {
      console.error("Error purchasing squares:", error);
      alert("Error purchasing squares. Please try again.");
    }
  };

  // Update user squares when data changes
  useEffect(() => {
    if (userSquares) {
      console.log('User squares:', userSquares);
      // Update any UI state related to user squares here
    }
  }, [userSquares]);

  useEffect(() => {
    if (gameEnded && homeScoreLastDigit !== undefined && awayScoreLastDigit !== undefined) {
      setWinningSquare([
        Number(homeScoreLastDigit),
        Number(awayScoreLastDigit)
      ]);
    }
  }, [gameEnded, homeScoreLastDigit, awayScoreLastDigit]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update total squares sold display
  const totalSquaresSold = Object.keys(squares).length;

  const { write: startGame, isLoading: isStartingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'startGame',
    onSuccess: (data) => {
      console.log('Start game transaction sent:', data);
      setStartGameTxHash(data.hash);
    },
    onError: (error) => {
      console.error('Error starting game:', error);
      alert('Error starting game. Please try again.');
    }
  });

  const { isLoading: isStartingGameTx } = useWaitForTransaction({
    hash: startGameTxHash as `0x${string}`,
    onSuccess: (data) => {
      console.log('Start game transaction confirmed:', data);
      setStartGameTxHash(null);
      // Force a refresh of the game state
      refetchGameState();
    },
    onError: (error) => {
      console.error('Start game transaction failed:', error);
      setStartGameTxHash(null);
      alert('Failed to start game. Please try again.');
    }
  });

  if (!mounted) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Game Information</h2>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-11 gap-1 mb-6">
        {/* Column headers */}
        <div className="w-10 h-10"></div>
        {[...Array(10)].map((_, i) => (
          <div key={`col-${i}`} className="w-10 h-10 flex items-center justify-center font-bold bg-gray-100 border border-gray-300">
            {i}
          </div>
        ))}
        
        {/* Rows */}
        {[...Array(10)].map((_, row) => (
          <div key={`row-${row}`} className="contents">
            {/* Row header */}
            <div className="w-10 h-10 flex items-center justify-center font-bold bg-gray-100 border border-gray-300">
              {row}
            </div>
            
            {/* Squares */}
            {[...Array(10)].map((_, col) => {
              const key = `${row}-${col}`;
              const owner = squares[key];
              const isOwned = !!owner;
              const isOwnedByUser = owner?.toLowerCase() === address?.toLowerCase();
              const isWinningSquare = Boolean(
                gameEnded && 
                homeScoreLastDigit !== undefined && 
                awayScoreLastDigit !== undefined &&
                row === homeScoreLastDigit && 
                col === awayScoreLastDigit
              );
              
              return (
                <Square
                  key={key}
                  row={row}
                  col={col}
                  isSelected={selectedSquares.includes(row * 10 + col)}
                  onSelect={() => handleSquareClick(row * 10 + col)}
                  owner={owner}
                  isWinningSquare={isWinningSquare}
                />
              );
            })}
          </div>
        ))}
      </div>

      {selectedSquares.length > 0 && (
        <div className="mt-4">
          <p className="text-gray-600 mb-2">
            Selected Squares: {selectedSquares.length}
          </p>
          <p className="text-gray-600 mb-2">
            Total Cost: {formatEther(totalCost)} ETH
          </p>
          <button
            className={`w-full py-2 px-4 rounded ${
              isConnected && isCorrectChain
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handlePurchase}
            disabled={!isConnected || !isCorrectChain || isBuyingSquares || isPurchaseTxPending || gameEnded}
          >
            {isBuyingSquares || isPurchaseTxPending ? 'Processing...' : 'Purchase Selected Squares'}
          </button>
          {(isBuyingSquares || isPurchaseTxPending) && (
            <p className="text-gray-600 text-sm mt-2">
              Please confirm the transaction in your wallet
            </p>
          )}
        </div>
      )}
    </div>
  );
};
