import { useEffect, useState } from 'react';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface PlanData {
  id: string;
  name: string;
  display_name: string;
  price: number;
  max_assets: number;
  max_categories: number;
  features: string[];
}

export function PlansContent() {
  const { plan: currentPlan, isFree, isLoading: subLoading } = useSubscription();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      
      if (data && !error) {
        setPlans(data.map(p => ({
          id: p.id,
          name: p.name,
          display_name: p.display_name,
          price: Number(p.price),
          max_assets: p.max_assets,
          max_categories: (p as any).max_categories ?? -1,
          features: (p.features as string[]) || [],
        })));
      }
      setIsLoading(false);
    }
    fetchPlans();
  }, []);

  const planIcons: Record<string, typeof Star> = {
    free: Zap,
    pro: Star,
    premium: Crown,
  };

  const planColors: Record<string, string> = {
    free: 'from-muted/50 to-muted/30 border-border',
    pro: 'from-primary/10 to-primary/5 border-primary/30',
    premium: 'from-amber-500/10 to-amber-600/5 border-amber-500/30',
  };

  const planButtonColors: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    premium: 'bg-amber-500 hover:bg-amber-600 text-white',
  };

  const normalizeFeatureText = (text: string): string => {
    return text
      .replace('Visualização em Real ou Dólar', 'Visualização do patrimonio em Reais ou Dólares')
      .replace('Comparação com benchmarks', 'Comparação com outros ativos do mercado')
      .replace('Gráficos de evolução e rentabilidade', 'Gráficos de evolução do patrimônio')
      .replace('Renda passiva e rendimentos', 'Renda Passiva e Rendimentos mensais recebidos')
      .replace('Observações nos investimentos', 'Observações em cada investimento')
      .replace('Tags de classificação', 'Tags de Classificação de Curto, Médio e Longo Prazo')
      .replace('Alocação e rebalanceamento', 'Alocação Percentual da carteira e quanto investir para rebalancear');
  };

  // Adicionar features extras por plano
  const getExtraFeatures = (planName: string): string[] => {
    if (planName === 'pro') return [
      'Calculadora de Rebalanceamento da carteira',
      'Rentabilidade por Classe de Investimento e alocação percentual',
      'Relatórios por categoria de Investimento',
      'Relatório mensal da sua carteira de Investimentos',
      'Gráfico de projeção de crescimento do Patrimônio',
      'Acesso a todas as aréas do App',
    ];
    return [];
  };

  if (isLoading || subLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-primary animate-pulse">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-2">
          Gerencie seus investimentos como um profissional
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Comece gratuitamente e faça upgrade quando precisar de mais recursos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 flex-1">
        {plans.map((plan) => {
          const Icon = planIcons[plan.name] || Star;
          const isCurrentPlan = currentPlan?.name === plan.name || (isFree && plan.name === 'free');
          const isPopular = plan.name === 'pro';

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border bg-gradient-to-br p-5 sm:p-6 transition-all duration-300 flex flex-col",
                planColors[plan.name] || planColors.free,
                isPopular && "ring-2 ring-primary/50 scale-[1.02] shadow-lg shadow-primary/10",
                isCurrentPlan && "ring-2 ring-success/50"
              )}
            >
              {isPopular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                  Mais Popular
                </Badge>
              )}

              {isCurrentPlan && (
                <Badge className="absolute -top-2.5 right-4 bg-success text-white text-xs">
                  Plano Atual
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  plan.name === 'premium' ? 'bg-amber-500/20' : 'bg-primary/20'
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    plan.name === 'premium' ? 'text-amber-500' : 'text-primary'
                  )} />
                </div>
                <h3 className="text-lg font-bold text-card-foreground">{plan.display_name}</h3>
              </div>

              <div className="mb-6">
                {plan.price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-card-foreground">Grátis</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-3xl font-bold text-card-foreground">{plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {[...plan.features, ...getExtraFeatures(plan.name)].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      plan.name === 'premium' ? 'text-amber-500' : 'text-success'
                    )} />
                    <span className="text-card-foreground">{normalizeFeatureText(feature)}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <Button disabled className="w-full" variant="outline">
                  Plano Atual
                </Button>
              ) : plan.name === 'free' ? (
                <Button disabled className="w-full" variant="outline">
                  Gratuito
                </Button>
              ) : (
                <Button
                  className={cn("w-full", planButtonColors[plan.name])}
                  onClick={() => {
                    window.open('https://myinvestapp.com.br', '_blank');
                  }}
                >
                  Assinar {plan.display_name}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Pagamento seguro processado por plataforma externa.</p>
        <p className="mt-1">O acesso é liberado automaticamente após a confirmação do pagamento.</p>
      </div>
    </div>
  );
}
