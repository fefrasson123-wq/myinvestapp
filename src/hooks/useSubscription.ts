import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price: number;
  max_assets: number;
  max_categories: number;
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

// Features gated by Pro+ plans
export type ProFeature = 
  | 'unlimited_assets'
  | 'unlimited_categories'
  | 'currency_switch'
  | 'benchmark_comparison'
  | 'evolution_charts'
  | 'passive_income'
  | 'investment_notes'
  | 'tags'
  | 'portfolio_allocation'
  | 'performance_charts'
  | 'category_profit_loss';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: Plan | null;
  isLoading: boolean;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
  maxAssets: number;
  maxCategories: number;
  canAddAsset: boolean;
  canAddCategory: (currentCategoryCount: number) => boolean;
  hasFeature: (feature: ProFeature) => boolean;
  currentAssetCount: number;
  refetch: () => Promise<void>;
}

const PRO_FEATURES: ProFeature[] = [
  'unlimited_assets',
  'unlimited_categories',
  'currency_switch',
  'benchmark_comparison',
  'evolution_charts',
  'passive_income',
  'investment_notes',
  'tags',
  'portfolio_allocation',
  'performance_charts',
  'category_profit_loss',
];

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
            max_categories,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      const { count, error: countError } = await supabase
        .from('investments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error fetching asset count:', countError);
      }

      setCurrentAssetCount(count || 0);

      if (subData && subData.plans) {
        const rawPlan = subData.plans as unknown as Record<string, any>;
        const planData: Plan = {
          id: rawPlan.id,
          name: rawPlan.name,
          display_name: rawPlan.display_name,
          price: Number(rawPlan.price),
          max_assets: rawPlan.max_assets,
          max_categories: rawPlan.max_categories ?? -1,
          features: rawPlan.features as string[],
        };
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
            max_categories: (freePlan as any).max_categories ?? 2,
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

  const isPro = plan?.name === 'pro' || plan?.name === 'premium';
  const isPremium = plan?.name === 'premium';
  const isFree = !subscription || plan?.name === 'free';

  const maxAssets = plan?.max_assets ?? 5;
  const maxCategories = plan?.max_categories ?? 2;
  const canAddAsset = maxAssets === -1 || currentAssetCount < maxAssets;

  const canAddCategory = (currentCategoryCount: number) => {
    return maxCategories === -1 || currentCategoryCount < maxCategories;
  };

  const hasFeature = (feature: ProFeature): boolean => {
    if (isPro || isPremium) return true;
    // Free plan only gets: basic stats, goals, limited assets/categories
    return false;
  };

  return {
    subscription,
    plan,
    isLoading,
    isPro,
    isPremium,
    isFree,
    maxAssets,
    maxCategories,
    canAddAsset,
    canAddCategory,
    hasFeature,
    currentAssetCount,
    refetch: fetchSubscription,
  };
}
