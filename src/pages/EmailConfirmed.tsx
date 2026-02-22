import { Helmet } from 'react-helmet-async';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function EmailConfirmed() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Email Confirmado - My Invest</title>
        <meta name="description" content="Seu email foi confirmado com sucesso!" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 glow-primary">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-primary text-glow tracking-tight">
                  My Invest
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seus investimentos</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-8 sm:p-10 animate-scale-in">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/20">
                  <CheckCircle className="w-16 h-16 text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-card-foreground mb-3">
                Email Confirmado! 🎉
              </h2>

              <p className="text-muted-foreground mb-8">
                Seu endereço de email foi verificado com sucesso. Agora você pode acessar todas as funcionalidades do My Invest.
              </p>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
                size="lg"
              >
                Acessar Minha Conta
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
