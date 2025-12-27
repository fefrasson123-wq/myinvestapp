export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: number; // USD
}

// Lista de criptomoedas com preços em USD (inspirada no BingX)
export const cryptoList: CryptoAsset[] = [
  // Top 20 por market cap
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67500 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3650 },
  { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.00 },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB', price: 580 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 175 },
  { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', price: 1.00 },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', price: 0.62 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.145 },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.68 },
  { id: 'tron', name: 'TRON', symbol: 'TRX', price: 0.115 },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 42 },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 18.5 },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 8.2 },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', price: 0.72 },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', price: 85 },
  { id: 'shiba', name: 'Shiba Inu', symbol: 'SHIB', price: 0.0000245 },
  { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'BCH', price: 485 },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', price: 12.5 },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', price: 0.125 },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', price: 7.8 },
  
  // Layer 2 & Scaling
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', price: 1.15 },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', price: 2.85 },
  { id: 'immutable-x', name: 'Immutable', symbol: 'IMX', price: 2.45 },
  { id: 'starknet', name: 'Starknet', symbol: 'STRK', price: 1.22 },
  
  // DeFi
  { id: 'aave', name: 'Aave', symbol: 'AAVE', price: 165 },
  { id: 'maker', name: 'Maker', symbol: 'MKR', price: 2850 },
  { id: 'lido', name: 'Lido DAO', symbol: 'LDO', price: 2.15 },
  { id: 'curve', name: 'Curve DAO', symbol: 'CRV', price: 0.48 },
  { id: 'compound', name: 'Compound', symbol: 'COMP', price: 72 },
  { id: 'sushi', name: 'SushiSwap', symbol: 'SUSHI', price: 1.35 },
  { id: '1inch', name: '1inch', symbol: '1INCH', price: 0.52 },
  { id: 'pancakeswap', name: 'PancakeSwap', symbol: 'CAKE', price: 2.95 },
  
  // Gaming & Metaverse
  { id: 'axie', name: 'Axie Infinity', symbol: 'AXS', price: 8.5 },
  { id: 'sandbox', name: 'The Sandbox', symbol: 'SAND', price: 0.58 },
  { id: 'decentraland', name: 'Decentraland', symbol: 'MANA', price: 0.52 },
  { id: 'gala', name: 'Gala', symbol: 'GALA', price: 0.045 },
  { id: 'enjin', name: 'Enjin Coin', symbol: 'ENJ', price: 0.35 },
  { id: 'illuvium', name: 'Illuvium', symbol: 'ILV', price: 105 },
  
  // AI & Data
  { id: 'render', name: 'Render', symbol: 'RNDR', price: 10.5 },
  { id: 'fetch-ai', name: 'Fetch.ai', symbol: 'FET', price: 2.45 },
  { id: 'ocean', name: 'Ocean Protocol', symbol: 'OCEAN', price: 1.05 },
  { id: 'singularitynet', name: 'SingularityNET', symbol: 'AGIX', price: 0.95 },
  { id: 'worldcoin', name: 'Worldcoin', symbol: 'WLD', price: 2.85 },
  
  // Privacy Coins
  { id: 'monero', name: 'Monero', symbol: 'XMR', price: 165 },
  { id: 'zcash', name: 'Zcash', symbol: 'ZEC', price: 32 },
  
  // Exchange Tokens
  { id: 'okb', name: 'OKB', symbol: 'OKB', price: 52 },
  { id: 'kucoin', name: 'KuCoin Token', symbol: 'KCS', price: 12.5 },
  { id: 'gate', name: 'GateToken', symbol: 'GT', price: 8.75 },
  { id: 'cronos', name: 'Cronos', symbol: 'CRO', price: 0.125 },
  
  // Infrastructure
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', price: 11.5 },
  { id: 'filecoin', name: 'Filecoin', symbol: 'FIL', price: 6.8 },
  { id: 'theta', name: 'Theta Network', symbol: 'THETA', price: 2.35 },
  { id: 'hedera', name: 'Hedera', symbol: 'HBAR', price: 0.115 },
  { id: 'iota', name: 'IOTA', symbol: 'IOTA', price: 0.28 },
  { id: 'vechain', name: 'VeChain', symbol: 'VET', price: 0.035 },
  { id: 'fantom', name: 'Fantom', symbol: 'FTM', price: 0.85 },
  
  // Meme Coins
  { id: 'pepe', name: 'Pepe', symbol: 'PEPE', price: 0.0000125 },
  { id: 'floki', name: 'Floki', symbol: 'FLOKI', price: 0.000225 },
  { id: 'bonk', name: 'Bonk', symbol: 'BONK', price: 0.0000285 },
  { id: 'wojak', name: 'Wojak', symbol: 'WOJAK', price: 0.00055 },
  { id: 'dogwifhat', name: 'dogwifhat', symbol: 'WIF', price: 2.95 },
  
  // Outros populares
  { id: 'aptos', name: 'Aptos', symbol: 'APT', price: 12.5 },
  { id: 'sui', name: 'Sui', symbol: 'SUI', price: 1.45 },
  { id: 'sei', name: 'Sei', symbol: 'SEI', price: 0.62 },
  { id: 'injective', name: 'Injective', symbol: 'INJ', price: 35 },
  { id: 'kaspa', name: 'Kaspa', symbol: 'KAS', price: 0.145 },
  { id: 'algorand', name: 'Algorand', symbol: 'ALGO', price: 0.22 },
  { id: 'eos', name: 'EOS', symbol: 'EOS', price: 0.85 },
  { id: 'flow', name: 'Flow', symbol: 'FLOW', price: 0.95 },
  { id: 'neo', name: 'NEO', symbol: 'NEO', price: 18.5 },
  { id: 'qtum', name: 'Qtum', symbol: 'QTUM', price: 4.2 },
  { id: 'zilliqa', name: 'Zilliqa', symbol: 'ZIL', price: 0.025 },
  { id: 'loopring', name: 'Loopring', symbol: 'LRC', price: 0.28 },
  { id: 'celo', name: 'Celo', symbol: 'CELO', price: 0.72 },
  { id: 'harmony', name: 'Harmony', symbol: 'ONE', price: 0.018 },
  { id: 'dash', name: 'Dash', symbol: 'DASH', price: 32 },
  { id: 'etc', name: 'Ethereum Classic', symbol: 'ETC', price: 28 },
  { id: 'ton', name: 'Toncoin', symbol: 'TON', price: 7.25 },
  { id: 'jupiter', name: 'Jupiter', symbol: 'JUP', price: 1.35 },
  { id: 'pyth', name: 'Pyth Network', symbol: 'PYTH', price: 0.52 },
  { id: 'jito', name: 'Jito', symbol: 'JTO', price: 3.85 },
  { id: 'blur', name: 'Blur', symbol: 'BLUR', price: 0.42 },
  { id: 'dydx', name: 'dYdX', symbol: 'DYDX', price: 2.15 },
  { id: 'raydium', name: 'Raydium', symbol: 'RAY', price: 1.85 },
  { id: 'orca', name: 'Orca', symbol: 'ORCA', price: 4.25 },
  { id: 'magic', name: 'Magic', symbol: 'MAGIC', price: 1.05 },
  { id: 'gmx', name: 'GMX', symbol: 'GMX', price: 42 },
  { id: 'thorchain', name: 'THORChain', symbol: 'RUNE', price: 6.5 },
  { id: 'pendle', name: 'Pendle', symbol: 'PENDLE', price: 6.25 },
  { id: 'mina', name: 'Mina Protocol', symbol: 'MINA', price: 0.95 },
  { id: 'woo', name: 'WOO Network', symbol: 'WOO', price: 0.35 },
  { id: 'ankr', name: 'Ankr', symbol: 'ANKR', price: 0.045 },
  { id: 'mask', name: 'Mask Network', symbol: 'MASK', price: 4.15 },
];

export function getCryptoBySymbol(symbol: string): CryptoAsset | undefined {
  return cryptoList.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
}

export function searchCrypto(query: string): CryptoAsset[] {
  const q = query.toLowerCase();
  return cryptoList.filter(
    c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
  );
}
