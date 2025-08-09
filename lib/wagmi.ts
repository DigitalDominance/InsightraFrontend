import { getDefaultConfig } from '@rainbow-me/rainbowkit';

/**
 * Derive the chain configuration from environment variables. This allows the
 * frontend to be pointed at any Kaspa‑compatible RPC by defining:
 *
 * - NEXT_PUBLIC_CHAIN_ID       → numeric chain id (e.g. `167012` for Kasplex testnet)
 * - NEXT_PUBLIC_CHAIN_NAME     → human readable chain name
 * - NEXT_PUBLIC_RPC_URL        → HTTP RPC endpoint
 * - NEXT_PUBLIC_BLOCK_EXPLORER → (optional) explorer URL
 *
 * A WalletConnect project id can also be provided via
 * NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. If not set, the default string
 * 'YOUR_PROJECT_ID' will be used and WalletConnect will show a warning in
 * the console. To obtain a free project id visit: https://cloud.walletconnect.com
 */
const chainIdEnv = process.env.NEXT_PUBLIC_CHAIN_ID;
const rpcUrlEnv = process.env.NEXT_PUBLIC_RPC_URL;
const chainNameEnv = process.env.NEXT_PUBLIC_CHAIN_NAME;
const explorerEnv = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;

// Fallback to Kasplex testnet if env vars are undefined
const chainId = chainIdEnv ? Number(chainIdEnv) : 167012;
const rpcUrl = rpcUrlEnv || 'https://rpc.kasplextest.xyz';
const chainName = chainNameEnv || 'Kasplex Testnet';
const explorerUrl = explorerEnv || 'https://www.dagscan.xyz';

// Compose a chain object compatible with RainbowKit/wagmi
const kaspaChain = {
  id: chainId,
  name: chainName,
  nativeCurrency: {
    decimals: 18,
    name: 'KAS',
    symbol: 'KAS',
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: explorerUrl,
    },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'Insightra',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [kaspaChain],
  ssr: true,
});
