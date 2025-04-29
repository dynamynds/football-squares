import { parseEther } from 'viem';

export const CONTRACT_ADDRESS = '0x6a6583Ee56cd07E4c5f2a2d3E387F3F703F93194'; // Replace with your new contract address
export const ENTRY_PRICE = parseEther("0.1"); // 0.1 ETH per square
export const TEAM_NAMES = {
  home: "Home Team",
  away: "Away Team"
} as const;

// ... existing code ... 