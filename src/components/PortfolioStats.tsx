import { TrendingUp, TrendingDown, Wallet, PiggyBank, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';

interface PortfolioStatsProps {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
}

export function PortfolioStats({ totalValue, totalInvested, totalProfitLoss }: PortfolioStatsProps) {
  const { showValues, formatValue, formatPercent } = useValuesVisibility();
  const { rate: usdToBrl, isLoading: rateLoading, lastUpdated } = useUsdBrlRate();
  const profitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  const isPositive = totalProfitLoss >= 0;

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ •••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Cotação USD/BRL em tempo real */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>USD/BRL:</span>
        <span className="font-mono font-medium text-primary">
          {usdToBrl.toFixed(4)}
        </span>
        {rateLoading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          lastUpdated && (
            <span className="text-[10px]">
              ({lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Lucro/Prejuízo */}
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
          <span className="stat-label">Lucro / Prejuízo</span>
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
            ({formatPercent(profitLossPercent)})
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}
