import { useState, useEffect, useCallback } from 'react';
import { Investment, InvestmentCategory } from '@/types/investment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';

const STORAGE_KEY = 'investments-portfolio';

export function useInvestments() {
  const { user } = useAuth();
  const { rate: usdToBrl } = useUsdBrlRate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase or localStorage
  useEffect(() => {
    const loadInvestments = async () => {
      setIsLoading(true);
      
      if (user) {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading investments:', error);
        } else if (data) {
          setInvestments(data.map(inv => ({
            id: inv.id,
            name: inv.name,
            category: inv.category as InvestmentCategory,
            ticker: inv.ticker || undefined,
            quantity: Number(inv.quantity),
            averagePrice: Number(inv.average_price),
            currentPrice: Number(inv.current_price),
            investedAmount: Number(inv.invested_amount),
            currentValue: Number(inv.current_value),
            profitLoss: Number(inv.profit_loss),
            profitLossPercent: Number(inv.profit_loss_percent),
            notes: inv.notes || undefined,
            purchaseDate: inv.purchase_date || undefined,
            maturityDate: inv.maturity_date || undefined,
            interestRate: inv.interest_rate ? Number(inv.interest_rate) : undefined,
            address: inv.address || undefined,
            areaM2: inv.area_m2 ? Number(inv.area_m2) : undefined,
            createdAt: new Date(inv.created_at),
            updatedAt: new Date(inv.updated_at),
          })));
        }
      } else {
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
      }
      setIsLoading(false);
    };

    loadInvestments();
  }, [user]);

  const saveToStorage = useCallback((data: Investment[]) => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [user]);

  const calculateFixedIncomeValue = useCallback((investment: Investment) => {
    const isFixedIncome = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'].includes(investment.category);
    
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

  // Recalculate fixed income values
  useEffect(() => {
    if (investments.length > 0 && !isLoading) {
      const needsUpdate = investments.some(inv => 
        ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'].includes(inv.category) &&
        inv.interestRate && 
        inv.purchaseDate
      );

      if (needsUpdate) {
        const updated = investments.map(inv => {
          if (!['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'].includes(inv.category)) return inv;
          
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
        
        // Only update if values changed
        const hasChanges = updated.some((inv, i) => 
          inv.currentValue !== investments[i].currentValue
        );
        
        if (hasChanges) {
          setInvestments(updated);
          saveToStorage(updated);
        }
      }
    }
  }, [investments.length, isLoading, calculateFixedIncomeValue, saveToStorage, investments]);

  // Encontra investimento existente pelo ticker ou nome
  const findExistingInvestment = useCallback((data: { ticker?: string; name: string; category: InvestmentCategory }) => {
    // Para ativos com ticker, busca pelo ticker
    if (data.ticker) {
      return investments.find(inv => 
        inv.ticker?.toLowerCase() === data.ticker?.toLowerCase() && 
        inv.category === data.category
      );
    }
    // Para outros ativos, busca pelo nome exato e categoria
    return investments.find(inv => 
      inv.name.toLowerCase() === data.name.toLowerCase() && 
      inv.category === data.category
    );
  }, [investments]);

  const updateInvestment = useCallback(async (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const investment = investments.find(inv => inv.id === id);
    if (!investment) return;

    const updatedInv = { ...investment, ...data };
    
    if (data.quantity !== undefined || data.averagePrice !== undefined) {
      updatedInv.investedAmount = updatedInv.quantity * updatedInv.averagePrice;
    }
    
    const isFixedIncome = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'].includes(updatedInv.category);
    
    if (isFixedIncome && updatedInv.interestRate && updatedInv.purchaseDate) {
      const purchaseDate = new Date(updatedInv.purchaseDate);
      const now = new Date();
      const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsElapsed > 0) {
        updatedInv.currentValue = updatedInv.investedAmount * Math.pow(1 + updatedInv.interestRate / 100, yearsElapsed);
        updatedInv.currentPrice = updatedInv.currentValue / updatedInv.quantity;
      } else {
        updatedInv.currentValue = updatedInv.investedAmount;
        updatedInv.currentPrice = updatedInv.averagePrice;
      }
    } else {
      updatedInv.currentValue = updatedInv.quantity * updatedInv.currentPrice;
    }
    
    updatedInv.profitLoss = updatedInv.currentValue - updatedInv.investedAmount;
    updatedInv.profitLossPercent = updatedInv.investedAmount > 0 
      ? (updatedInv.profitLoss / updatedInv.investedAmount) * 100 
      : 0;

    if (user) {
      const { error } = await supabase
        .from('investments')
        .update({
          name: updatedInv.name,
          category: updatedInv.category,
          ticker: updatedInv.ticker || null,
          quantity: updatedInv.quantity,
          average_price: updatedInv.averagePrice,
          current_price: updatedInv.currentPrice,
          invested_amount: updatedInv.investedAmount,
          current_value: updatedInv.currentValue,
          profit_loss: updatedInv.profitLoss,
          profit_loss_percent: updatedInv.profitLossPercent,
          notes: updatedInv.notes || null,
          purchase_date: updatedInv.purchaseDate || null,
          maturity_date: updatedInv.maturityDate || null,
          interest_rate: updatedInv.interestRate || null,
          address: updatedInv.address || null,
          area_m2: updatedInv.areaM2 || null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating investment:', error);
        return;
      }
    }

    setInvestments(prev => {
      const updated = prev.map(inv => inv.id === id ? { ...updatedInv, updatedAt: new Date() } : inv);
      saveToStorage(updated);
      return updated;
    });
  }, [user, investments, saveToStorage]);

  const addInvestment = useCallback(async (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    const isFixedIncome = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'].includes(data.category);
    
    // Verifica se já existe um investimento com esse ticker/nome
    const existingInvestment = findExistingInvestment(data);
    
    if (existingInvestment) {
      // Calcula o novo preço médio ponderado
      const oldQuantity = existingInvestment.quantity;
      const oldAveragePrice = existingInvestment.averagePrice;
      const newQuantity = data.quantity;
      const newPrice = data.averagePrice;
      
      const totalQuantity = oldQuantity + newQuantity;
      const weightedAveragePrice = (oldQuantity * oldAveragePrice + newQuantity * newPrice) / totalQuantity;
      const newInvestedAmount = totalQuantity * weightedAveragePrice;
      
      // Atualiza o investimento existente
      await updateInvestment(existingInvestment.id, {
        quantity: totalQuantity,
        averagePrice: weightedAveragePrice,
        investedAmount: newInvestedAmount,
        currentPrice: data.currentPrice || existingInvestment.currentPrice,
      });
      
      // Retorna o investimento atualizado
      return investments.find(inv => inv.id === existingInvestment.id) || existingInvestment;
    }

    // Se não existe, cria um novo investimento
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

    if (user) {
      const { data: newData, error } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          name: data.name,
          category: data.category,
          ticker: data.ticker || null,
          quantity: data.quantity,
          average_price: data.averagePrice,
          current_price: currentValue / data.quantity,
          invested_amount: data.investedAmount,
          current_value: currentValue,
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
          notes: data.notes || null,
          purchase_date: data.purchaseDate || null,
          maturity_date: data.maturityDate || null,
          interest_rate: data.interestRate || null,
          address: data.address || null,
          area_m2: data.areaM2 || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding investment:', error);
        return null;
      }

      const newInvestment: Investment = {
        id: newData.id,
        name: newData.name,
        category: newData.category as InvestmentCategory,
        ticker: newData.ticker || undefined,
        quantity: Number(newData.quantity),
        averagePrice: Number(newData.average_price),
        currentPrice: Number(newData.current_price),
        investedAmount: Number(newData.invested_amount),
        currentValue: Number(newData.current_value),
        profitLoss: Number(newData.profit_loss),
        profitLossPercent: Number(newData.profit_loss_percent),
        notes: newData.notes || undefined,
        purchaseDate: newData.purchase_date || undefined,
        maturityDate: newData.maturity_date || undefined,
        interestRate: newData.interest_rate ? Number(newData.interest_rate) : undefined,
        address: newData.address || undefined,
        areaM2: newData.area_m2 ? Number(newData.area_m2) : undefined,
        createdAt: new Date(newData.created_at),
        updatedAt: new Date(newData.updated_at),
      };

      setInvestments(prev => [newInvestment, ...prev]);
      return newInvestment;
    } else {
      const newInvestment: Investment = {
        ...data,
        id: Math.random().toString(36).substring(2, 15),
        currentValue,
        currentPrice: currentValue / data.quantity,
        profitLoss,
        profitLossPercent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setInvestments(prev => {
        const updated = [newInvestment, ...prev];
        saveToStorage(updated);
        return updated;
      });

      return newInvestment;
    }
  }, [user, saveToStorage, findExistingInvestment, updateInvestment, investments]);

  const deleteInvestment = useCallback(async (id: string): Promise<Investment | null> => {
    // Find the investment before deleting
    const deletedInvestment = investments.find(inv => inv.id === id);
    if (!deletedInvestment) return null;

    // Remove from local state immediately for instant UI feedback
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    
    if (user) {
      // First, find and delete only the most recent transaction for this investment
      const { data: recentTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('investment_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentTransaction) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', recentTransaction.id);

        if (transactionError) {
          console.error('Error deleting recent transaction:', transactionError);
        } else {
          console.log('Most recent transaction deleted for investment:', id);
        }
      }

      // Then delete the investment - tags will be cascaded automatically via ON DELETE CASCADE
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting investment:', error);
        // Reload investments if delete failed
        const { data } = await supabase
          .from('investments')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          setInvestments(data.map(inv => ({
            id: inv.id,
            name: inv.name,
            category: inv.category as InvestmentCategory,
            ticker: inv.ticker || undefined,
            quantity: Number(inv.quantity),
            averagePrice: Number(inv.average_price),
            currentPrice: Number(inv.current_price),
            investedAmount: Number(inv.invested_amount),
            currentValue: Number(inv.current_value),
            profitLoss: Number(inv.profit_loss),
            profitLossPercent: Number(inv.profit_loss_percent),
            notes: inv.notes || undefined,
            purchaseDate: inv.purchase_date || undefined,
            maturityDate: inv.maturity_date || undefined,
            interestRate: inv.interest_rate ? Number(inv.interest_rate) : undefined,
            address: inv.address || undefined,
            areaM2: inv.area_m2 ? Number(inv.area_m2) : undefined,
            createdAt: new Date(inv.created_at),
            updatedAt: new Date(inv.updated_at),
          })));
        }
        return null;
      }
      
      console.log('Investment deleted successfully:', id);
    } else {
      // Update localStorage for non-authenticated users
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.filter((inv: Investment) => inv.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }

    return deletedInvestment;
  }, [user, investments]);

  const restoreInvestment = useCallback(async (investment: Investment): Promise<boolean> => {
    if (user) {
      const { error } = await supabase
        .from('investments')
        .insert({
          id: investment.id,
          user_id: user.id,
          name: investment.name,
          category: investment.category,
          ticker: investment.ticker || null,
          quantity: investment.quantity,
          average_price: investment.averagePrice,
          current_price: investment.currentPrice,
          invested_amount: investment.investedAmount,
          current_value: investment.currentValue,
          profit_loss: investment.profitLoss,
          profit_loss_percent: investment.profitLossPercent,
          notes: investment.notes || null,
          purchase_date: investment.purchaseDate || null,
          maturity_date: investment.maturityDate || null,
          interest_rate: investment.interestRate || null,
          address: investment.address || null,
          area_m2: investment.areaM2 || null,
        });

      if (error) {
        console.error('Error restoring investment:', error);
        return false;
      }
    }

    setInvestments(prev => [investment, ...prev]);
    if (!user) {
      saveToStorage([investment, ...investments]);
    }
    
    return true;
  }, [user, investments, saveToStorage]);

  const getTotalValue = useCallback(() => {
    return investments.reduce((sum, inv) => {
      const value = inv.currentValue;
      return sum + (inv.category === 'crypto' ? value * usdToBrl : value);
    }, 0);
  }, [investments, usdToBrl]);

  const getTotalInvested = useCallback(() => {
    return investments.reduce((sum, inv) => {
      const value = inv.investedAmount;
      return sum + (inv.category === 'crypto' ? value * usdToBrl : value);
    }, 0);
  }, [investments, usdToBrl]);

  const getTotalProfitLoss = useCallback(() => {
    return investments.reduce((sum, inv) => {
      const value = inv.profitLoss;
      return sum + (inv.category === 'crypto' ? value * usdToBrl : value);
    }, 0);
  }, [investments, usdToBrl]);

  const getByCategory = useCallback((category: InvestmentCategory) => {
    return investments.filter(inv => inv.category === category);
  }, [investments]);

  const getCategoryTotals = useCallback(() => {
    const totals: Record<InvestmentCategory, number> = {
      crypto: 0,
      stocks: 0,
      fii: 0,
      cdb: 0,
      lci: 0,
      lca: 0,
      lcilca: 0,
      treasury: 0,
      savings: 0,
      debentures: 0,
      cricra: 0,
      fixedincomefund: 0,
      cash: 0,
      realestate: 0,
      gold: 0,
      usastocks: 0,
      reits: 0,
      bdr: 0,
      etf: 0,
      other: 0,
    };

    investments.forEach(inv => {
      const value = inv.category === 'crypto' ? inv.currentValue * usdToBrl : inv.currentValue;
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
    restoreInvestment,
    getTotalValue,
    getTotalInvested,
    getTotalProfitLoss,
    getByCategory,
    getCategoryTotals,
  };
}
