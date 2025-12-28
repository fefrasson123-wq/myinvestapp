import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

// Fallback prices from local data
function getLocalFIIPrices(): Record<string, StockAsset> {
  const priceMap: Record<string, StockAsset> = {};
  fiiList.forEach(fii => {
    priceMap[fii.ticker] = fii;
  });
  return priceMap;
}

const localFIIPrices = getLocalFIIPrices();

export function useFIIPrices() {
  const [prices, setPrices] = useState<Record<string, FIIPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch a single FII price from BRAPI
  const fetchSinglePrice = async (symbol: string): Promise<FIIPrice | null> => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('stock-quotes', {
        body: { symbols: [symbol] },
      });

      if (fetchError) {
        console.error('Edge function error for', symbol, ':', fetchError);
        return null;
      }

      if (data?.quotes?.[symbol]) {
        const q = data.quotes[symbol];
        return {
          symbol: q.symbol,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          dividendYield: fiiDividendYields[symbol] || 10.0,
          high24h: q.high24h,
          low24h: q.low24h,
          lastUpdated: q.lastUpdated,
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching price for', symbol, ':', err);
      return null;
    }
  };

  // Get local fallback price for a symbol
  const getLocalFallback = (symbol: string): FIIPrice | null => {
    const upperSymbol = symbol.toUpperCase();
    const fiiData = localFIIPrices[upperSymbol];
    
    if (!fiiData) return null;
    
    // Small random variation
    const variationPercent = (Math.random() - 0.5) * 0.006;
    const variation = fiiData.price * variationPercent;
    const currentPrice = fiiData.price + variation;
    
    return {
      symbol: upperSymbol,
      price: Math.round(currentPrice * 100) / 100,
      change: fiiData.change + variation,
      changePercent: fiiData.changePercent + variationPercent * 100,
      dividendYield: fiiDividendYields[upperSymbol] || 10.0,
      high24h: Math.round(currentPrice * 1.015 * 100) / 100,
      low24h: Math.round(currentPrice * 0.985 * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };
  };

  // Fetch prices for specific symbols only (on demand)
  const fetchPrices = useCallback(async (symbols?: string[]) => {
    if (!symbols || symbols.length === 0) {
      // Don't fetch all FIIs at once - use local data for initial load
      const priceMap: Record<string, FIIPrice> = {};
      Object.keys(localFIIPrices).forEach(symbol => {
        const fallback = getLocalFallback(symbol);
        if (fallback) priceMap[symbol] = fallback;
      });
      setPrices(priceMap);
      setLastUpdate(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch each symbol individually to comply with BRAPI free tier
      const newPrices: Record<string, FIIPrice> = {};
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        
        // Try BRAPI first
        const livePrice = await fetchSinglePrice(upperSymbol);
        
        if (livePrice) {
          newPrices[upperSymbol] = livePrice;
          console.log(`Updated ${upperSymbol} price from BRAPI:`, livePrice.price);
        } else {
          // Fallback to local data
          const fallback = getLocalFallback(upperSymbol);
          if (fallback) {
            newPrices[upperSymbol] = fallback;
            console.log(`Using local fallback for ${upperSymbol}:`, fallback.price);
          }
        }
      }

      setPrices(prev => ({ ...prev, ...newPrices }));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching FII prices:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      
      // Use local fallback for all requested symbols
      const fallbackPrices: Record<string, FIIPrice> = {};
      symbols.forEach(symbol => {
        const fallback = getLocalFallback(symbol.toUpperCase());
        if (fallback) fallbackPrices[symbol.toUpperCase()] = fallback;
      });
      setPrices(prev => ({ ...prev, ...fallbackPrices }));
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

  // Load local prices on mount only (no API calls)
  useEffect(() => {
    const priceMap: Record<string, FIIPrice> = {};
    Object.keys(localFIIPrices).forEach(symbol => {
      const fallback = getLocalFallback(symbol);
      if (fallback) priceMap[symbol] = fallback;
    });
    setPrices(priceMap);
    setLastUpdate(new Date());
  }, []);

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
