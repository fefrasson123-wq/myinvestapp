import { Lock, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature: string;
  className?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, className, compact = false }: UpgradePromptProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate('/plans')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20",
          className
        )}
      >
        <Crown className="w-3 h-3" />
        Pro
      </button>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background/95 to-accent/5 px-4 py-3",
      className
    )}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-center justify-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            {feature}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Disponível nos planos Pro e Premium
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/plans')}
          className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground ml-2"
        >
          <Crown className="w-3.5 h-3.5" />
          Ver Planos
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
