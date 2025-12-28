import { useState, useEffect, useCallback } from 'react';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

// Preços simulados para ações brasileiras (B3)
// Em produção, usar API como Alpha Vantage, Yahoo Finance, ou B3
const mockBrazilianStocks: Record<string, { price: number; change: number }> = {
  'PETR4': { price: 38.45, change: 0.8 },
  'VALE3': { price: 62.30, change: -1.2 },
  'ITUB4': { price: 32.15, change: 0.5 },
  'BBDC4': { price: 12.80, change: -0.3 },
  'ABEV3': { price: 11.95, change: 0.2 },
  'WEGE3': { price: 52.40, change: 1.5 },
  'MGLU3': { price: 8.25, change: -2.1 },
  'RENT3': { price: 45.60, change: 0.7 },
  'BBAS3': { price: 28.90, change: 0.4 },
  'SUZB3': { price: 58.75, change: -0.6 },
  'JBSS3': { price: 34.20, change: 1.1 },
  'ELET3': { price: 41.30, change: 0.3 },
  'ELET6': { price: 45.80, change: 0.4 },
  'LREN3': { price: 18.45, change: -0.8 },
  'RADL3': { price: 26.70, change: 0.6 },
  'RAIL3': { price: 22.15, change: 0.9 },
  'TOTS3': { price: 31.40, change: 1.2 },
  'PRIO3': { price: 48.90, change: 2.1 },
  'CSAN3': { price: 12.35, change: -0.4 },
  'HAPV3': { price: 3.85, change: -1.5 },
  'RDOR3': { price: 28.60, change: 0.7 },
  'BPAC11': { price: 32.45, change: 0.5 },
  'VIVT3': { price: 54.20, change: 0.3 },
  'EQTL3': { price: 31.80, change: 0.4 },
  'CMIG4': { price: 11.25, change: 0.6 },
  'TAEE11': { price: 35.90, change: 0.2 },
  'ENGI11': { price: 42.15, change: 0.8 },
  'CPFE3': { price: 33.70, change: 0.5 },
  'SBSP3': { price: 92.40, change: 1.3 },
  'SAPR11': { price: 25.80, change: 0.4 },
  'B3SA3': { price: 11.45, change: -0.7 },
  'CIEL3': { price: 5.62, change: 1.8 },
  'NTCO3': { price: 14.30, change: -0.5 },
  'AZUL4': { price: 4.85, change: 3.2 },
  'GOLL4': { price: 1.25, change: 2.5 },
  'EMBR3': { price: 54.80, change: 1.4 },
  'BRFS3': { price: 24.65, change: 0.9 },
  'MRFG3': { price: 18.40, change: 1.1 },
  'BEEF3': { price: 6.75, change: 0.8 },
  'SMTO3': { price: 27.30, change: 0.6 },
  'SLCE3': { price: 18.95, change: -0.4 },
  'AGRO3': { price: 25.40, change: 0.7 },
  'GGBR4': { price: 17.85, change: 1.3 },
  'CSNA3': { price: 11.20, change: 1.8 },
  'USIM5': { price: 6.45, change: 2.1 },
  'GOAU4': { price: 10.30, change: 1.5 },
  'CMIN3': { price: 5.85, change: 2.4 },
  'KLBN11': { price: 21.60, change: 0.5 },
  'KLBN4': { price: 4.25, change: 0.4 },
  'DXCO3': { price: 7.15, change: -0.6 },
  'TIMS3': { price: 17.80, change: 0.3 },
  'COGN3': { price: 1.42, change: -2.8 },
  'YDUQ3': { price: 11.65, change: -1.2 },
  'VBBR3': { price: 20.35, change: 0.8 },
  'UGPA3': { price: 23.90, change: 0.5 },
  'PCAR3': { price: 2.85, change: -3.5 },
  'ASAI3': { price: 8.45, change: -1.1 },
  'CRFB3': { price: 8.90, change: -0.8 },
  'IGTI11': { price: 21.75, change: 0.6 },
  'MULT3': { price: 26.40, change: 0.4 },
  'ALPA4': { price: 6.85, change: -1.4 },
  'AMER3': { price: 0.45, change: -5.2 },
  'BHIA3': { price: 5.20, change: -2.3 },
  'PETZ3': { price: 4.15, change: -1.8 },
  'LWSA3': { price: 4.85, change: -0.9 },
  'CASH3': { price: 11.25, change: 1.2 },
  'MOVI3': { price: 6.30, change: 0.7 },
  'CVCB3': { price: 2.15, change: -4.1 },
  'SMFT3': { price: 25.80, change: 1.5 },
  'POSI3': { price: 8.45, change: 2.3 },
  'INTB3': { price: 18.90, change: -0.6 },
  'SEQL3': { price: 7.25, change: -1.2 },
  'MRVE3': { price: 7.85, change: -0.9 },
  'CYRE3': { price: 22.40, change: 0.8 },
  'EZTC3': { price: 14.65, change: 0.5 },
  'DIRR3': { price: 18.30, change: 1.1 },
  'EVEN3': { price: 7.45, change: 0.7 },
  'TRIS3': { price: 4.20, change: -0.5 },
  'MDIA3': { price: 28.90, change: 0.4 },
  'HYPE3': { price: 31.45, change: 0.6 },
  'FLRY3': { price: 14.80, change: -0.3 },
  'QUAL3': { price: 2.95, change: -1.7 },
  'ODPV3': { price: 11.35, change: 0.8 },
  'PNVL3': { price: 8.65, change: 0.5 },
  'RAIZ4': { price: 3.45, change: -0.8 },
  'RECV3': { price: 17.20, change: 1.4 },
  'RRRP3': { price: 21.85, change: 1.8 },
  'PETR3': { price: 41.60, change: 0.9 },
  'VIVA3': { price: 24.30, change: 0.6 },
  'AURE3': { price: 10.85, change: -0.4 },
  'ENBR3': { price: 21.40, change: 0.3 },
  'NEOE3': { price: 19.75, change: 0.5 },
  'CPLE6': { price: 10.20, change: 0.7 },
  'AESB3': { price: 10.45, change: 0.4 },
  'SANB11': { price: 27.85, change: 0.3 },
  'ITSA4': { price: 10.15, change: 0.4 },
  'BBSE3': { price: 35.60, change: 0.5 },
  'SULA11': { price: 24.30, change: -0.6 },
  'PSSA3': { price: 32.45, change: 0.8 },
  'CXSE3': { price: 14.20, change: 0.3 },
};

