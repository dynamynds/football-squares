'use client';

import { ConnectButton } from './ConnectButton';

export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Football Squares
            </h1>
            <span className="ml-4 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
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