import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, CheckCircle2, ArrowLeft, Share, Plus, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="p-4 rounded-2xl bg-primary/20 w-fit mx-auto">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">App já instalado!</h1>
          <p className="text-muted-foreground">
            O My Invest já está instalado no seu dispositivo. Aproveite!
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="p-3 rounded-2xl bg-primary/20 w-fit mx-auto glow-primary">
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary text-glow">My Invest</h1>
          <p className="text-muted-foreground text-lg">
            Instale o app para acesso rápido direto da tela inicial
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          {[
            'Acesso rápido pela tela inicial',
            'Experiência em tela cheia',
            'Carregamento mais rápido',
            'Funciona como um app nativo',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="text-card-foreground text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Android/Desktop: one-click install */}
        {deferredPrompt && (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-base" variant="glow">
            <Download className="w-5 h-5" />
            Instalar My Invest
          </Button>
        )}

        {/* iOS: guided instructions */}
        {isIOS && !deferredPrompt && (
          <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Instalar no iPhone/iPad
            </h2>
            <p className="text-sm text-muted-foreground">
              Siga os 3 passos rápidos abaixo:
            </p>
            <div className="space-y-5">
              <IOSStep 
                number={1} 
                icon={<Share className="w-5 h-5 text-primary" />}
                title="Toque em Compartilhar"
                description="Toque no ícone de compartilhar na barra inferior do Safari"
              >
                <div className="mt-2 flex justify-center">
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/30 animate-bounce">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
                      <path d="M12 2L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 6L12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="4" y="10" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                </div>
              </IOSStep>

              <IOSStep 
                number={2} 
                icon={<Plus className="w-5 h-5 text-primary" />}
                title="Adicionar à Tela de Início"
                description='Role para baixo e toque em "Adicionar à Tela de Início"'
              >
                <div className="mt-2 p-3 rounded-lg bg-secondary/30 border border-border/30 flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-secondary">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-card-foreground font-medium">Adicionar à Tela de Início</span>
                </div>
              </IOSStep>

              <IOSStep 
                number={3} 
                icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
                title='Toque em "Adicionar"'
                description="Confirme tocando em Adicionar no canto superior direito"
              />
            </div>
          </div>
        )}

        {/* Non-iOS without prompt: generic guidance */}
        {!isIOS && !deferredPrompt && (
          <div className="text-center p-5 rounded-xl bg-card border border-border/50 space-y-3">
            <Download className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Abra este site no <strong className="text-card-foreground">Google Chrome</strong> para instalar o app com um clique.
            </p>
          </div>
        )}

        {/* Back button */}
        <div className="text-center pt-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </Button>
        </div>
      </div>
    </div>
  );
}

function IOSStep({ 
  number, 
  icon, 
  title, 
  description, 
  children 
}: { 
  number: number; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
          {number}
        </div>
        {number < 3 && <div className="w-px flex-1 bg-border/50" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
}
