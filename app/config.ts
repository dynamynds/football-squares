'use client';

import { configureChains, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

// Create a custom Sepolia chain configuration that matches MetaMask's expectations
const customSepolia = {
  ...sepolia,
  name: 'Ethereum Sepolia',
  rpcUrls: {
    ...sepolia.rpcUrls,
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
    public: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [customSepolia],
  [publicProvider()]
);

// Debug chain configuration
console.log('Configured chains:', chains);

export const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
  connectors: [
    new MetaMaskConnector({
      chains,
      options: {
        shimDisconnect: true,
        UNSTABLE_shimOnConnectSelectAccount: true,
      },
    }),
  ],
});

export const ENTRY_PRICE = '0.01'; // 0.01 ETH 