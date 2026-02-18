import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, CheckCircle2, ArrowLeft, Share, Plus, Smartphone, Monitor, MoreVertical, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type BrowserType = 'chrome' | 'edge' | 'firefox' | 'safari' | 'samsung' | 'opera' | 'other';
type DeviceType = 'ios' | 'android' | 'desktop';

function detectBrowser(): BrowserType {
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/OPR|Opera/i.test(ua)) return 'opera';
  if (/Edg/i.test(ua)) return 'edge';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/CriOS|Chrome/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua)) return 'safari';
  return 'other';
}

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const browser = useMemo(() => detectBrowser(), []);
  const device = useMemo(() => detectDevice(), []);

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

        {/* Native install prompt available */}
        {deferredPrompt && (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-base" variant="glow">
            <Download className="w-5 h-5" />
            Instalar My Invest
          </Button>
        )}

        {/* Browser-specific manual instructions when no native prompt */}
        {!deferredPrompt && (
          <BrowserInstructions browser={browser} device={device} />
        )}

        {/* Back button */}
        <div className="text-center pt-4">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar à Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
}

function BrowserInstructions({ browser, device }: { browser: BrowserType; device: DeviceType }) {
  // iOS Safari
  if (device === 'ios' && (browser === 'safari' || browser === 'other')) {
    return (
      <InstructionCard
        icon={<Smartphone className="w-5 h-5 text-primary" />}
        title="Instalar no iPhone/iPad (Safari)"
      >
        <InstallStep number={1} title="Toque em Compartilhar" description="Toque no ícone de compartilhar na barra inferior do Safari">
          <div className="mt-2 flex justify-center">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/30 animate-pulse">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 2L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 6L12 2L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="4" y="10" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        </InstallStep>
        <InstallStep number={2} title='Toque em "Adicionar à Tela de Início"' description="Role para baixo na lista de opções">
          <div className="mt-2 p-3 rounded-lg bg-secondary/30 border border-border/30 flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-secondary">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-card-foreground font-medium">Adicionar à Tela de Início</span>
          </div>
        </InstallStep>
        <InstallStep number={3} title='Toque em "Adicionar"' description="Confirme no canto superior direito" isLast />
      </InstructionCard>
    );
  }

  // iOS Chrome
  if (device === 'ios' && browser === 'chrome') {
    return (
      <InstructionCard
        icon={<Smartphone className="w-5 h-5 text-primary" />}
        title="Instalar no iPhone/iPad (Chrome)"
      >
        <InstallStep number={1} title="Toque em Compartilhar" description='Toque no ícone de compartilhar (quadrado com seta para cima) na barra de endereço' />
        <InstallStep number={2} title='Toque em "Adicionar à Tela de Início"' description="Role para baixo e toque na opção" />
        <InstallStep number={3} title='Confirme tocando em "Adicionar"' description="O app será adicionado à sua tela inicial" isLast />
      </InstructionCard>
    );
  }

  // iOS Firefox
  if (device === 'ios' && browser === 'firefox') {
    return (
      <InstructionCard
        icon={<Smartphone className="w-5 h-5 text-primary" />}
        title="Instalar no iPhone/iPad (Firefox)"
        note="Para a melhor experiência, abra este site no Safari e toque em Compartilhar → Adicionar à Tela de Início."
      >
        <InstallStep number={1} title="Abra no Safari" description="Copie o link e abra no Safari para adicionar à tela inicial" />
        <InstallStep number={2} title="Toque em Compartilhar" description="Na barra inferior do Safari" />
        <InstallStep number={3} title='Toque em "Adicionar à Tela de Início"' description="E confirme tocando em Adicionar" isLast />
      </InstructionCard>
    );
  }

  // Android Firefox
  if (device === 'android' && browser === 'firefox') {
    return (
      <InstructionCard
        icon={<Smartphone className="w-5 h-5 text-primary" />}
        title="Instalar no Android (Firefox)"
      >
        <InstallStep number={1} title="Toque no menu ⋮" description="Toque nos 3 pontos no canto superior direito">
          <div className="mt-2 flex justify-center">
            <div className="p-2 rounded-lg bg-secondary/50 border border-border/30">
              <MoreVertical className="w-6 h-6 text-primary" />
            </div>
          </div>
        </InstallStep>
        <InstallStep number={2} title='Toque em "Instalar"' description='Ou "Adicionar à tela inicial"' />
        <InstallStep number={3} title="Confirme a instalação" description="Toque em Instalar no popup de confirmação" isLast />
      </InstructionCard>
    );
  }

  // Android Chrome / Samsung / Opera (fallback when prompt didn't fire)
  if (device === 'android') {
    const browserName = browser === 'samsung' ? 'Samsung Internet' : browser === 'opera' ? 'Opera' : 'Chrome';
    return (
      <InstructionCard
        icon={<Smartphone className="w-5 h-5 text-primary" />}
        title={`Instalar no Android (${browserName})`}
      >
        <InstallStep number={1} title="Toque no menu ⋮" description={`Toque nos 3 pontos no canto superior direito do ${browserName}`}>
          <div className="mt-2 flex justify-center">
            <div className="p-2 rounded-lg bg-secondary/50 border border-border/30">
              <MoreVertical className="w-6 h-6 text-primary" />
            </div>
          </div>
        </InstallStep>
        <InstallStep number={2} title='Toque em "Instalar aplicativo"' description='Ou "Adicionar à tela inicial"' />
        <InstallStep number={3} title="Confirme a instalação" description='Toque em "Instalar"' isLast />
      </InstructionCard>
    );
  }

  // Desktop Edge
  if (browser === 'edge') {
    return (
      <InstructionCard
        icon={<Monitor className="w-5 h-5 text-primary" />}
        title="Instalar no Desktop (Edge)"
      >
        <InstallStep number={1} title="Clique no ícone de instalação" description="Na barra de endereço, clique no ícone de app (quadrado com seta)" />
        <InstallStep number={2} title='Clique em "Instalar"' description="Confirme no popup do navegador" isLast />
      </InstructionCard>
    );
  }

  // Desktop Firefox
  if (browser === 'firefox') {
    return (
      <InstructionCard
        icon={<Monitor className="w-5 h-5 text-primary" />}
        title="Instalar no Desktop (Firefox)"
        note="O Firefox Desktop não suporta instalação de PWA nativamente. Use o Google Chrome ou Microsoft Edge para instalar o app."
      >
        <InstallStep number={1} title="Abra no Chrome ou Edge" description="Copie o link e abra em um navegador compatível" />
        <InstallStep number={2} title="Clique no ícone de instalação" description="Na barra de endereço do Chrome/Edge" isLast />
      </InstructionCard>
    );
  }

  // Desktop Safari
  if (browser === 'safari') {
    return (
      <InstructionCard
        icon={<Monitor className="w-5 h-5 text-primary" />}
        title="Instalar no macOS (Safari)"
      >
        <InstallStep number={1} title="Clique em Arquivo" description="Na barra de menu do Safari" />
        <InstallStep number={2} title='Clique em "Adicionar ao Dock"' description="O app será adicionado ao seu Dock como um aplicativo" isLast />
      </InstructionCard>
    );
  }

  // Desktop Chrome / Opera / Other
  return (
    <InstructionCard
      icon={<Monitor className="w-5 h-5 text-primary" />}
      title="Instalar no Desktop (Chrome)"
    >
      <InstallStep number={1} title="Clique no ícone de instalação" description="Na barra de endereço, clique no ícone de monitor com seta para baixo">
        <div className="mt-2 flex justify-center">
          <div className="p-2 rounded-lg bg-secondary/50 border border-border/30">
            <Download className="w-6 h-6 text-primary" />
          </div>
        </div>
      </InstallStep>
      <InstallStep number={2} title='Clique em "Instalar"' description="Confirme no popup" isLast />
    </InstructionCard>
  );
}

function InstructionCard({ icon, title, note, children }: { icon: React.ReactNode; title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
      <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {note && (
        <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/30">
          💡 {note}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function InstallStep({ 
  number, 
  title, 
  description, 
  isLast = false,
  children 
}: { 
  number: number; 
  title: string; 
  description: string; 
  isLast?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
          {number}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border/50" />}
      </div>
      <div className="flex-1 pb-4">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {children}
      </div>
    </div>
  );
}
