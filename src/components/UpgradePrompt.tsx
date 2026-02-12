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
          "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors border border-amber-500/20",
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
      "relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background to-amber-600/5 p-4 sm:p-6",
      className
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col items-center text-center gap-3">
        <div className="p-2.5 rounded-full bg-amber-500/10">
          <Lock className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground mb-1">
            {feature}
          </h3>
          <p className="text-xs text-muted-foreground">
            Disponível nos planos Pro e Premium
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/plans')}
          className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Crown className="w-3.5 h-3.5" />
          Ver Planos
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
