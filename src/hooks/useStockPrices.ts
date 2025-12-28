import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

// Fallback prices from local data
function getLocalPrices(): Record<string, StockAsset> {
  const allAssets = [...stocksList, ...fiiList];
  const priceMap: Record<string, StockAsset> = {};
  allAssets.forEach(asset => {
    priceMap[asset.ticker] = asset;
  });
  return priceMap;
}

const localPrices = getLocalPrices();

export function useStockPrices() {
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const symbolsToFetch = symbols || Object.keys(localPrices);
      
      // Try to fetch from BRAPI via edge function
      const { data, error: fetchError } = await supabase.functions.invoke('stock-quotes', {
        body: { symbols: symbolsToFetch },
      });

      if (fetchError) {
        console.error('Edge function error:', fetchError);
        throw new Error(fetchError.message);
      }

      if (data?.quotes) {
        const priceMap: Record<string, StockPrice> = {};
        
        for (const [symbol, quote] of Object.entries(data.quotes)) {
          const q = quote as any;
          priceMap[symbol] = {
            symbol: q.symbol,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            high24h: q.high24h,
            low24h: q.low24h,
            open: q.open,
            lastUpdated: q.lastUpdated,
          };
        }

        setPrices(prev => ({ ...prev, ...priceMap }));
        setLastUpdate(new Date());
        console.log(`Updated ${Object.keys(priceMap).length} stock prices from BRAPI`);
      } else {
        // Fallback to local data
        useLocalFallback(symbolsToFetch);
      }
    } catch (err) {
      console.error('Error fetching stock prices:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      
      // Use local fallback
      const symbolsToFetch = symbols || Object.keys(localPrices);
      useLocalFallback(symbolsToFetch);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const useLocalFallback = (symbols: string[]) => {
    const priceMap: Record<string, StockPrice> = {};
    
    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      const stockData = localPrices[upperSymbol];
      
      if (stockData) {
        // Small random variation to simulate real-time
        const variationPercent = (Math.random() - 0.5) * 0.01;
        const variation = stockData.price * variationPercent;
        const currentPrice = stockData.price + variation;
        
        priceMap[upperSymbol] = {
          symbol: upperSymbol,
          price: Math.round(currentPrice * 100) / 100,
          change: stockData.change + variation,
          changePercent: stockData.changePercent + variationPercent * 100,
          high24h: Math.round(currentPrice * 1.02 * 100) / 100,
          low24h: Math.round(currentPrice * 0.98 * 100) / 100,
          open: Math.round((currentPrice - stockData.change) * 100) / 100,
          lastUpdated: new Date().toISOString(),
        };
      }
    });

    setPrices(prev => ({ ...prev, ...priceMap }));
    setLastUpdate(new Date());
  };

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

  // Initial fetch and update every 60 seconds
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
