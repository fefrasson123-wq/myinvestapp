import { useState, useEffect, useCallback } from 'react';

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

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

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

export function useCryptoPrices() {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Carrega preços locais como fallback inicial
  const loadLocalPrices = useCallback(() => {
    // Importa da lista local de criptos
    import('@/data/cryptoList').then(({ cryptoList }) => {
      const localPrices: Record<string, CryptoPrice> = {};
      cryptoList.forEach(crypto => {
        const symbol = crypto.symbol.toUpperCase();
        // Simula variação 24h
        const changePercent = (Math.random() - 0.5) * 4; // -2% a +2%
        const change = crypto.price * (changePercent / 100);
        
        localPrices[symbol] = {
          id: crypto.id,
          symbol: symbol.toLowerCase(),
          current_price: crypto.price,
          price_change_24h: change,
          price_change_percentage_24h: changePercent,
          high_24h: crypto.price * 1.02,
          low_24h: crypto.price * 0.98,
          last_updated: new Date().toISOString(),
        };
      });
      setPrices(prev => ({ ...localPrices, ...prev })); // Mantém preços da API se existirem
    });
  }, []);

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

      setPrices(prev => ({ ...prev, ...priceMap }));
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

  // Carrega preços locais na inicialização e busca da API
  useEffect(() => {
    loadLocalPrices();
    fetchPrices();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(() => {
      fetchPrices();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPrices, loadLocalPrices]);

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
