import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvestmentCategory, categoryLabels } from '@/types/investment';
import { toast } from 'sonner';

export interface PortfolioAllocation {
  id: string;
  user_id: string;
  category: InvestmentCategory;
  target_percent: number;
  created_at: string;
  updated_at: string;
}

export interface AllocationWithDeviation extends PortfolioAllocation {
  currentPercent: number;
  deviation: number;
  currentValue: number;
  amountToRebalance: number;
}

export function usePortfolioAllocations(investments?: Array<{ category: InvestmentCategory; currentValue: number }>) {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<PortfolioAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllocations = useCallback(async () => {
    if (!user) {
      setAllocations([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_allocations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setAllocations((data || []) as PortfolioAllocation[]);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const saveAllocation = async (category: InvestmentCategory, targetPercent: number) => {
    if (!user) return false;

    try {
      const existing = allocations.find(a => a.category === category);

      if (existing) {
        const { error } = await supabase
          .from('portfolio_allocations')
          .update({ target_percent: targetPercent })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_allocations')
          .insert({
            user_id: user.id,
            category,
            target_percent: targetPercent
          });

        if (error) throw error;
      }

      await fetchAllocations();
      return true;
    } catch (error) {
      console.error('Error saving allocation:', error);
      toast.error('Erro ao salvar alocação');
      return false;
    }
  };

  const saveAllAllocations = async (allocationMap: Record<InvestmentCategory, number>) => {
    if (!user) return false;

    try {
      // Prepare upsert data
      const upsertData = Object.entries(allocationMap)
        .filter(([_, percent]) => percent > 0)
        .map(([category, percent]) => ({
          user_id: user.id,
          category,
          target_percent: percent
        }));

      // Delete categories with 0%
      const zeroCategories = Object.entries(allocationMap)
        .filter(([_, percent]) => percent === 0)
        .map(([category]) => category);

      if (zeroCategories.length > 0) {
        await supabase
          .from('portfolio_allocations')
          .delete()
          .eq('user_id', user.id)
          .in('category', zeroCategories);
      }

      // Upsert non-zero allocations
      if (upsertData.length > 0) {
        const { error } = await supabase
          .from('portfolio_allocations')
          .upsert(upsertData, { onConflict: 'user_id,category' });

        if (error) throw error;
      }

      await fetchAllocations();
      toast.success('Alocações salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('Error saving allocations:', error);
      toast.error('Erro ao salvar alocações');
      return false;
    }
  };

  const deleteAllocation = async (category: InvestmentCategory) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('portfolio_allocations')
        .delete()
        .eq('user_id', user.id)
        .eq('category', category);

      if (error) throw error;

      await fetchAllocations();
      return true;
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast.error('Erro ao remover alocação');
      return false;
    }
  };

  // Calculate deviations and rebalancing amounts
  const getAllocationsWithDeviation = useCallback((): AllocationWithDeviation[] => {
    if (!investments || investments.length === 0 || allocations.length === 0) {
      return [];
    }

    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    if (totalValue <= 0) return [];

    // Calculate current allocation per category
    const currentByCategory = investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<InvestmentCategory, number>);

    // Start with categories that have explicit targets
    const result: AllocationWithDeviation[] = allocations.map(allocation => {
      const currentValue = currentByCategory[allocation.category] || 0;
      const currentPercent = (currentValue / totalValue) * 100;
      const deviation = currentPercent - allocation.target_percent;
      const targetValue = (allocation.target_percent / 100) * totalValue;
      const amountToRebalance = targetValue - currentValue;

      return {
        ...allocation,
        currentPercent,
        deviation,
        currentValue,
        amountToRebalance
      };
    });

    // Add categories that have investments but NO allocation target (implicit 0% target)
    const allocatedCategories = new Set(allocations.map(a => a.category));
    Object.entries(currentByCategory).forEach(([category, currentValue]) => {
      if (!allocatedCategories.has(category as InvestmentCategory) && currentValue > 0) {
        const currentPercent = (currentValue / totalValue) * 100;
        result.push({
          id: `implicit-${category}`,
          user_id: '',
          category: category as InvestmentCategory,
          target_percent: 0,
          created_at: '',
          updated_at: '',
          currentPercent,
          deviation: currentPercent,
          currentValue,
          amountToRebalance: -currentValue
        });
      }
    });

    // Ajuste de fechamento: garantir que ∑compras = ∑vendas
    const totalBuys = result.filter(r => r.amountToRebalance > 0).reduce((s, r) => s + r.amountToRebalance, 0);
    const totalSells = result.filter(r => r.amountToRebalance < 0).reduce((s, r) => s + Math.abs(r.amountToRebalance), 0);
    const diff = totalBuys - totalSells;

    if (Math.abs(diff) > 0.01) {
      // Ajustar na maior posição compradora para fechar a conta
      const largestBuy = result
        .filter(r => r.amountToRebalance > 0)
        .sort((a, b) => b.amountToRebalance - a.amountToRebalance)[0];

      if (largestBuy) {
        largestBuy.amountToRebalance -= diff;
      }
    }

    return result;
  }, [allocations, investments]);

  // Get summary for rebalancing
  const getRebalancingSummary = useCallback(() => {
    const allocationsWithDeviation = getAllocationsWithDeviation();
    
    const totalToInvest = allocationsWithDeviation
      .filter(a => a.amountToRebalance > 0)
      .reduce((sum, a) => sum + a.amountToRebalance, 0);

    const underweightCategories = allocationsWithDeviation
      .filter(a => a.deviation < -1) // More than 1% below target
      .sort((a, b) => a.deviation - b.deviation);

    const overweightCategories = allocationsWithDeviation
      .filter(a => a.deviation > 1) // More than 1% above target
      .sort((a, b) => b.deviation - a.deviation);

    const totalTargetPercent = allocations.reduce((sum, a) => sum + a.target_percent, 0);

    return {
      allocationsWithDeviation,
      totalToInvest,
      underweightCategories,
      overweightCategories,
      totalTargetPercent,
      isValid: Math.abs(totalTargetPercent - 100) < 0.01
    };
  }, [getAllocationsWithDeviation, allocations]);

  return {
    allocations,
    isLoading,
    saveAllocation,
    saveAllAllocations,
    deleteAllocation,
    getAllocationsWithDeviation,
    getRebalancingSummary,
    refetch: fetchAllocations
  };
}
