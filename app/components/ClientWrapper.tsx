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
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {!isConnected ? (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-6">
              Connect Your Wallet to Play
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Join the decentralized football squares game and compete for prizes!
            </p>
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">How to Play</h3>
              <ul className="text-left space-y-4 text-gray-600">
                <li className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</span>
                  <span>Connect your MetaMask wallet</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</span>
                  <span>Purchase squares on the game board</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</span>
                  <span>Watch the game and win if your square matches the final score</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">4</span>
                  <span>Claim your prize if you win!</span>
                </li>
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