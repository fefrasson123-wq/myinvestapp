import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type IncomeType = 'dividend' | 'rent' | 'interest';

export interface IncomePayment {
  id: string;
  userId: string;
  investmentId: string | null;
  investmentName: string;
  category: string;
  type: IncomeType;
  amount: number;
  paymentDate: Date;
  exDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeStats {
  totalReceived: number;
  monthlyAverage: number;
  yearlyProjection: number;
  byType: Record<IncomeType, number>;
  last12Months: { month: string; amount: number }[];
}

export const incomeTypeLabels: Record<IncomeType, string> = {
  dividend: 'Dividendos',
  rent: 'Aluguéis',
  interest: 'Juros',
};

export function useIncomePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<IncomePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<IncomeStats>({
    totalReceived: 0,
    monthlyAverage: 0,
    yearlyProjection: 0,
    byType: { dividend: 0, rent: 0, interest: 0 },
    last12Months: [],
  });

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('income_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching income payments:', error);
        return;
      }

      const mappedPayments: IncomePayment[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        investmentId: p.investment_id,
        investmentName: p.investment_name,
        category: p.category,
        type: p.type as IncomeType,
        amount: Number(p.amount),
        paymentDate: new Date(p.payment_date),
        exDate: p.ex_date ? new Date(p.ex_date) : undefined,
        notes: p.notes,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));

      setPayments(mappedPayments);
      calculateStats(mappedPayments);
    } catch (err) {
      console.error('Error in fetchPayments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const calculateStats = (payments: IncomePayment[]) => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Filter last 12 months
    const last12MonthsPayments = payments.filter(p => p.paymentDate >= oneYearAgo);

    // Total received (last 12 months)
    const totalReceived = last12MonthsPayments.reduce((sum, p) => sum + p.amount, 0);

    // Monthly average
    const monthlyAverage = totalReceived / 12;

    // Yearly projection based on last 12 months
    const yearlyProjection = totalReceived;

    // By type
    const byType: Record<IncomeType, number> = { dividend: 0, rent: 0, interest: 0 };
    last12MonthsPayments.forEach(p => {
      byType[p.type] += p.amount;
    });

    // Last 12 months grouped by month
    const monthlyData: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    last12MonthsPayments.forEach(p => {
      const monthKey = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += p.amount;
      }
    });

    const last12Months = Object.entries(monthlyData).map(([month, amount]) => {
      const [year, m] = month.split('-');
      const date = new Date(parseInt(year), parseInt(m) - 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { month: monthName, amount };
    });

    setStats({
      totalReceived,
      monthlyAverage,
      yearlyProjection,
      byType,
      last12Months,
    });
  };

  const addPayment = async (payment: Omit<IncomePayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('income_payments')
        .insert({
          user_id: user.id,
          investment_id: payment.investmentId,
          investment_name: payment.investmentName,
          category: payment.category,
          type: payment.type,
          amount: payment.amount,
          payment_date: payment.paymentDate.toISOString().split('T')[0],
          ex_date: payment.exDate?.toISOString().split('T')[0],
          notes: payment.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPayments();
      return { data, error: null };
    } catch (err) {
      console.error('Error adding payment:', err);
      return { data: null, error: err as Error };
    }
  };

  const updatePayment = async (id: string, payment: Partial<IncomePayment>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const updateData: any = {};
      if (payment.investmentName) updateData.investment_name = payment.investmentName;
      if (payment.category) updateData.category = payment.category;
      if (payment.type) updateData.type = payment.type;
      if (payment.amount !== undefined) updateData.amount = payment.amount;
      if (payment.paymentDate) updateData.payment_date = payment.paymentDate.toISOString().split('T')[0];
      if (payment.exDate) updateData.ex_date = payment.exDate.toISOString().split('T')[0];
      if (payment.notes !== undefined) updateData.notes = payment.notes;

      const { error } = await supabase
        .from('income_payments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchPayments();
      return { error: null };
    } catch (err) {
      console.error('Error updating payment:', err);
      return { error: err as Error };
    }
  };

  const deletePayment = async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('income_payments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchPayments();
      return { error: null };
    } catch (err) {
      console.error('Error deleting payment:', err);
      return { error: err as Error };
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    isLoading,
    stats,
    addPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments,
  };
}
