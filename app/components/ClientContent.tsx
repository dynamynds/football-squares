'use client';

import { useAccount } from 'wagmi';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { GameInfo } from './GameInfo';
import { useEffect, useState } from 'react';

export default function ClientContent() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <section className="w-full max-w-2xl px-4">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-6">
              Connect Your Wallet to Play
            </h1>
            <p className="text-gray-600 text-lg">
              Join the decentralized football squares game and compete for prizes!
            </p>
          </header>
          <article className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">How to Play</h2>
            <ol className="text-gray-600 space-y-4 list-decimal pl-6">
              <li className="pl-2">
                Connect your MetaMask wallet to interact with the game
              </li>
              <li className="pl-2">
                Purchase squares on the game board using ETH
              </li>
              <li className="pl-2">
                Watch the game and win if your square matches the final score
              </li>
              <li className="pl-2">
                Claim your prize if you win!
              </li>
            </ol>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            <GameBoard />
          </section>
          <aside className="space-y-8">
            <GameInfo />
            <GameControls />
          </aside>
        </div>
      </div>
    </main>
  );
} 