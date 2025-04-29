"use client";

import { useState, useEffect } from "react";
import { useAccount, useNetwork, useContractRead, useContractWrite, useWaitForTransaction, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI, TEAM_NAMES } from '@/app/constants';
import { ENTRY_PRICE } from '@/app/contract-config';
import React from "react";

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
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        width: '60px',
        height: '60px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: owner ? 'default' : 'pointer',
        backgroundColor: isSelected 
          ? 'rgba(99, 102, 241, 0.1)' 
          : isOwned 
            ? 'rgba(16, 185, 129, 0.1)' 
            : owner 
              ? 'rgba(156, 163, 175, 0.05)' 
              : 'rgba(255, 255, 255, 0.8)',
        position: 'relative',
        opacity: owner ? 0.8 : 1,
        transition: 'all 0.2s ease-in-out',
        boxShadow: isSelected 
          ? '0 0 0 2px rgba(99, 102, 241, 0.3)' 
          : isHovered 
            ? '0 0 0 2px rgba(99, 102, 241, 0.2)' 
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(4px)',
        borderColor: isWinningSquare ? '#10B981' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: isWinningSquare ? '2px' : '1px',
        transform: isSelected || isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onClick={owner ? undefined : onSelect}
      onMouseEnter={() => !owner && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {owner ? (
        <div style={{
          fontSize: '12px',
          color: isOwned ? '#10B981' : '#374151',
          fontWeight: '500',
          textAlign: 'center',
          padding: '0 4px',
          wordBreak: 'break-all',
        }}>
          {isOwned ? 'You' : `${owner.slice(0, 4)}...${owner.slice(-4)}`}
        </div>
      ) : (
        <div style={{
          fontSize: '14px',
          color: '#374151',
          fontWeight: '600',
        }}>
          ?
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
  const [error, setError] = useState<string | null>(null);

  // Get user's balance
  const { data: balance } = useBalance({
    address: address,
  });

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

    // Check if user has enough balance for the purchase
    if (balance && balance.value < totalCost) {
      const requiredEth = formatEther(totalCost - balance.value);
      setError(`Insufficient funds. You need ${requiredEth} more ETH to complete this purchase.`);
      return;
    }

    console.log("Purchasing squares:", selectedSquares);
    console.log("Total cost:", formatEther(totalCost));

    try {
      setError(null);
      await buySquares?.({
        args: [selectedSquares[0]], // Buy one square at a time
        value: entryPrice
      });
    } catch (error) {
      console.error("Error purchasing squares:", error);
      if (error instanceof Error && error.message.includes("insufficient funds")) {
        setError("Insufficient funds. Please ensure you have enough ETH to cover both the purchase and gas fees.");
      } else {
        setError("Error purchasing squares. Please try again.");
      }
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

  // Add debug logging
  useEffect(() => {
    console.log('Squares data:', squaresData);
  }, [squaresData]);

  // Add contract reads for team names
  const { data: homeTeam, error: homeTeamError } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getHomeTeam',
  });

  const { data: awayTeam, error: awayTeamError } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAwayTeam',
  });

  // Use default team names if contract calls fail
  const homeTeamName = homeTeamError ? 'Home Team' : (homeTeam || 'Home Team');
  const awayTeamName = awayTeamError ? 'Away Team' : (awayTeam || 'Away Team');

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
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
      borderRadius: '16px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60px 60px repeat(10, 1fr)',
        gridTemplateRows: 'auto auto repeat(10, 1fr)',
        gap: '4px',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '12px'
      }}>
        {/* Top-left empty cell */}
        <div style={{
          gridColumn: '1 / span 2',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px'
        }} />

        {/* Home team title */}
        <div style={{
          gridColumn: '3 / span 10',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          color: '#374151',
          fontWeight: '600',
          fontSize: '16px',
          marginBottom: '4px'
        }}>
          <span>{homeTeamName}</span>
        </div>

        {/* Home team numbers */}
        {[...Array(10)].map((_, col) => (
          <div key={`header-${col}`} style={{
            gridColumn: col + 3,
            gridRow: 2,
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#374151',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            <span>{col}</span>
          </div>
        ))}

        {/* Away team title */}
        <div style={{
          gridColumn: 1,
          gridRow: '3 / span 10',
          width: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#374151',
          fontWeight: '600',
          fontSize: '16px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          padding: '8px 0'
        }}>
          <span>{awayTeamName}</span>
        </div>

        {/* Squares grid */}
        {[...Array(10)].map((_, row) => (
          <React.Fragment key={`row-${row}`}>
            {/* Away team number */}
            <div key={`away-${row}`} style={{
              gridColumn: 2,
              gridRow: row + 3,
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#374151',
              fontWeight: '600',
              fontSize: '16px'
            }}>
              <span>{row}</span>
            </div>

            {/* Squares for this row */}
            {[...Array(10)].map((_, col) => {
              const index = row * 10 + col;
              const square = squaresData?.[index];
              
              // Type-safe checks for the square data
              let owner: string | null = null;
              if (square && typeof square === 'object' && '0' in square) {
                const ownerAddress = square[0];
                if (typeof ownerAddress === 'string' && 
                    ownerAddress !== '0x0000000000000000000000000000000000000000') {
                  owner = ownerAddress;
                }
              }

              const isWinningSquare = Boolean(gameEnded && 
                homeScoreLastDigit !== undefined && 
                awayScoreLastDigit !== undefined &&
                row === Number(homeScoreLastDigit) && 
                col === Number(awayScoreLastDigit));
              const isSelected = selectedSquares.includes(index);

              return (
                <div
                  key={`square-${row}-${col}`}
                  style={{
                    gridColumn: col + 3,
                    gridRow: row + 3
                  }}
                >
                  <Square
                    key={`square-component-${row}-${col}`}
                    row={row}
                    col={col}
                    isSelected={isSelected}
                    onSelect={() => handleSquareClick(index)}
                    owner={owner}
                    isWinningSquare={isWinningSquare}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {selectedSquares.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          color: '#374151'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '16px' }}>
              Selected Squares: <span style={{ fontWeight: '600' }}>{selectedSquares.length}</span>
            </p>
            <p style={{ fontSize: '16px' }}>
              Total Cost: <span style={{ fontWeight: '600' }}>{formatEther(totalCost)} ETH</span>
            </p>
            {balance && (
              <p style={{ fontSize: '16px' }}>
                Your Balance: <span style={{ fontWeight: '600' }}>{formatEther(balance.value)} ETH</span>
              </p>
            )}
          </div>
          <button
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: isConnected && isCorrectChain && balance && balance.value >= totalCost
                ? '#6366f1'
                : '#4a5568',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '16px',
              cursor: !isConnected || !isCorrectChain || isBuyingSquares || isPurchaseTxPending || gameEnded || !balance || balance.value < totalCost ? 'not-allowed' : 'pointer',
              opacity: !isConnected || !isCorrectChain || isBuyingSquares || isPurchaseTxPending || gameEnded || !balance || balance.value < totalCost ? 0.5 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={handlePurchase}
            disabled={!isConnected || !isCorrectChain || isBuyingSquares || isPurchaseTxPending || gameEnded || !balance || balance.value < totalCost}
          >
            {isBuyingSquares || isPurchaseTxPending ? 'Processing...' : 'Purchase Selected Squares'}
          </button>
          {(isBuyingSquares || isPurchaseTxPending) && (
            <p className="text-gray-600 text-sm mt-2">
              Please confirm the transaction in your wallet
            </p>
          )}
          {!isConnected && (
            <p className="text-red-500 text-sm mt-2">
              Please connect your wallet to purchase squares
            </p>
          )}
          {isConnected && !isCorrectChain && (
            <p className="text-red-500 text-sm mt-2">
              Please switch to Sepolia network to purchase squares
            </p>
          )}
          {isConnected && isCorrectChain && balance && balance.value < totalCost && (
            <p className="text-red-500 text-sm mt-2">
              Insufficient balance. You need {formatEther(totalCost - balance.value)} more ETH.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
