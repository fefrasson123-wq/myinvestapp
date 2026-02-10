import { AlertCircle, Shuffle, HelpCircle } from "lucide-react";

const problems = [
  { icon: Shuffle, text: "Investe em mais de uma corretora" },
  { icon: AlertCircle, text: "Tem vários Investimentos diferentes" },
  { icon: HelpCircle, text: "Nunca sabe exatamente quanto tem de Patrimônio total" },
];

const ProblemSection = () => {
  return (
    <section className="pt-12 pb-8 relative overflow-hidden bg-card/30">
      <div className="absolute inset-0 grid-bg opacity-10" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-12">
            Você se <span className="text-gradient">identifica?</span>
          </h2>
          <div className="space-y-6 mb-12">
            {problems.map((problem, index) => (
              <div key={index} className="flex items-center gap-4 glass-card p-6 rounded-xl border border-destructive/20 hover:border-destructive/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <problem.icon className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-lg md:text-xl text-foreground font-medium text-left">{problem.text}</p>
              </div>
            ))}
          </div>
          <div className="glass-card neon-border p-8 rounded-2xl">
            <p className="text-xl md:text-2xl font-display font-bold text-foreground">
              Isso não é falta de estratégia.
              <br />
              <span className="text-gradient">É falta de organização.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
