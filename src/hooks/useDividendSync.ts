import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Investment } from '@/types/investment';
import { toast } from 'sonner';

// Categories that pay dividends and should be synced
const DIVIDEND_CATEGORIES = ['stocks', 'fii', 'bdr', 'etf'];

// Sync interval: 6 hours (in milliseconds)
const SYNC_INTERVAL = 6 * 60 * 60 * 1000;
const STORAGE_KEY = 'last_dividend_sync';

interface SyncResult {
  success: boolean;
  inserted: number;
  error?: string;
}

export function useDividendSync(investments: Investment[]) {
  const { user, session } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const hasSyncedRef = useRef(false);

  // Get dividend-paying investments with tickers
  const getDividendInvestments = useCallback(() => {
    return investments.filter(inv => 
      DIVIDEND_CATEGORIES.includes(inv.category) && inv.ticker
    );
  }, [investments]);

  // Check if sync is needed (last sync was > 6 hours ago)
  const shouldSync = useCallback(() => {
    const lastSyncStr = localStorage.getItem(STORAGE_KEY);
    if (!lastSyncStr) return true;

    const lastSyncTime = new Date(lastSyncStr).getTime();
    const now = Date.now();
    return (now - lastSyncTime) > SYNC_INTERVAL;
  }, []);

  // Sync dividends from BRAPI
  const syncDividends = useCallback(async (force = false): Promise<SyncResult> => {
    if (!user || !session?.access_token) {
      return { success: false, inserted: 0, error: 'Not authenticated' };
    }

    if (!force && !shouldSync()) {
      console.log('Dividend sync skipped - synced recently');
      return { success: true, inserted: 0 };
    }

    const dividendInvestments = getDividendInvestments();
    if (dividendInvestments.length === 0) {
      console.log('No dividend-paying investments to sync');
      return { success: true, inserted: 0 };
    }

    setIsSyncing(true);

    try {
      // Build ticker list and investment map
      const tickers = dividendInvestments
        .map(inv => inv.ticker?.toUpperCase())
        .filter((t): t is string => !!t);
      
      const investmentMap: Record<string, { id: string; name: string; category: string }> = {};
      dividendInvestments.forEach(inv => {
        if (inv.ticker) {
          investmentMap[inv.ticker.toUpperCase()] = {
            id: inv.id,
            name: inv.name,
            category: inv.category,
          };
        }
      });

      console.log(`Syncing dividends for ${tickers.length} tickers...`);

      const { data, error } = await supabase.functions.invoke('fetch-dividends', {
        body: { tickers, investmentMap },
      });

      if (error) {
        console.error('Error syncing dividends:', error);
        const result = { success: false, inserted: 0, error: error.message };
        setLastResult(result);
        return result;
      }

      // Update last sync time
      const now = new Date();
      localStorage.setItem(STORAGE_KEY, now.toISOString());
      setLastSync(now);

      const result: SyncResult = {
        success: true,
        inserted: data?.inserted || 0,
      };
      setLastResult(result);

      if (result.inserted > 0) {
        toast.success(`${result.inserted} novo(s) dividendo(s) sincronizado(s)!`);
      }

      console.log(`Dividend sync complete: ${result.inserted} new payments`);
      return result;

    } catch (err) {
      console.error('Error in dividend sync:', err);
      const result = { 
        success: false, 
        inserted: 0, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
      setLastResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [user, session, shouldSync, getDividendInvestments]);

  // Auto-sync on mount (if needed)
  useEffect(() => {
    if (user && investments.length > 0 && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      
      // Small delay to not block initial render
      const timer = setTimeout(() => {
        syncDividends(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, investments.length, syncDividends]);

  // Load last sync time from storage
  useEffect(() => {
    const lastSyncStr = localStorage.getItem(STORAGE_KEY);
    if (lastSyncStr) {
      setLastSync(new Date(lastSyncStr));
    }
  }, []);

  return {
    isSyncing,
    lastSync,
    lastResult,
    syncDividends,
    shouldSync: shouldSync(),
  };
}
