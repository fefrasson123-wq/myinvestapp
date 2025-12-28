import { useState, useEffect, useCallback } from 'react';
import { fiiList, StockAsset } from '@/data/stocksList';

interface FIIPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dividendYield: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

// Dividend Yields aproximados dos FIIs (dados Status Invest Dez/2024)
const fiiDividendYields: Record<string, number> = {
  'MXRF11': 12.8,
  'XPLG11': 8.9,
  'HGLG11': 8.2,
  'VISC11': 9.4,
  'XPML11': 9.8,
  'KNRI11': 8.1,
  'HGBS11': 7.6,
  'BCFF11': 10.8,
  'VILG11': 9.5,
  'PVBI11': 9.2,
  'RBRP11': 12.5,
  'BTLG11': 9.3,
  'HGRE11': 8.0,
  'JSRE11': 10.5,
  'VRTA11': 13.8,
  'CPTS11': 13.2,
  'RECR11': 14.5,
  'IRDM11': 14.0,
  'KNCR11': 12.8,
  'RBRY11': 12.2,
  'VGIR11': 14.5,
  'HSML11': 10.2,
  'MALL11': 8.8,
  'LVBI11': 8.5,
  'ALZR11': 8.4,
};

// Gera mapa de preços a partir da lista
function generateFIIPrices(): Record<string, StockAsset> {
  const priceMap: Record<string, StockAsset> = {};
  fiiList.forEach(fii => {
    priceMap[fii.ticker] = fii;
  });
  return priceMap;
}

const baseFIIPrices = generateFIIPrices();

export function useFIIPrices() {
  const [prices, setPrices] = useState<Record<string, FIIPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simula delay de rede curto
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const symbolsToFetch = symbols || Object.keys(baseFIIPrices);
      const priceMap: Record<string, FIIPrice> = {};

      symbolsToFetch.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        const fiiData = baseFIIPrices[upperSymbol];
        
        if (fiiData) {
          // Adiciona variação aleatória pequena para simular tempo real (±0.3%)
          const variationPercent = (Math.random() - 0.5) * 0.006;
          const variation = fiiData.price * variationPercent;
          const currentPrice = fiiData.price + variation;
          
          // Calcula high/low baseado no preço e variação
          const baseHigh = currentPrice * (1 + Math.abs(fiiData.changePercent) / 100 + 0.003);
          const baseLow = currentPrice * (1 - Math.abs(fiiData.changePercent) / 100 - 0.003);
          
          priceMap[upperSymbol] = {
            symbol: upperSymbol,
            price: Math.round(currentPrice * 100) / 100,
            change: fiiData.change + variation,
            changePercent: fiiData.changePercent + variationPercent * 100,
            dividendYield: fiiDividendYields[upperSymbol] || 10.0,
            high24h: Math.round(baseHigh * 100) / 100,
            low24h: Math.round(baseLow * 100) / 100,
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
