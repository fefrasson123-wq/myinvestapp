import { useState, useEffect, useCallback, useRef } from 'react';

interface CryptoPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

interface CachedCryptoPrices {
  prices: Record<string, CryptoPrice>;
  timestamp: number;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_KEY = 'crypto_prices_cache';
const MAX_CACHE_AGE_MS = 10 * 60 * 1000; // 10 minutos - cache válido
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutos - força atualização

// Mapeamento de símbolos para IDs do CoinGecko
const symbolToId: Record<string, string> = {
  // Top 20 por market cap
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'BCH': 'bitcoin-cash',
  'UNI': 'uniswap',
  'XLM': 'stellar',
  'NEAR': 'near',
  
  // Layer 2 & Scaling
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'IMX': 'immutable-x',
  'STRK': 'starknet',
  
  // DeFi
  'AAVE': 'aave',
  'MKR': 'maker',
  'LDO': 'lido-dao',
  'CRV': 'curve-dao-token',
  'COMP': 'compound-governance-token',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'CAKE': 'pancakeswap-token',
  
  // Gaming & Metaverse
  'AXS': 'axie-infinity',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'GALA': 'gala',
  'ENJ': 'enjincoin',
  'ILV': 'illuvium',
  
  // AI & Data
  'RNDR': 'render-token',
  'RENDER': 'render-token',
  'FET': 'fetch-ai',
  'OCEAN': 'ocean-protocol',
  'AGIX': 'singularitynet',
  'WLD': 'worldcoin-wld',
  
  // Privacy Coins
  'XMR': 'monero',
  'ZEC': 'zcash',
  
  // Exchange Tokens
  'OKB': 'okb',
  'KCS': 'kucoin-shares',
  'GT': 'gatechain-token',
  'CRO': 'crypto-com-chain',
  
  // Infrastructure
  'ATOM': 'cosmos',
  'FIL': 'filecoin',
  'THETA': 'theta-token',
  'HBAR': 'hedera-hashgraph',
  'IOTA': 'iota',
  'VET': 'vechain',
  'FTM': 'fantom',
  
  // Meme Coins
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'BONK': 'bonk',
  'WOJAK': 'wojak',
  'WIF': 'dogwifcoin',
  
  // Outros populares
  'APT': 'aptos',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'INJ': 'injective-protocol',
  'KAS': 'kaspa',
  'ALGO': 'algorand',
  'EOS': 'eos',
  'FLOW': 'flow',
  'NEO': 'neo',
  'QTUM': 'qtum',
  'ZIL': 'zilliqa',
  'LRC': 'loopring',
  'CELO': 'celo',
  'ONE': 'harmony',
  'DASH': 'dash',
  'ETC': 'ethereum-classic',
  'TON': 'the-open-network',
  'JUP': 'jupiter-exchange-solana',
  'PYTH': 'pyth-network',
  'JTO': 'jito-governance-token',
  'BLUR': 'blur',
  'DYDX': 'dydx',
  'RAY': 'raydium',
  'ORCA': 'orca',
  'MAGIC': 'magic',
  'GMX': 'gmx',
  'RUNE': 'thorchain',
  'PENDLE': 'pendle',
  'MINA': 'mina-protocol',
  'WOO': 'woo-network',
  'ANKR': 'ankr',
  'MASK': 'mask-network',
  
  // Extras que podem estar na lista
  'AR': 'arweave',
  'STX': 'stacks',
  'TIA': 'celestia',
  'ORDI': 'ordinals',
  'CFX': 'conflux-token',
  'ROSE': 'oasis-network',
  'APE': 'apecoin',
  'SSV': 'ssv-network',
  'RVN': 'ravencoin',
  'GMT': 'stepn',
  'ICX': 'icon',
  'ZRX': '0x',
  'GRT': 'the-graph',
  'BAT': 'basic-attention-token',
  'YFI': 'yearn-finance',
  'SNX': 'havven',
  'KSM': 'kusama',
  'KLAY': 'klay-token',
  'ICP': 'internet-computer',
  'EGLD': 'elrond-erd-2',
  'CHZ': 'chiliz',
  'XTZ': 'tezos',
  'WAVES': 'waves',
};

// Funções de cache
function getCachedPrices(): CachedCryptoPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as CachedCryptoPrices;
    }
  } catch {
    // Ignora erros de localStorage
  }
  return null;
}

function setCachedPrices(prices: Record<string, CryptoPrice>) {
  try {
    const data: CachedCryptoPrices = {
      prices,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignora erros de localStorage
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < MAX_CACHE_AGE_MS;
}

function isCacheStale(timestamp: number): boolean {
  return Date.now() - timestamp > STALE_THRESHOLD_MS;
}

export function useCryptoPrices() {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>(() => {
    // Inicializa com cache local se disponível
    const cached = getCachedPrices();
    return cached?.prices || {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(() => {
    const cached = getCachedPrices();
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  
  // Mantém o último preço válido da API
  const lastValidPrices = useRef<Record<string, CryptoPrice>>({});
  const retryCount = useRef(0);
  const maxRetries = 3;

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Pegar os IDs únicos a buscar
      const idsToFetch = symbols 
        ? symbols.map(s => symbolToId[s.toUpperCase()] || s.toLowerCase()).filter(Boolean)
        : Object.values(symbolToId);
      
      const uniqueIds = [...new Set(idsToFetch)].slice(0, 100); // CoinGecko limita a 100 por request
      
      // Buscar preços em USD (padrão do app para cripto). A conversão para BRL é feita via taxa USD/BRL.
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

      // Salva no cache e atualiza estado
      const newPrices = { ...prices, ...priceMap };
      setCachedPrices(newPrices);
      lastValidPrices.current = newPrices;
      retryCount.current = 0; // Reset retry count on success
      
      setPrices(newPrices);
      setLastUpdate(new Date());
      console.log('Crypto prices updated from API:', Object.keys(priceMap).length, 'coins');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('Erro ao buscar preços:', err);
      
      retryCount.current++;
      
      // Tenta usar cache ou último preço válido
      const cached = getCachedPrices();
      
      if (Object.keys(lastValidPrices.current).length > 0) {
        console.log('Using last valid crypto prices from memory');
        setPrices(lastValidPrices.current);
      } else if (cached && !isCacheStale(cached.timestamp)) {
        console.log('Using cached crypto prices (age:', Math.round((Date.now() - cached.timestamp) / 1000 / 60), 'min)');
        setPrices(cached.prices);
        setLastUpdate(new Date(cached.timestamp));
      } else if (cached) {
        // Cache está stale mas é melhor que nada - usa mas avisa
        console.warn('Using stale cached crypto prices (age:', Math.round((Date.now() - cached.timestamp) / 1000 / 60), 'min) - will retry');
        setPrices(cached.prices);
        setLastUpdate(new Date(cached.timestamp));
        
        // Agenda retry mais rápido se cache está muito velho
        if (retryCount.current < maxRetries) {
          setTimeout(() => fetchPrices(symbols), 10000); // Retry em 10 segundos
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [prices]);

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

  // Busca preços na inicialização e verifica cache
  useEffect(() => {
    const cached = getCachedPrices();
    
    // Se cache é válido, usa e não busca imediatamente
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('Using valid cached crypto prices');
      setPrices(cached.prices);
      setLastUpdate(new Date(cached.timestamp));
      lastValidPrices.current = cached.prices;
    } else {
      // Cache inválido ou inexistente - busca imediatamente
      fetchPrices();
    }
    
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
