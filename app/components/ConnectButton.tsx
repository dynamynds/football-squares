"use client";

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();

  const metaMaskConnector = connectors[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        disabled
        className="btn-secondary opacity-50"
      >
        Loading...
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-text-secondary">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="btn-secondary"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: metaMaskConnector })}
      disabled={isLoading}
      className="btn-primary"
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
} 