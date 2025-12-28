import { useState } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Investment, categoryLabels, categoryColors } from '@/types/investment';
import { PerformanceChart } from './PerformanceChart';
import { cn } from '@/lib/utils';

interface ResultsAreaProps {
  investments: Investment[];
}

type Period = '1d' | '1w' | '1m' | '6m' | '1y' | 'total';

const periods: { id: Period; label: string }[] = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1S' },
  { id: '1m', label: '1M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1A' },
  { id: 'total', label: 'Total' },
];

// Taxa de conversão USD -> BRL
const USD_TO_BRL = 6.15;

function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function ResultsArea({ investments }: ResultsAreaProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1m');

  // Ordena investimentos por lucro/prejuízo (convertendo para BRL para comparação)
  const sortedInvestments = [...investments].sort((a, b) => {
    const aValue = a.category === 'crypto' ? a.profitLoss * USD_TO_BRL : a.profitLoss;
    const bValue = b.category === 'crypto' ? b.profitLoss * USD_TO_BRL : b.profitLoss;
    return bValue - aValue;
  });

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolução */}
      <div className="investment-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Evolução do Patrimônio</h2>
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
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
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Lucro/Prejuízo por Ativo</h3>
            <span className="text-xs text-muted-foreground ml-auto font-mono">Tempo real</span>
          </div>
          <div className="space-y-3">
            {sortedInvestments.map((inv, index) => {
              const isCrypto = inv.category === 'crypto';
              const currency = isCrypto ? 'USD' : 'BRL';
              const displayProfitLoss = inv.profitLoss;
              const invIsPositive = displayProfitLoss >= 0;
              
              return (
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 hover:translate-x-1 animate-smooth-appear"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-8 rounded-full transition-all duration-300"
                      style={{ backgroundColor: categoryColors[inv.category] }}
                    />
                    <div>
                      <p className="font-medium text-card-foreground">
                        {inv.name}
                        {inv.ticker && (
                          <span className="ml-1 text-primary text-sm font-mono">({inv.ticker})</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {categoryLabels[inv.category]}
                        </p>
                        {isCrypto && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                            USD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {invIsPositive ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive" />
                      )}
                      <p className={cn(
                        "font-mono font-medium transition-colors duration-300",
                        invIsPositive ? "text-success" : "text-destructive"
                      )}>
                        {invIsPositive ? '+' : ''}{formatCurrency(displayProfitLoss, currency)}
                      </p>
                    </div>
                    <p className={cn(
                      "text-sm font-mono transition-colors duration-300",
                      invIsPositive ? "text-success/70" : "text-destructive/70"
                    )}>
                      {invIsPositive ? '+' : ''}{formatPercent(inv.profitLossPercent)}
                    </p>
                    {isCrypto && (
                      <p className="text-xs text-muted-foreground font-mono">
                        ≈ {formatCurrency(displayProfitLoss * USD_TO_BRL, 'BRL')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
