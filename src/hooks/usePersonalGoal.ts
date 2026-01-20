import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PersonalGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
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
      setGoal(data);
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
            target_amount: data.target_amount,
            deadline: data.deadline,
          })
          .eq('id', goal.id)
          .select()
          .single();

        if (error) throw error;
        setGoal(updated);
        return updated;
      } else {
        // Create new goal
        const { data: created, error } = await supabase
          .from('personal_goals')
          .insert({
            user_id: user.id,
            name: data.name || 'Meta Principal',
            target_amount: data.target_amount,
            current_amount: 0,
            deadline: data.deadline,
          })
          .select()
          .single();

        if (error) throw error;
        setGoal(created);
        return created;
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      return null;
    }
  }, [user, goal]);

  const updateCurrentAmount = useCallback(async (amount: number) => {
    if (!goal) return;

    try {
      const { data: updated, error } = await supabase
        .from('personal_goals')
        .update({ current_amount: amount })
        .eq('id', goal.id)
        .select()
        .single();

      if (error) throw error;
      setGoal(updated);
    } catch (error) {
      console.error('Error updating current amount:', error);
    }
  }, [goal]);

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
    updateCurrentAmount,
    deleteGoal,
    refetch: fetchGoal,
  };
}
