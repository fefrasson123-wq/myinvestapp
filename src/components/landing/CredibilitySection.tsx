import { Users, Target, Smartphone } from "lucide-react";

const credentials = [
  { icon: Users, text: "Criado por investidores" },
  { icon: Target, text: "Feito para Organização Financeira" },
  { icon: Smartphone, text: "Pensado para quem já investe em mais de um lugar" },
];

const CredibilitySection = () => {
  return (
    <section className="pt-24 pb-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Feito por quem <span className="text-gradient">entende</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {credentials.map((cred, index) => (
              <div key={index} className="flex items-center gap-4 glass-card p-6 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <cred.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-foreground font-medium">{cred.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CredibilitySection;
