import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, ChevronDown } from "lucide-react";

const VISIBLE_PRO_FEATURES = 6;

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar a organizar seus investimentos",
    features: ["Até 5 ativos", "Até 2 categorias diferentes", "Gráfico de Evolução de Patrimônio", "Gráfico de Alocação (%) em Cada Ativo", "Visão geral do patrimônio total consolidado", "Histórico de aportes e retiradas", "Preços em tempo real"],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 39,90",
    period: "/mês",
    description: "Para investidores que levam a sério seu patrimônio",
    features: ["Tudo do Free", "Ativos ilimitados", "Categorias ilimitadas", "Relatório mensal da carteira", "Acesso a todas as áreas do App", "Patrimônio em Reais ou Dólares", "Definir metas no App", "Gráfico de projeção de crescimento", "Comparação com outros ativos do mercado", "Gráficos de evolução e rentabilidade", "Observações em cada investimento", "Tags: Curto, Médio e Longo Prazo", "Rendimentos mensais recebidos", "Alocação em % e rebalanceamento", "Relatórios por classe de ativo"],
    cta: "Começar Agora",
    popular: true,
  },
  {
    name: "Premium",
    price: "R$ 79,90",
    period: "/mês",
    description: "Controle total sem fronteiras",
    features: ["Tudo do plano Pro", "Suporte prioritário", "Cadastro dos ativos por nossa equipe (opcional)", "Download em PDF dos investimentos", "Recompensas físicas com desconto"],
    cta: "Ser Premium",
    popular: false,
  },
];

const PricingSection = () => {
  const [proExpanded, setProExpanded] = useState(false);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-background">
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background z-20 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-5" />
      <div className="glow-orb w-[800px] h-[800px] bg-primary/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Preços Transparentes
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Escolha seu <span className="neon-text">Plano</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sem surpresas. Sem taxas escondidas. Escolha o que faz sentido para você.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan) => {
            const isPro = plan.name === "Pro";
            const visibleFeatures = isPro && !proExpanded ? plan.features.slice(0, VISIBLE_PRO_FEATURES) : plan.features;
            const hiddenCount = isPro ? plan.features.length - VISIBLE_PRO_FEATURES : 0;

            return (
              <div key={plan.name} className={`relative group rounded-2xl transition-all duration-500 ${plan.popular ? "md:-translate-y-4 md:scale-105" : "hover:-translate-y-2"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-emerald-400 text-background text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/30">
                      Mais Popular
                    </div>
                  </div>
                )}

                <div className={`relative h-full flex flex-col p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 ${plan.popular ? "bg-gradient-to-b from-primary/15 to-primary/5 border-2 border-primary/50 shadow-2xl shadow-primary/20" : "bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80"}`}>
                  {plan.popular && <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent opacity-50" />}

                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="text-center mb-8">
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{plan.description}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-display text-4xl lg:text-5xl font-bold ${plan.popular ? "neon-text" : "text-foreground"}`}>{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

                    <ul className="space-y-4 mb-4 flex-1">
                      {visibleFeatures.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? "bg-primary/30 text-primary" : "bg-primary/15 text-primary/80"}`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-foreground/90 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isPro && hiddenCount > 0 && (
                      <button onClick={() => setProExpanded(!proExpanded)} className="flex items-center justify-center gap-2 text-primary text-sm font-medium mb-6 hover:underline transition-all">
                        {proExpanded ? "Ver menos" : `Ver mais ${hiddenCount} recursos`}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${proExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}

                    {!isPro && <div className="mb-4" />}

                    <Button variant={plan.popular ? "hero" : "outline"} size="lg" className={`w-full group/btn mt-auto ${!plan.popular && "hover:bg-primary/10 hover:border-primary/50 hover:text-primary"}`} asChild>
                      <a href="/auth?mode=signup">
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
