import { Chain } from 'viem';
import { sepolia } from 'viem/chains';

export const TenderlyVirtualTestnet: Chain = {
  id: 11155111,
  name: 'Tenderly Virtual Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://virtual.sepolia.rpc.tenderly.co/be48cde5-f189-4651-8cd6-db0662ca84bf'] },
    public: { http: ['https://virtual.sepolia.rpc.tenderly.co/be48cde5-f189-4651-8cd6-db0662ca84bf'] },
  },
  blockExplorers: {
    default: { name: 'Tenderly', url: 'https://dashboard.tenderly.co' },
  },
};

export const Sepolia = sepolia; 