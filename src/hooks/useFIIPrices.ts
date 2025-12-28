import { useState, useEffect, useCallback } from 'react';

interface FIIPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dividendYield: number;
  lastUpdated: string;
}

// Preços simulados para FIIs brasileiros
// Em produção, usar API como Status Invest, Funds Explorer, ou B3
const mockFIIs: Record<string, { price: number; change: number; dividendYield: number }> = {
  'MXRF11': { price: 10.25, change: 0.15, dividendYield: 12.5 },
  'XPLG11': { price: 102.50, change: -0.80, dividendYield: 9.2 },
  'HGLG11': { price: 158.30, change: 1.20, dividendYield: 8.8 },
  'VISC11': { price: 118.45, change: 0.65, dividendYield: 9.5 },
  'XPML11': { price: 108.90, change: -0.35, dividendYield: 10.1 },
  'KNRI11': { price: 142.75, change: 0.90, dividendYield: 8.4 },
  'HGBS11': { price: 198.60, change: 1.50, dividendYield: 7.9 },
  'BCFF11': { price: 78.35, change: -0.25, dividendYield: 11.2 },
  'VILG11': { price: 95.80, change: 0.45, dividendYield: 9.8 },
  'PVBI11': { price: 98.25, change: 0.30, dividendYield: 9.3 },
  'RBRP11': { price: 62.40, change: -0.50, dividendYield: 13.5 },
  'BTLG11': { price: 98.15, change: 0.75, dividendYield: 9.6 },
  'HGRE11': { price: 128.90, change: 0.40, dividendYield: 8.2 },
  'JSRE11': { price: 72.30, change: -0.20, dividendYield: 10.8 },
  'VRTA11': { price: 88.65, change: 0.55, dividendYield: 14.2 },
  'CPTS11': { price: 85.40, change: -0.15, dividendYield: 13.8 },
  'RECR11': { price: 82.75, change: 0.35, dividendYield: 15.1 },
  'IRDM11': { price: 76.90, change: -0.45, dividendYield: 14.5 },
  'KNCR11': { price: 98.20, change: 0.25, dividendYield: 13.2 },
  'RBRY11': { price: 92.55, change: 0.60, dividendYield: 12.8 },
  'VGIR11': { price: 9.85, change: 0.05, dividendYield: 14.8 },
  'HSML11': { price: 82.40, change: -0.30, dividendYield: 10.5 },
  'MALL11': { price: 98.75, change: 0.70, dividendYield: 9.1 },
  'LVBI11': { price: 108.30, change: 0.85, dividendYield: 8.7 },
  'GGRC11': { price: 108.95, change: -0.40, dividendYield: 9.9 },
  'TRXF11': { price: 102.80, change: 0.50, dividendYield: 10.3 },
  'VINO11': { price: 7.45, change: -0.08, dividendYield: 11.8 },
  'RECT11': { price: 42.60, change: -0.25, dividendYield: 16.2 },
  'HGPO11': { price: 285.40, change: 2.10, dividendYield: 6.8 },
  'RCRB11': { price: 148.75, change: 1.05, dividendYield: 8.5 },
  'BRCR11': { price: 58.90, change: -0.35, dividendYield: 12.3 },
  'FEXC11': { price: 64.25, change: 0.20, dividendYield: 13.6 },
  'HFOF11': { price: 78.40, change: 0.45, dividendYield: 11.9 },
  'XPCI11': { price: 86.55, change: 0.30, dividendYield: 14.1 },
  'HABT11': { price: 88.20, change: -0.55, dividendYield: 15.3 },
  'DEVA11': { price: 42.85, change: -0.40, dividendYield: 18.2 },
  'VGHF11': { price: 8.95, change: 0.08, dividendYield: 15.8 },
  'HGCR11': { price: 102.30, change: 0.65, dividendYield: 13.4 },
  'MCCI11': { price: 92.45, change: 0.40, dividendYield: 12.7 },
  'RZTR11': { price: 98.70, change: -0.25, dividendYield: 14.9 },
  'SNFF11': { price: 86.35, change: 0.50, dividendYield: 12.1 },
  'AFHI11': { price: 95.80, change: 0.35, dividendYield: 14.6 },
  'URPR11': { price: 82.15, change: -0.60, dividendYield: 16.8 },
  'TGAR11': { price: 118.45, change: 0.90, dividendYield: 9.7 },
  'PLCR11': { price: 88.60, change: 0.25, dividendYield: 13.9 },
  'HGFF11': { price: 82.90, change: -0.35, dividendYield: 11.5 },
  'RBRF11': { price: 72.45, change: 0.40, dividendYield: 12.9 },
  'GTWR11': { price: 78.30, change: -0.20, dividendYield: 10.7 },
  'ALZR11': { price: 112.85, change: 0.75, dividendYield: 8.9 },
  'BTRA11': { price: 62.40, change: 0.30, dividendYield: 15.4 },
};

export function useFIIPrices() {
  const [prices, setPrices] = useState<Record<string, FIIPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const symbolsToFetch = symbols || Object.keys(mockFIIs);
      const priceMap: Record<string, FIIPrice> = {};

      symbolsToFetch.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        const fiiData = mockFIIs[upperSymbol];
        
        if (fiiData) {
          // Adiciona variação aleatória pequena para simular tempo real
          const variation = (Math.random() - 0.5) * 0.3;
          const currentPrice = fiiData.price + variation;
          
          priceMap[upperSymbol] = {
            symbol: upperSymbol,
            price: Math.round(currentPrice * 100) / 100,
            change: fiiData.change + variation,
            changePercent: ((fiiData.change + variation) / fiiData.price) * 100,
            dividendYield: fiiData.dividendYield,
            lastUpdated: new Date().toISOString(),
          };
        }
      });

      setPrices(priceMap);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      console.error('Erro ao buscar preços de FIIs:', err);
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
    const fiiPrice = prices[upperSymbol];
    if (!fiiPrice) return null;
    return {
      change: fiiPrice.change,
      percent: fiiPrice.changePercent,
    };
  }, [prices]);

  const getDividendYield = useCallback((symbol: string): number | null => {
    const upperSymbol = symbol.toUpperCase();
    return prices[upperSymbol]?.dividendYield ?? null;
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
    getDividendYield,
  };
}
