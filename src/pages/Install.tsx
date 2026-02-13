import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, CheckCircle2, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

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

        {/* Install Button */}
        {deferredPrompt && (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-base" variant="glow">
            <Download className="w-5 h-5" />
            Instalar My Invest
          </Button>
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
