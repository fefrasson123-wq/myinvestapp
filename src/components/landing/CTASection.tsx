import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section id="cta-section" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="glow-orb w-[800px] h-[800px] bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent top-1/4 left-1/4 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="glow-orb w-[300px] h-[300px] bg-[hsl(170_100%_45%)] bottom-1/4 right-1/4 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Comece gratuitamente hoje</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
            Pare de espalhar seus investimentos.
            <br />
            <span className="text-gradient">Centralize tudo.</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Organize seu patrimônio de forma simples e segura.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <a href="/auth?mode=signup">
                Comece agora
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>

          <p className="text-muted-foreground text-sm mt-16">
            © 2024 My Invest. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
