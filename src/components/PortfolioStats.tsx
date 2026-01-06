import { TrendingUp, TrendingDown, Wallet, PiggyBank, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioStatsProps {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  realizedProfitLoss?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function PortfolioStats({ totalValue, totalInvested, totalProfitLoss, realizedProfitLoss = 0 }: PortfolioStatsProps) {
  const profitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  const isPositive = totalProfitLoss >= 0;
  const isRealizedPositive = realizedProfitLoss >= 0;
  const hasRealized = realizedProfitLoss !== 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Patrimônio */}
      <div className="investment-card animate-slide-up stagger-1 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/20 transition-transform duration-300 group-hover:scale-110">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <span className="stat-label">Patrimônio Total</span>
        </div>
        <p className="stat-value number-glow">{formatCurrency(totalValue)}</p>
      </div>

      {/* Total Investido */}
      <div className="investment-card animate-slide-up stagger-2 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-secondary transition-transform duration-300 group-hover:scale-110">
            <PiggyBank className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="stat-label">Total Investido</span>
        </div>
        <p className="text-2xl font-bold font-mono text-card-foreground">{formatCurrency(totalInvested)}</p>
      </div>

      {/* Lucro/Prejuízo Não Realizado */}
      <div className="investment-card animate-slide-up stagger-3 group">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
            isPositive ? "bg-success/20" : "bg-destructive/20"
          )}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
          <span className="stat-label">L/P Não Realizado</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn(
            "text-2xl font-bold font-mono",
            isPositive ? "text-success number-glow" : "text-destructive"
          )}>
            {formatCurrency(totalProfitLoss)}
          </p>
          <span className={cn(
            "text-sm font-mono transition-opacity",
            isPositive ? "text-success/70" : "text-destructive/70"
          )}>
            ({isPositive ? '+' : ''}{formatPercent(profitLossPercent)})
          </span>
        </div>
      </div>

      {/* Lucro/Prejuízo Realizado */}
      <div className="investment-card animate-slide-up stagger-4 group">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
            hasRealized 
              ? isRealizedPositive ? "bg-success/20" : "bg-destructive/20"
              : "bg-muted"
          )}>
            <CheckCircle2 className={cn(
              "w-5 h-5",
              hasRealized 
                ? isRealizedPositive ? "text-success" : "text-destructive"
                : "text-muted-foreground"
            )} />
          </div>
          <span className="stat-label">L/P Realizado</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn(
            "text-2xl font-bold font-mono",
            hasRealized 
              ? isRealizedPositive ? "text-success number-glow" : "text-destructive"
              : "text-muted-foreground"
          )}>
            {formatCurrency(realizedProfitLoss)}
          </p>
        </div>
        {!hasRealized && (
          <p className="text-xs text-muted-foreground mt-1">Nenhuma venda registrada</p>
        )}
      </div>
    </div>
  );
}
