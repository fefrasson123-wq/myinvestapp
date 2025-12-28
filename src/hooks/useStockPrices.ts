import { useState, useEffect, useCallback } from 'react';
import { stocksList, fiiList, StockAsset } from '@/data/stocksList';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  open: number;
  lastUpdated: string;
}

// Gera preços baseados nos dados atualizados da lista
function generateLivePrices(): Record<string, StockAsset> {
  const allAssets = [...stocksList, ...fiiList];
  const priceMap: Record<string, StockAsset> = {};
  
  allAssets.forEach(asset => {
    priceMap[asset.ticker] = asset;
  });
  
  return priceMap;
}

const basePrices = generateLivePrices();

export function useStockPrices() {
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simula delay de rede curto
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const symbolsToFetch = symbols || Object.keys(basePrices);
      const priceMap: Record<string, StockPrice> = {};

      symbolsToFetch.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        const stockData = basePrices[upperSymbol];
        
        if (stockData) {
          // Adiciona variação aleatória pequena para simular tempo real (±0.5%)
          const variationPercent = (Math.random() - 0.5) * 0.01;
          const variation = stockData.price * variationPercent;
          const currentPrice = stockData.price + variation;
          
          // Calcula high/low baseado no preço e variação
          const baseHigh = currentPrice * (1 + Math.abs(stockData.changePercent) / 100 + 0.005);
          const baseLow = currentPrice * (1 - Math.abs(stockData.changePercent) / 100 - 0.005);
          
          priceMap[upperSymbol] = {
            symbol: upperSymbol,
            price: Math.round(currentPrice * 100) / 100,
            change: stockData.change + variation,
            changePercent: stockData.changePercent + variationPercent * 100,
            high24h: Math.round(baseHigh * 100) / 100,
            low24h: Math.round(baseLow * 100) / 100,
            open: Math.round((currentPrice - stockData.change) * 100) / 100,
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
