import { UserPlus, PlusCircle, Eye } from "lucide-react";

const steps = [
  { icon: UserPlus, step: "01", title: "Crie sua Conta", description: "Cadastre-se em segundos apenas com seu email. Sem cartão de crédito ou dados bancários." },
  { icon: PlusCircle, step: "02", title: "Adicione Investimentos", description: "Insira manualmente seus ativos: cripto, ações, fundos, ETFs e saldos bancários." },
  { icon: Eye, step: "03", title: "Acompanhe e Analise", description: "Visualize seu portfólio completo com gráficos bonitos e análises em tempo real." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="glow-orb w-[600px] h-[600px] bg-accent/20 bottom-0 left-1/2 -translate-x-1/2 animate-pulse-slow" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Como <span className="text-gradient">Funciona</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece em três passos simples. Sua visão completa do portfólio está a poucos minutos de distância.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              <div className="text-center relative z-10">
                <div className="font-display text-6xl font-bold text-primary/20 mb-4">{step.step}</div>
                <div className="w-20 h-20 rounded-2xl bg-primary/20 neon-border flex items-center justify-center mx-auto mb-6 animate-glow">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
