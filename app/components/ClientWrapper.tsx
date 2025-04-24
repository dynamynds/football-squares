"use client";

import { useAccount } from "wagmi";
import dynamic from 'next/dynamic';

const GameBoard = dynamic(() => import('./GameBoard').then(mod => mod.GameBoard));
const GameInfo = dynamic(() => import('./GameInfo').then(mod => mod.GameInfo));
const GameControls = dynamic(() => import('./GameControls').then(mod => mod.GameControls));
const TransactionHistory = dynamic(() => import('./TransactionHistory').then(mod => mod.TransactionHistory));

export default function ClientWrapper() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-background-light py-8">
      <div className="container mx-auto px-4">
        {!isConnected ? (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gradient mb-4">
              Connect Your Wallet to Play
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              Join the decentralized football squares game and compete for prizes!
            </p>
            <div className="bg-white card p-8">
              <h3 className="text-xl font-semibold text-text-primary mb-4">How to Play</h3>
              <ul className="text-left space-y-3 text-text-secondary">
                <li>1. Connect your MetaMask wallet</li>
                <li>2. Purchase squares on the game board</li>
                <li>3. Watch the game and win if your square matches the final score</li>
                <li>4. Claim your prize if you win!</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <GameBoard />
            </div>
            <div className="space-y-8">
              <GameInfo />
              <GameControls />
              <TransactionHistory />
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 