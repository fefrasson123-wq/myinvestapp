import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GoalType = 'value_goal' | 'buy_car' | 'financial_independence' | 'passive_income';

export const goalTypeLabels: Record<GoalType, string> = {
  value_goal: 'Meta de Valor',
  buy_car: 'Comprar Carro',
  financial_independence: 'Independência Financeira',
  passive_income: 'Renda Passiva Mensal',
};

export const goalTypeIcons: Record<GoalType, string> = {
  value_goal: '💰',
  buy_car: '🚗',
  financial_independence: '🏖️',
  passive_income: '📈',
};

export interface PersonalGoal {
  id: string;
  user_id: string;
  name: string;
  goal_type: GoalType;
  target_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export function usePersonalGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<PersonalGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoal = useCallback(async () => {
    if (!user) {
      setGoal(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setGoal({
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          goal_type: (data.goal_type as GoalType) || 'value_goal',
          target_amount: Number(data.target_amount),
          deadline: data.deadline,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        setGoal(null);
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const saveGoal = useCallback(async (data: { 
    name?: string; 
    goal_type?: GoalType;
    target_amount: number; 
    deadline?: string | null 
  }) => {
    if (!user) return null;

    try {
      if (goal) {
        // Update existing goal
        const { data: updated, error } = await supabase
          .from('personal_goals')
          .update({
            name: data.name || goal.name,
            goal_type: data.goal_type || goal.goal_type,
            target_amount: data.target_amount,
            deadline: data.deadline,
          })
          .eq('id', goal.id)
          .select()
          .single();

        if (error) throw error;
        
        const mappedGoal: PersonalGoal = {
          id: updated.id,
          user_id: updated.user_id,
          name: updated.name,
          goal_type: (updated.goal_type as GoalType) || 'value_goal',
          target_amount: Number(updated.target_amount),
          deadline: updated.deadline,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        };
        setGoal(mappedGoal);
        return mappedGoal;
      } else {
        // Create new goal
        const { data: created, error } = await supabase
          .from('personal_goals')
          .insert({
            user_id: user.id,
            name: data.name || 'Meta Principal',
            goal_type: data.goal_type || 'value_goal',
            target_amount: data.target_amount,
            current_amount: 0,
            deadline: data.deadline,
          })
          .select()
          .single();

        if (error) throw error;
        
        const mappedGoal: PersonalGoal = {
          id: created.id,
          user_id: created.user_id,
          name: created.name,
          goal_type: (created.goal_type as GoalType) || 'value_goal',
          target_amount: Number(created.target_amount),
          deadline: created.deadline,
          created_at: created.created_at,
          updated_at: created.updated_at,
        };
        setGoal(mappedGoal);
        return mappedGoal;
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      return null;
    }
  }, [user, goal]);

  const deleteGoal = useCallback(async () => {
    if (!goal) return;

    try {
      const { error } = await supabase
        .from('personal_goals')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;
      setGoal(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }, [goal]);

  return {
    goal,
    isLoading,
    saveGoal,
    deleteGoal,
    refetch: fetchGoal,
  };
}
