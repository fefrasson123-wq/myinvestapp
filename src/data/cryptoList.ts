export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
}

// Lista simulada de criptomoedas com preços (em BRL)
export const cryptoList: CryptoAsset[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 342000 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 18500 },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB', price: 2100 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 780 },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 3.20 },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 3.50 },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 32 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 1.60 },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 145 },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 75 },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', price: 2.80 },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', price: 420 },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', price: 42 },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', price: 35 },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', price: 22 },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', price: 4.20 },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', price: 8.50 },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', price: 0.55 },
  { id: 'tron', name: 'TRON', symbol: 'TRX', price: 0.62 },
  { id: 'shiba', name: 'Shiba Inu', symbol: 'SHIB', price: 0.00012 },
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
