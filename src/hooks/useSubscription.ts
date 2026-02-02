import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price: number;
  max_assets: number;
  features: string[];
}

interface Subscription {
  id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  current_period_start: string | null;
  current_period_end: string | null;
  plan: Plan;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: Plan | null;
  isLoading: boolean;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
  maxAssets: number;
  canAddAsset: boolean;
  currentAssetCount: number;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAssetCount, setCurrentAssetCount] = useState(0);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setPlan(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user subscription with plan details
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          plan_id,
          status,
          current_period_start,
          current_period_end,
          plans:plan_id (
            id,
            name,
            display_name,
            price,
            max_assets,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      // Fetch current asset count
      const { count, error: countError } = await supabase
        .from('investments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error fetching asset count:', countError);
      }

      setCurrentAssetCount(count || 0);

      if (subData && subData.plans) {
        const planData = subData.plans as unknown as Plan;
        setSubscription({
          id: subData.id,
          plan_id: subData.plan_id,
          status: subData.status as Subscription['status'],
          current_period_start: subData.current_period_start,
          current_period_end: subData.current_period_end,
          plan: planData,
        });
        setPlan(planData);
      } else {
        // User has no active subscription - default to free plan
        const { data: freePlan } = await supabase
          .from('plans')
          .select('*')
          .eq('name', 'free')
          .single();

        if (freePlan) {
          setPlan({
            id: freePlan.id,
            name: freePlan.name,
            display_name: freePlan.display_name,
            price: Number(freePlan.price),
            max_assets: freePlan.max_assets,
            features: freePlan.features as string[],
          });
        }
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const maxAssets = plan?.max_assets ?? 5;
  const canAddAsset = maxAssets === -1 || currentAssetCount < maxAssets;

  return {
    subscription,
    plan,
    isLoading,
    isPro: plan?.name === 'pro',
    isPremium: plan?.name === 'premium',
    isFree: !subscription || plan?.name === 'free',
    maxAssets,
    canAddAsset,
    currentAssetCount,
    refetch: fetchSubscription,
  };
}