export function useStockPrices() {
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const symbolsToFetch = symbols || Object.keys(mockBrazilianStocks);
      const priceMap: Record<string, StockPrice> = {};

      symbolsToFetch.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        const stockData = mockBrazilianStocks[upperSymbol];
        
        if (stockData) {
          // Adiciona variação aleatória pequena para simular tempo real
          const variation = (Math.random() - 0.5) * 0.5;
          const currentPrice = stockData.price + variation;
          
          priceMap[upperSymbol] = {
            symbol: upperSymbol,
            price: Math.round(currentPrice * 100) / 100,
            change: stockData.change + variation,
            changePercent: ((stockData.change + variation) / stockData.price) * 100,
            lastUpdated: new Date().toISOString(),
          };
        }
      });

      setPrices(priceMap);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      console.error('Erro ao buscar preços de ações:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPrice = useCallback((symbol: string): number | null => {
    const upperSymbol = symbol.toUpperCase();
    return prices[upperSymbol]?.price ?? null;
  }, [prices]);

  const getPriceChange = useCallback((symbol: string): { change: number; percent: number } | null => {
    const upperSymbol = symbol.toUpperCase();
    const stockPrice = prices[upperSymbol];
    if (!stockPrice) return null;
    return {
      change: stockPrice.change,
      percent: stockPrice.changePercent,
    };
  }, [prices]);

  // Busca inicial e atualização a cada 60 segundos
  useEffect(() => {
    fetchPrices();
    
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
