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

  // Calculate current value for fixed income based on elapsed time and interest rate
  const calculateFixedIncomeValue = useCallback((investment: Investment) => {
    const isFixedIncome = ['cdb', 'cdi', 'treasury', 'savings'].includes(investment.category);
    
    if (!isFixedIncome || !investment.interestRate || !investment.purchaseDate) {
      return investment.quantity * investment.currentPrice;
    }

    const purchaseDate = new Date(investment.purchaseDate);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsElapsed <= 0) {
      return investment.investedAmount;
    }

    return investment.investedAmount * Math.pow(1 + investment.interestRate / 100, yearsElapsed);
  }, []);

  // Recalculate fixed income values on load
  useEffect(() => {
    if (investments.length > 0) {
      const needsUpdate = investments.some(inv => 
        ['cdb', 'cdi', 'treasury', 'savings'].includes(inv.category) && 
        inv.interestRate && 
        inv.purchaseDate
      );

      if (needsUpdate) {
        setInvestments(prev => {
          const updated = prev.map(inv => {
            const currentValue = calculateFixedIncomeValue(inv);
            const profitLoss = currentValue - inv.investedAmount;
            const profitLossPercent = inv.investedAmount > 0 
              ? (profitLoss / inv.investedAmount) * 100 
              : 0;
            
            return {
              ...inv,
              currentValue,
              currentPrice: currentValue / inv.quantity,
              profitLoss,
              profitLossPercent,
            };
          });
          saveToStorage(updated);
          return updated;
        });
      }
    }
  }, [investments.length, calculateFixedIncomeValue, saveToStorage]);

  const addInvestment = useCallback((data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    const isFixedIncome = ['cdb', 'cdi', 'treasury', 'savings'].includes(data.category);
    let currentValue: number;

    if (isFixedIncome && data.interestRate && data.purchaseDate) {
      const purchaseDate = new Date(data.purchaseDate);
      const now = new Date();
      const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      currentValue = yearsElapsed > 0 
        ? data.investedAmount * Math.pow(1 + data.interestRate / 100, yearsElapsed)
        : data.investedAmount;
    } else {
      currentValue = data.quantity * data.currentPrice;
    }

    const profitLoss = currentValue - data.investedAmount;
    const profitLossPercent = data.investedAmount > 0 ? (profitLoss / data.investedAmount) * 100 : 0;

    const newInvestment: Investment = {
      ...data,
      id: generateId(),
      currentValue,
      currentPrice: currentValue / data.quantity,
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

  // Taxa de conversão USD -> BRL (aproximada)
  const USD_TO_BRL = 6.15;

  const getTotalValue = useCallback(() => {
    return investments.reduce((sum, inv) => {
      const value = inv.currentValue;
      // Converte criptos de USD para BRL
      return sum + (inv.category === 'crypto' ? value * USD_TO_BRL : value);
    }, 0);
  }, [investments]);

  const getTotalInvested = useCallback(() => {
    return investments.reduce((sum, inv) => {
      const value = inv.investedAmount;
      // Converte criptos de USD para BRL
      return sum + (inv.category === 'crypto' ? value * USD_TO_BRL : value);
    }, 0);
  }, [investments]);

  const getTotalProfitLoss = useCallback(() => {
    return investments.reduce((sum, inv) => {
      const value = inv.profitLoss;
      // Converte criptos de USD para BRL
      return sum + (inv.category === 'crypto' ? value * USD_TO_BRL : value);
    }, 0);
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
      cash: 0,
      realestate: 0,
      gold: 0,
      other: 0,
    };

    investments.forEach(inv => {
      // Para o gráfico de categorias, converte tudo para BRL
      const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
      totals[inv.category] += value;
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
