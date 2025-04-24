'use client';

import { ConnectButton } from './ConnectButton';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gradient">Football Squares</h1>
            <span className="text-sm text-secondary bg-gray-100 px-2 py-1 rounded-full">
              Web3 Game
            </span>
          </div>
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
} 