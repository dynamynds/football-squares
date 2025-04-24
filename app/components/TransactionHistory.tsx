"use client";

import { useAccount, useContractEvent } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants';
import { useState, useEffect } from "react";
import { Log } from 'viem';

interface Transaction {
  type: 'purchase' | 'start' | 'end' | 'score';
  hash: string;
  timestamp: number;
  data?: {
    squareIndex?: number;
    homeScore?: number;
    awayScore?: number;
  };
}

export const TransactionHistory = () => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Listen for purchase events
  useContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'SquarePurchased',
    listener: (logs: Log[]) => {
      logs.forEach(log => {
        const decoded = log as any;
        const [player, squareIndex] = decoded.args;
        if (player.toLowerCase() === address?.toLowerCase()) {
          setTransactions(prev => [{
            type: 'purchase',
            hash: log.transactionHash || '',
            timestamp: Date.now(),
            data: { squareIndex: Number(squareIndex) }
          }, ...prev]);
        }
      });
    },
  });

  // Listen for game start events
  useContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameStarted',
    listener: (logs: Log[]) => {
      logs.forEach(log => {
        setTransactions(prev => [{
          type: 'start',
          hash: log.transactionHash || '',
          timestamp: Date.now()
        }, ...prev]);
      });
    },
  });

  // Listen for game end events
  useContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameEnded',
    listener: (logs: Log[]) => {
      logs.forEach(log => {
        const decoded = log as any;
        const [homeScore, awayScore, winner, prize] = decoded.args;
        setTransactions(prev => [{
          type: 'score',
          hash: log.transactionHash || '',
          timestamp: Date.now(),
          data: { 
            homeScore: Number(homeScore),
            awayScore: Number(awayScore)
          }
        }, ...prev]);
      });
    },
  });

  const formatTransaction = (tx: Transaction) => {
    const timeAgo = Math.floor((Date.now() - tx.timestamp) / 1000);
    const minutes = Math.floor(timeAgo / 60);
    const hours = Math.floor(minutes / 60);

    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}h ago`;
    } else if (minutes > 0) {
      timeStr = `${minutes}m ago`;
    } else {
      timeStr = 'just now';
    }

    let content = '';
    switch (tx.type) {
      case 'purchase':
        content = `Purchased square ${tx.data?.squareIndex}`;
        break;
      case 'start':
        content = 'Game started';
        break;
      case 'end':
        content = 'Game ended';
        break;
      case 'score':
        content = `Final score: ${tx.data?.homeScore} - ${tx.data?.awayScore}`;
        break;
    }

    return (
      <div key={tx.hash} className="flex items-center justify-between py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            tx.type === 'purchase' ? 'bg-blue-500' :
            tx.type === 'start' ? 'bg-green-500' :
            tx.type === 'end' ? 'bg-red-500' :
            'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-600">{content}</span>
        </div>
        <span className="text-xs text-gray-400">{timeStr}</span>
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      <div className="space-y-2">
        {transactions.length > 0 ? (
          transactions.map(formatTransaction)
        ) : (
          <p className="text-sm text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}; 