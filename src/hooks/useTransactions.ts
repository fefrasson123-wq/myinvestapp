import { useState, useEffect, useCallback } from 'react';
import { Transaction, InvestmentCategory, TransactionType } from '@/types/investment';

const STORAGE_KEY = 'investments-transactions';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTransactions(parsed.map((tx: Transaction) => ({
          ...tx,
          date: new Date(tx.date),
          createdAt: new Date(tx.createdAt),
        })));
      } catch (e) {
        console.error('Error loading transactions:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveToStorage = useCallback((data: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addTransaction = useCallback((data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
    };

    setTransactions(prev => {
      const updated = [newTransaction, ...prev];
      saveToStorage(updated);
      return updated;
    });

    return newTransaction;
  }, [saveToStorage]);

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
    getRecentTransactions,
    getTransactionsByInvestment,
  };
}
