import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PriceUpdateIndicatorProps {
  lastUpdate: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
}

function formatLastUpdate(date: Date | null): string {
  if (!date) return 'Nunca';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  if (diffSeconds < 60) {
    return `${diffSeconds}s atrás`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}min atrás`;
  } else {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}

export function PriceUpdateIndicator({ lastUpdate, isLoading, onRefresh }: PriceUpdateIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Última atualização:</span>
        <span className="font-mono text-card-foreground">
          {formatLastUpdate(lastUpdate)}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="ml-auto gap-2"
      >
        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        {isLoading ? 'Atualizando...' : 'Atualizar'}
      </Button>
    </div>
  );
}
