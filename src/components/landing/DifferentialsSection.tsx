import { Lock, FileText, LayoutGrid, PieChart } from "lucide-react";

const differentials = [
  { icon: Lock, title: "Não conecta conta bancária", description: "Seus dados bancários ficam seguros com você" },
  { icon: FileText, title: "Relatórios claros e detalhados", description: "Acompanhe sua evolução com gráficos e análises" },
  { icon: LayoutGrid, title: "Todos os tipos de investimento", description: "Em um único painel consolidado" },
  { icon: PieChart, title: "Visão patrimonial completa", description: "Todo seu patrimônio em um só lugar" },
];

const DifferentialsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-card/30">
      <div className="absolute inset-0 grid-bg opacity-10" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent/20 bottom-0 right-0 animate-pulse-slow" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Por que o My Invest é <span className="text-gradient">diferente?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Segurança e privacidade em primeiro lugar</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {differentials.map((diff, index) => (
            <div key={index} className="glass-card p-8 rounded-2xl border border-border/50 hover:neon-border transition-all duration-500 text-center group">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/30 transition-colors">
                <diff.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2 text-foreground">{diff.title}</h3>
              <p className="text-muted-foreground text-sm">{diff.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DifferentialsSection;
