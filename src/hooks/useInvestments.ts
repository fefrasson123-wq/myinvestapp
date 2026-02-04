import { useState, useEffect, useCallback, useRef } from 'react';
import { Investment, InvestmentCategory } from '@/types/investment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';
import { investmentIdentityKey, normalizeText, normalizeTicker } from '@/hooks/investments/normalize';

const STORAGE_KEY = 'investments-portfolio';

export function useInvestments() {
  const { user } = useAuth();
  const { rate: usdToBrl } = useUsdBrlRate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to avoid stale closure issues in callbacks
  const investmentsRef = useRef<Investment[]>(investments);
  investmentsRef.current = investments;

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
          const mapped = data.map(inv => ({
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
            dividends: inv.dividends ? Number(inv.dividends) : undefined,
            address: inv.address || undefined,
            areaM2: inv.area_m2 ? Number(inv.area_m2) : undefined,
            goldType: inv.gold_type as Investment['goldType'] || undefined,
            goldPurity: inv.gold_purity || undefined,
            currency: inv.currency as Investment['currency'] || undefined,
            bank: inv.bank || undefined,
            createdAt: new Date(inv.created_at),
            updatedAt: new Date(inv.updated_at),
          }));

          // Client-side merge to prevent duplicates showing in UI.
          // Then (best-effort) persist the merge in the database.
          const merged = mergeDuplicateInvestments(mapped);
          setInvestments(merged);

          // Best-effort DB dedupe only once per session.
          if (mapped.length !== merged.length) {
            void dedupeInvestmentsInDb(mapped, merged);
          }
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

  // Avoid running DB dedupe multiple times.
  const hasRunDbDedupeRef = useRef(false);

  function mergeDuplicateInvestments(items: Investment[]): Investment[] {
    // Group by identity (category+ticker or category+name)
    const groups = new Map<string, Investment[]>();
    for (const inv of items) {
      const key = investmentIdentityKey({
        category: inv.category,
        name: inv.name,
        ticker: inv.ticker,
      });
      const arr = groups.get(key);
      if (arr) arr.push(inv);
      else groups.set(key, [inv]);
    }

    const result: Investment[] = [];
    for (const group of groups.values()) {
      if (group.length === 1) {
        result.push(group[0]);
        continue;
      }

      // Use the newest updatedAt as the “base” record.
      const base = [...group].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

      const totalQty = group.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
      const weightedAvg = totalQty > 0
        ? group.reduce((sum, g) => sum + Number(g.quantity || 0) * Number(g.averagePrice || 0), 0) / totalQty
        : base.averagePrice;

      const investedAmount = totalQty * weightedAvg;
      const currentValue = totalQty * base.currentPrice;
      const profitLoss = currentValue - investedAmount;
      const profitLossPercent = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

      result.push({
        ...base,
        // Normalize minor differences
        name: base.name.trim(),
        ticker: base.ticker ? base.ticker.trim().toUpperCase() : undefined,
        quantity: totalQty,
        averagePrice: weightedAvg,
        investedAmount,
        currentValue,
        profitLoss,
        profitLossPercent,
      });
    }

    // Keep “newest first” like the query order.
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function dedupeInvestmentsInDb(before: Investment[], after: Investment[]) {
    if (!user) return;
    if (hasRunDbDedupeRef.current) return;
    hasRunDbDedupeRef.current = true;

    // Build groups from BEFORE to know duplicates ids.
    const byKey = new Map<string, Investment[]>();
    for (const inv of before) {
      const key = investmentIdentityKey({ category: inv.category, name: inv.name, ticker: inv.ticker });
      const arr = byKey.get(key);
      if (arr) arr.push(inv);
      else byKey.set(key, [inv]);
    }

    for (const [key, group] of byKey.entries()) {
      if (group.length <= 1) continue;

      // Find the merged record corresponding to this key.
      const merged = after.find((x) => investmentIdentityKey({ category: x.category, name: x.name, ticker: x.ticker }) === key);
      if (!merged) continue;

      // Choose the newest updated investment as the survivor.
      const survivor = [...group].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const duplicates = group.filter((g) => g.id !== survivor.id);
      if (duplicates.length === 0) continue;

      // 1) Update survivor fields to merged values
      await supabase
        .from('investments')
        .update({
          name: merged.name,
          ticker: merged.ticker ?? null,
          quantity: merged.quantity,
          average_price: merged.averagePrice,
          invested_amount: merged.investedAmount,
          current_price: merged.currentPrice,
          current_value: merged.currentValue,
          profit_loss: merged.profitLoss,
          profit_loss_percent: merged.profitLossPercent,
        })
        .eq('id', survivor.id);

      // 2) Repoint transactions + tags
      for (const dup of duplicates) {
        await supabase
          .from('transactions')
          .update({ investment_id: survivor.id })
          .eq('investment_id', dup.id);

        // investment_tags doesn't allow UPDATE (by policy), so we copy+delete.
        const { data: dupTags, error: dupTagsError } = await supabase
          .from('investment_tags')
          .select('tag')
          .eq('investment_id', dup.id);

        if (dupTagsError) {
          console.error('Error loading tags for duplicate investment:', dupTagsError);
        } else if (dupTags && dupTags.length > 0) {
          // Insert tags for survivor (best-effort; duplicates are acceptable for now)
          await supabase
            .from('investment_tags')
            .insert(
              dupTags.map(t => ({
                user_id: user.id,
                investment_id: survivor.id,
                tag: t.tag,
              }))
            );
        }

        // Remove tags for duplicate investment
        await supabase
          .from('investment_tags')
          .delete()
          .eq('investment_id', dup.id);

        // 3) Delete the duplicate investment
        await supabase
          .from('investments')
          .delete()
          .eq('id', dup.id);
      }
    }
  }

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
    const currentInvestments = investmentsRef.current;
    // Para ativos com ticker, busca pelo ticker
    if (data.ticker) {
      const wanted = normalizeTicker(data.ticker);
      return currentInvestments.find(inv => 
        normalizeTicker(inv.ticker) === wanted && 
        inv.category === data.category
      );
    }
    // Para outros ativos, busca pelo nome exato e categoria
    const wantedName = normalizeText(data.name);
    return currentInvestments.find(inv => 
      normalizeText(inv.name) === wantedName && 
      inv.category === data.category
    );
  }, []);

  const updateInvestment = useCallback(async (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => {
    // Busca o investimento no estado local OU diretamente no banco se não encontrar
    let investment = investmentsRef.current.find(inv => inv.id === id);
    
    // Se não encontrou no estado local, busca do banco (pode acontecer após mesclagem)
    if (!investment && user) {
      const { data: dbInvestment } = await supabase
        .from('investments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (dbInvestment) {
        investment = {
          id: dbInvestment.id,
          name: dbInvestment.name,
          category: dbInvestment.category as Investment['category'],
          ticker: dbInvestment.ticker || undefined,
          quantity: Number(dbInvestment.quantity),
          averagePrice: Number(dbInvestment.average_price),
          currentPrice: Number(dbInvestment.current_price),
          investedAmount: Number(dbInvestment.invested_amount),
          currentValue: Number(dbInvestment.current_value),
          profitLoss: Number(dbInvestment.profit_loss),
          profitLossPercent: Number(dbInvestment.profit_loss_percent),
          notes: dbInvestment.notes || undefined,
          purchaseDate: dbInvestment.purchase_date || undefined,
          maturityDate: dbInvestment.maturity_date || undefined,
          interestRate: dbInvestment.interest_rate ? Number(dbInvestment.interest_rate) : undefined,
          dividends: dbInvestment.dividends ? Number(dbInvestment.dividends) : undefined,
          address: dbInvestment.address || undefined,
          areaM2: dbInvestment.area_m2 ? Number(dbInvestment.area_m2) : undefined,
          createdAt: new Date(dbInvestment.created_at),
          updatedAt: new Date(dbInvestment.updated_at),
        };
      }
    }
    
    if (!investment) {
      console.error('Investment not found:', id);
      return;
    }

    const updatedInv = { ...investment, ...data };
    
    // Recalcula o investedAmount se quantidade ou preço médio mudou
    if (data.quantity !== undefined || data.averagePrice !== undefined) {
      updatedInv.investedAmount = updatedInv.quantity * updatedInv.averagePrice;
    }
    
    // Se investedAmount foi passado explicitamente, usa ele
    if (data.investedAmount !== undefined) {
      updatedInv.investedAmount = data.investedAmount;
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
      // Recalcula o currentValue baseado na quantidade atual e preço atual
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
          dividends: updatedInv.dividends || null,
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
  }, [user, saveToStorage]);

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
      return investmentsRef.current.find(inv => inv.id === existingInvestment.id) || existingInvestment;
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
          dividends: data.dividends || null,
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
        dividends: newData.dividends ? Number(newData.dividends) : undefined,
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
  }, [user, saveToStorage, findExistingInvestment, updateInvestment]);

  const deleteInvestment = useCallback(async (id: string): Promise<Investment | null> => {
    // Find the investment before deleting
    const deletedInvestment = investmentsRef.current.find(inv => inv.id === id);
    if (!deletedInvestment) return null;

    // Remove from local state immediately for instant UI feedback
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    
    if (user) {
      // IMPORTANT: delete ALL linked transactions first.
      // Otherwise the investment delete can fail due to FK constraint and it will “not disappear”.
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('investment_id', id);

      if (transactionsError) {
        console.error('Error deleting transactions for investment:', transactionsError);
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
  }, [user]);

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
