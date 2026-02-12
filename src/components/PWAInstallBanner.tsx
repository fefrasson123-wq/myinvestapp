import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    if (ios) {
      // Show iOS tip after a delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setShowBanner(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSTip(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-xl shadow-primary/10 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {showIOSTip ? (
          <div className="space-y-2 pr-6">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm font-medium text-card-foreground">Como instalar no iPhone/iPad</p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Toque no botão <strong className="text-primary">Compartilhar</strong> (quadrado com seta para cima)</li>
              <li>Role e toque em <strong className="text-primary">"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong className="text-primary">"Adicionar"</strong></li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-3 pr-6">
            <div className="p-2 rounded-lg bg-primary/20 shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">Instale o My Invest</p>
              <p className="text-xs text-muted-foreground">Acesso rápido pela tela inicial</p>
            </div>
            <Button size="sm" onClick={handleInstall} className="shrink-0 text-xs">
              Instalar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
