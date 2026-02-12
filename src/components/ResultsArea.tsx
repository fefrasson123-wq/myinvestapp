import { useState } from 'react';
import { TrendingUp, TrendingDown, Zap, Lock } from 'lucide-react';
import { Investment, categoryLabels, categoryColors } from '@/types/investment';
import { PerformanceChart } from './PerformanceChart';
import { CategoryProfitLoss } from './CategoryProfitLoss';
import { cn } from '@/lib/utils';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';

interface ResultsAreaProps {
  investments: Investment[];
}

type Period = '24h' | '1w' | '1m' | '6m' | '1y' | 'total';

const periods: { id: Period; label: string }[] = [
  { id: '24h', label: '24H' },
  { id: '1w', label: '1S' },
  { id: '1m', label: '1M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1A' },
  { id: 'total', label: 'Total' },
];

export function ResultsArea({ investments }: ResultsAreaProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('total');
  const { formatCurrencyValue, formatPercent, usdBrlRate } = useValuesVisibility();
  const { hasFeature } = useSubscription();

  // Calcula o valor total da carteira para percentuais
  const totalPortfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  // Ordena investimentos por lucro/prejuízo (todos já estão em BRL)
  const sortedInvestments = [...investments].sort((a, b) => {
    return b.profitLoss - a.profitLoss;
  });

  return (
    <div className="space-y-6">
      {/* Gráfico de Patrimônio Total */}
      <div className="investment-card overflow-hidden">
        <div className="flex flex-col gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Evolução do Patrimônio</h2>
          <div className="flex flex-wrap gap-1 p-1 bg-secondary/50 rounded-lg w-full sm:w-fit">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={cn(
                  "flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap min-w-0",
                  selectedPeriod === period.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-card-foreground hover:bg-secondary/80"
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
        <PerformanceChart investments={investments} period={selectedPeriod} />
      </div>

      {/* Lucro por Ativo */}
      {investments.length > 0 && (
        <div className="investment-card">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Lucro/Prejuízo por Ativo</h3>
            <span className="text-xs text-muted-foreground ml-auto font-mono whitespace-nowrap">Tempo real</span>
          </div>
          <div className="space-y-3">
            {sortedInvestments.map((inv, index) => {
          const isUsdDenominated = ['crypto', 'usastocks', 'reits'].includes(inv.category);
              // Converte lucro/prejuízo de ativos USD para BRL
              const displayProfitLoss = isUsdDenominated ? inv.profitLoss * usdBrlRate : inv.profitLoss;
              const invIsPositive = displayProfitLoss >= 0;
              const portfolioPercent = totalPortfolioValue > 0 ? (inv.currentValue / totalPortfolioValue) * 100 : 0;
              
              return (
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 animate-smooth-appear gap-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div 
                      className="w-1.5 sm:w-2 h-6 sm:h-8 rounded-full transition-all duration-300 flex-shrink-0"
                      style={{ backgroundColor: categoryColors[inv.category] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className="font-medium text-card-foreground text-sm sm:text-base truncate">
                          {inv.name}
                          {inv.ticker && (
                            <span className="ml-1 text-primary text-xs sm:text-sm font-mono">({inv.ticker})</span>
                          )}
                        </p>
                        <span className="text-[10px] sm:text-xs font-mono text-muted-foreground bg-secondary/50 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">
                          {portfolioPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {categoryLabels[inv.category]}
                        </p>
                        {isUsdDenominated && (
                          <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono flex-shrink-0">
                            USD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      {invIsPositive ? (
                        <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />
                      )}
                      <p className={cn(
                        "font-mono font-medium transition-colors duration-300 text-xs sm:text-sm whitespace-nowrap",
                        invIsPositive ? "text-success" : "text-destructive"
                      )}>
                        {invIsPositive ? '+' : ''}{formatCurrencyValue(displayProfitLoss)}
                      </p>
                    </div>
                    <p className={cn(
                      "text-xs font-mono transition-colors duration-300 whitespace-nowrap",
                      invIsPositive ? "text-success/70" : "text-destructive/70"
                    )}>
                      {formatPercent(inv.profitLossPercent)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lucro/Prejuízo por Classe */}
      {investments.length > 0 && (
        hasFeature('category_profit_loss') ? (
          <CategoryProfitLoss investments={investments} />
        ) : (
          <div className="relative">
            <div className="blur-sm pointer-events-none">
              <CategoryProfitLoss investments={investments} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <UpgradePrompt feature="Lucro/Prejuízo por Classe" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
