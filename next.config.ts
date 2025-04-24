import path from "path";
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@artifacts": path.resolve(__dirname, "artifacts"),
    };
    return config;
  },
  env: {
    TENDERLY_VIRTUAL_TESTNET_RPC: process.env.TENDERLY_VIRTUAL_TESTNET_RPC,
  },
};

export default nextConfig;
