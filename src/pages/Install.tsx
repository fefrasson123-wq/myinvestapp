import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, Share, Plus, ArrowLeft, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );

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
            Instale o app para acesso rápido direto da tela inicial do seu dispositivo
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

        {/* Install CTA for Chrome/Android */}
        {deferredPrompt && (
          <div className="space-y-3">
            <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-base" variant="glow">
              <Download className="w-5 h-5" />
              Instalar My Invest
            </Button>
          </div>
        )}

        {/* iOS Instructions */}
        {isIOS && !deferredPrompt && (
          <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Como instalar no iPhone/iPad
            </h2>
            <div className="space-y-4">
              <Step number={1} icon={<Share className="w-5 h-5" />}>
                Toque no botão <strong className="text-primary">Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari
              </Step>
              <Step number={2} icon={<Plus className="w-5 h-5" />}>
                Role para baixo e toque em <strong className="text-primary">"Adicionar à Tela de Início"</strong>
              </Step>
              <Step number={3} icon={<Download className="w-5 h-5" />}>
                Toque em <strong className="text-primary">"Adicionar"</strong> no canto superior direito
              </Step>
            </div>
          </div>
        )}

        {/* Android Instructions (fallback when no prompt) */}
        {isAndroid && !deferredPrompt && (
          <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Como instalar no Android
            </h2>
            <div className="space-y-4">
              <Step number={1} icon={<Monitor className="w-5 h-5" />}>
                Toque no menu <strong className="text-primary">⋮</strong> (três pontos) no canto superior direito do Chrome
              </Step>
              <Step number={2} icon={<Download className="w-5 h-5" />}>
                Toque em <strong className="text-primary">"Instalar aplicativo"</strong> ou <strong className="text-primary">"Adicionar à tela inicial"</strong>
              </Step>
              <Step number={3} icon={<CheckCircle2 className="w-5 h-5" />}>
                Confirme tocando em <strong className="text-primary">"Instalar"</strong>
              </Step>
            </div>
          </div>
        )}

        {/* Desktop fallback */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              Como instalar no computador
            </h2>
            <div className="space-y-4">
              <Step number={1} icon={<Monitor className="w-5 h-5" />}>
                No Chrome, clique no ícone de <strong className="text-primary">instalação</strong> na barra de endereço (ícone de monitor com seta)
              </Step>
              <Step number={2} icon={<Download className="w-5 h-5" />}>
                Clique em <strong className="text-primary">"Instalar"</strong> no popup
              </Step>
            </div>
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

function Step({ number, icon, children }: { number: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm shrink-0">
        {number}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed pt-1">{children}</div>
    </div>
  );
}
