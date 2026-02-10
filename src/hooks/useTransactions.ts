import { useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, InvestmentCategory, TransactionType } from '@/types/investment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'investments-transactions';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    
    // Skip reload if same user (token refresh on tab switch)
    if (currentUserId && currentUserId === prevUserIdRef.current && transactions.length > 0) {
      return;
    }
    prevUserIdRef.current = currentUserId;

    const loadTransactions = async () => {
      setIsLoading(true);
      
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Error loading transactions:', error);
        } else if (data) {
          setTransactions(data.map(tx => ({
            id: tx.id,
            investmentId: tx.investment_id || '',
            investmentName: tx.investment_name,
            category: tx.category as InvestmentCategory,
            type: tx.type as TransactionType,
            quantity: Number(tx.quantity),
            price: Number(tx.price),
            total: Number(tx.total_value),
            profitLoss: tx.profit_loss ? Number(tx.profit_loss) : undefined,
            profitLossPercent: tx.profit_loss_percent ? Number(tx.profit_loss_percent) : undefined,
            date: new Date(tx.date),
            createdAt: new Date(tx.created_at),
          })));
        }
      } else {
        setTransactions([]);
      }
      setIsLoading(false);
    };

    loadTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveToStorage = useCallback((data: Transaction[]) => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [user]);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (user) {
      const { data: newData, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          investment_id: data.investmentId || null,
          investment_name: data.investmentName,
          category: data.category,
          type: data.type,
          quantity: data.quantity,
          price: data.price,
          total_value: data.total,
          profit_loss: data.profitLoss || null,
          profit_loss_percent: data.profitLossPercent || null,
          date: data.date.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        return null;
      }

      const newTransaction: Transaction = {
        id: newData.id,
        investmentId: newData.investment_id || '',
        investmentName: newData.investment_name,
        category: newData.category as InvestmentCategory,
        type: newData.type as TransactionType,
        quantity: Number(newData.quantity),
        price: Number(newData.price),
        total: Number(newData.total_value),
        profitLoss: newData.profit_loss ? Number(newData.profit_loss) : undefined,
        profitLossPercent: newData.profit_loss_percent ? Number(newData.profit_loss_percent) : undefined,
        date: new Date(newData.date),
        createdAt: new Date(newData.created_at),
      };

      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } else {
      const newTransaction: Transaction = {
        ...data,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date(),
      };

      setTransactions(prev => {
        const updated = [newTransaction, ...prev];
        saveToStorage(updated);
        return updated;
      });

      return newTransaction;
    }
  }, [user, saveToStorage]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }
    }

    setTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [user, saveToStorage]);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    if (user) {
      const updateData: Record<string, unknown> = {};
      if (data.investmentId !== undefined) updateData.investment_id = data.investmentId;
      if (data.investmentName !== undefined) updateData.investment_name = data.investmentName;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.total !== undefined) updateData.total_value = data.total;
      if (data.profitLoss !== undefined) updateData.profit_loss = data.profitLoss;
      if (data.profitLossPercent !== undefined) updateData.profit_loss_percent = data.profitLossPercent;
      if (data.date !== undefined) updateData.date = data.date.toISOString();

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating transaction:', error);
        return;
      }
    }

    setTransactions(prev => {
      const updated = prev.map(tx => {
        if (tx.id !== id) return tx;
        return { ...tx, ...data };
      });
      saveToStorage(updated);
      return updated;
    });
  }, [user, saveToStorage]);

  const getRecentTransactions = useCallback((limit: number = 10) => {
    return transactions.slice(0, limit);
  }, [transactions]);

  const getTransactionsByInvestment = useCallback((investmentId: string) => {
    return transactions.filter(tx => tx.investmentId === investmentId);
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getRecentTransactions,
    getTransactionsByInvestment,
  };
}
