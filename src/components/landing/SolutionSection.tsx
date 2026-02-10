import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const solutions = [
  "Centralize todos os seus investimentos",
  "Preços atualizados automaticamente",
  "Veja sua rentabilidade real",
  "Use sem acessar sua Corretora",
  "Cálculo automático de ganhos e perdas",
];

const SolutionSection = () => {
  return (
    <section id="solution" className="pt-8 pb-24 relative overflow-hidden scroll-mt-24">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="glow-orb w-[500px] h-[500px] bg-primary/30 top-1/2 -left-48 animate-pulse-slow" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            O <span className="text-gradient">My Invest</span> resolve isso
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Uma solução simples para centralizar e acompanhar todo o seu patrimônio.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {solutions.map((solution, index) => (
              <div key={index} className="flex items-center gap-4 glass-card p-6 rounded-xl neon-border hover:neon-border-intense transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg text-foreground font-medium text-left">{solution}</p>
              </div>
            ))}
          </div>
          <Button asChild size="lg" className="neon-border hover:neon-border-intense bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold">
            <a href="/auth?mode=signup">COMEÇAR AGORA</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
