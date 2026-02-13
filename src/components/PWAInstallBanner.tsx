import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    // iOS: show banner after delay (will redirect to /install)
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setShowBanner(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    // iOS: redirect to install page with visual guide
    if (isIOS) {
      navigate('/install');
      setShowBanner(false);
      return;
    }
    // Android/Desktop: trigger native prompt
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
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-in slide-in-from-right-4 duration-500">
      <div className="relative rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-xl shadow-primary/10 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="p-2 rounded-lg bg-primary/20 shrink-0">
            {isIOS ? <Smartphone className="w-5 h-5 text-primary" /> : <Download className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground">Instale o My Invest</p>
            <p className="text-xs text-muted-foreground">Acesso rápido pela tela inicial</p>
          </div>
          <Button size="sm" onClick={handleInstall} className="shrink-0 text-xs">
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
