import { RefreshCw, Clock, Wifi } from 'lucide-react';
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

function getStatusColor(lastUpdate: Date | null, isLoading: boolean): { dot: string; icon: string } {
  if (isLoading) {
    return { dot: "bg-yellow-400 animate-pulse", icon: "text-yellow-400" };
  }
  
  if (!lastUpdate) {
    return { dot: "bg-destructive", icon: "text-destructive" };
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  // Verde: até 60 segundos
  if (diffSeconds <= 60) {
    return { dot: "bg-success shadow-[0_0_8px_hsl(var(--success)/0.6)]", icon: "text-success" };
  }
  
  // Amarelo: após 10 minutos (600 segundos)
  if (diffSeconds >= 600 && diffSeconds < 3600) {
    return { dot: "bg-yellow-400", icon: "text-yellow-400" };
  }
  
  // Vermelho: após 1 hora (3600 segundos)
  if (diffSeconds >= 3600) {
    return { dot: "bg-destructive", icon: "text-destructive" };
  }
  
  // Entre 60s e 10min: verde
  return { dot: "bg-success shadow-[0_0_8px_hsl(var(--success)/0.6)]", icon: "text-success" };
}

export function PriceUpdateIndicator({ lastUpdate, isLoading, onRefresh }: PriceUpdateIndicatorProps) {
  const statusColor = getStatusColor(lastUpdate, isLoading);
  
  return (
    <div className="flex items-center gap-4 px-5 py-3 rounded-xl bg-gradient-to-r from-secondary/50 to-secondary/30 border border-border/50 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          statusColor.dot
        )} />
        <Wifi className={cn(
          "w-4 h-4 transition-all duration-300",
          statusColor.icon
        )} />
      </div>
      
      {/* Last update info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Última atualização:</span>
        <span className={cn(
          "font-mono text-card-foreground transition-all duration-300",
          isLoading && "opacity-50"
        )}>
          {formatLastUpdate(lastUpdate)}
        </span>
      </div>
      
      {/* Refresh button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label={isLoading ? 'Atualizando preços' : 'Atualizar preços'}
        className={cn(
          "ml-auto gap-2 transition-all duration-300",
          "hover:bg-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/10",
          "active:scale-95"
        )}
      >
        <RefreshCw className={cn(
          "w-4 h-4 transition-transform duration-500",
          isLoading && "animate-spin"
        )} />
        <span className="hidden sm:inline">
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </span>
      </Button>
    </div>
  );
}
