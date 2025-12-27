import { useState, useEffect, useCallback } from 'react';

interface CryptoPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Mapeamento de símbolos para IDs do CoinGecko
const symbolToId: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'TON': 'the-open-network',
  'MATIC': 'matic-network',
  'BCH': 'bitcoin-cash',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'XMR': 'monero',
  'ETC': 'ethereum-classic',
  'APT': 'aptos',
  'NEAR': 'near',
  'FIL': 'filecoin',
  'ARB': 'arbitrum',
  'VET': 'vechain',
  'ALGO': 'algorand',
  'FTM': 'fantom',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AAVE': 'aave',
  'AXS': 'axie-infinity',
  'THETA': 'theta-token',
  'EOS': 'eos',
  'EGLD': 'elrond-erd-2',
  'CHZ': 'chiliz',
  'ZEC': 'zcash',
  'IOTA': 'iota',
  'NEO': 'neo',
  'CAKE': 'pancakeswap-token',
  'KCS': 'kucoin-shares',
  'XTZ': 'tezos',
  'DASH': 'dash',
  'WAVES': 'waves',
  'ZIL': 'zilliqa',
  'ENJ': 'enjincoin',
  'BAT': 'basic-attention-token',
  'YFI': 'yearn-finance',
  'SNX': 'havven',
  '1INCH': '1inch',
  'GRT': 'the-graph',
  'CRV': 'curve-dao-token',
  'COMP': 'compound-governance-token',
  'MKR': 'maker',
  'LRC': 'loopring',
  'KSM': 'kusama',
  'CRO': 'crypto-com-chain',
  'KLAY': 'klay-token',
  'HBAR': 'hedera-hashgraph',
  'ICP': 'internet-computer',
  'FLOW': 'flow',
  'IMX': 'immutable-x',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'RUNE': 'thorchain',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'PEPE': 'pepe',
  'WLD': 'worldcoin-wld',
  'BONK': 'bonk',
  'WIF': 'dogwifcoin',
  'FLOKI': 'floki',
  'RENDER': 'render-token',
  'FET': 'fetch-ai',
  'RNDR': 'render-token',
  'AR': 'arweave',
  'STX': 'stacks',
  'TIA': 'celestia',
  'JUP': 'jupiter-exchange-solana',
  'PYTH': 'pyth-network',
  'ORDI': 'ordinals',
  'BLUR': 'blur',
  'GMX': 'gmx',
  'PENDLE': 'pendle',
  'CFX': 'conflux-token',
  'MINA': 'mina-protocol',
  'ROSE': 'oasis-network',
  'GALA': 'gala',
  'APE': 'apecoin',
  'DYDX': 'dydx',
  'SSV': 'ssv-network',
  'RVN': 'ravencoin',
  'GMT': 'stepn',
  'QTUM': 'qtum',
  'ICX': 'icon',
  'ZRX': '0x',
};

export function useCryptoPrices() {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Pegar os IDs únicos a buscar
      const idsToFetch = symbols 
        ? symbols.map(s => symbolToId[s.toUpperCase()] || s.toLowerCase()).filter(Boolean)
        : Object.values(symbolToId);
      
      const uniqueIds = [...new Set(idsToFetch)].slice(0, 100); // CoinGecko limita a 100 por request
      
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${uniqueIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar preços: ${response.status}`);
      }

      const data: CryptoPrice[] = await response.json();
      
      const priceMap: Record<string, CryptoPrice> = {};
      data.forEach((coin) => {
        priceMap[coin.symbol.toUpperCase()] = coin;
        priceMap[coin.id] = coin;
      });

      setPrices(priceMap);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar preços:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPrice = useCallback((symbol: string): number | null => {
    const upperSymbol = symbol.toUpperCase();
    const price = prices[upperSymbol];
    return price?.current_price ?? null;
  }, [prices]);

  const getPriceChange = useCallback((symbol: string): { change: number; percent: number } | null => {
    const upperSymbol = symbol.toUpperCase();
    const price = prices[upperSymbol];
    if (!price) return null;
    return {
      change: price.price_change_24h,
      percent: price.price_change_percentage_24h,
    };
  }, [prices]);

  // Busca inicial
  useEffect(() => {
    fetchPrices();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(() => {
      fetchPrices();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    lastUpdate,
    fetchPrices,
    getPrice,
    getPriceChange,
  };
}

export { symbolToId };
