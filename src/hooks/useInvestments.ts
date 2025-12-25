import { useState, useEffect, useCallback } from 'react';
import { Investment, InvestmentCategory } from '@/types/investment';

const STORAGE_KEY = 'investments-portfolio';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setInvestments(parsed.map((inv: Investment) => ({
          ...inv,
          createdAt: new Date(inv.createdAt),
          updatedAt: new Date(inv.updatedAt),
        })));
      } catch (e) {
        console.error('Error loading investments:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveToStorage = useCallback((data: Investment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addInvestment = useCallback((data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    const currentValue = data.quantity * data.currentPrice;
    const profitLoss = currentValue - data.investedAmount;
    const profitLossPercent = data.investedAmount > 0 ? (profitLoss / data.investedAmount) * 100 : 0;

    const newInvestment: Investment = {
      ...data,
      id: generateId(),
      currentValue,
      profitLoss,
      profitLossPercent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setInvestments(prev => {
      const updated = [...prev, newInvestment];
      saveToStorage(updated);
      return updated;
    });

    return newInvestment;
  }, [saveToStorage]);

  const updateInvestment = useCallback((id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setInvestments(prev => {
      const updated = prev.map(inv => {
        if (inv.id !== id) return inv;
        
        const updatedInv = { ...inv, ...data };
        updatedInv.currentValue = updatedInv.quantity * updatedInv.currentPrice;
        updatedInv.profitLoss = updatedInv.currentValue - updatedInv.investedAmount;
        updatedInv.profitLossPercent = updatedInv.investedAmount > 0 
          ? (updatedInv.profitLoss / updatedInv.investedAmount) * 100 
          : 0;
        updatedInv.updatedAt = new Date();
        
        return updatedInv;
      });
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const getTotalValue = useCallback(() => {
    return investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  }, [investments]);

  const getTotalInvested = useCallback(() => {
    return investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  }, [investments]);

  const getTotalProfitLoss = useCallback(() => {
    return investments.reduce((sum, inv) => sum + inv.profitLoss, 0);
  }, [investments]);

  const getByCategory = useCallback((category: InvestmentCategory) => {
    return investments.filter(inv => inv.category === category);
  }, [investments]);

  const getCategoryTotals = useCallback(() => {
    const totals: Record<InvestmentCategory, number> = {
      crypto: 0,
      stocks: 0,
      fii: 0,
      cdb: 0,
      cdi: 0,
      treasury: 0,
      savings: 0,
      other: 0,
    };

    investments.forEach(inv => {
      totals[inv.category] += inv.currentValue;
    });

    return totals;
  }, [investments]);

  return {
    investments,
    isLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getTotalValue,
    getTotalInvested,
    getTotalProfitLoss,
    getByCategory,
    getCategoryTotals,
  };
}
