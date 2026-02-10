import { Bitcoin, TrendingUp, Building2, DollarSign, PieChart, Landmark } from "lucide-react";

const assets = [
  { icon: Bitcoin, title: "Criptomoedas", description: "Bitcoin, Ethereum e +250 Criptos", color: "from-orange-500 to-yellow-500" },
  { icon: TrendingUp, title: "Ações Brasileiras", description: "Ações listadas na B3: PETR4, VALE3, ITUB4 e mais", color: "from-primary to-accent" },
  { icon: Building2, title: "Fundos Imobiliários", description: "FIIs: MXRF11, HGLG11, XPLG11 e mais", color: "from-blue-500 to-cyan-500" },
  { icon: DollarSign, title: "Ações Americanas", description: "NYSE e NASDAQ - AAPL, MSFT, GOOGL, AMZN", color: "from-green-500 to-emerald-500" },
  { icon: PieChart, title: "ETFs", description: "Fundos de índice de mercados globais", color: "from-purple-500 to-pink-500" },
  { icon: Landmark, title: "Saldos Bancários", description: "Poupança, conta corrente e renda fixa", color: "from-slate-400 to-slate-600" },
];

const AssetsSection = () => {
  return (
    <section id="assets" className="pt-16 pb-32 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-card/30" />
      <div className="absolute inset-0 top-32 bg-card/30" />
      <div className="absolute inset-0 grid-bg opacity-10" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            Acompanhe <span className="text-gradient">Todos os Ativos</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            De criptomoedas a contas bancárias, gerencie todos os seus investimentos em um painel unificado.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {assets.map((asset, index) => (
            <div key={index} className="group relative overflow-hidden">
              <div className="glass-card p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${asset.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-xl`} />
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${asset.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                  <asset.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-sm font-bold mb-1 text-foreground text-center">{asset.title}</h3>
                <p className="text-muted-foreground text-xs text-center leading-tight">{asset.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <h3 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Adicione <span className="text-gradient">Novos Investimentos</span> Facilmente
          </h3>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Escolha entre múltiplas categorias de ativos com nossa interface intuitiva
          </p>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-primary/30 shadow-2xl shadow-primary/20 w-full aspect-video bg-card/50 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Investment Form Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssetsSection;
