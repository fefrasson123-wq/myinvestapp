import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
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

export function ResultsArea({ investments }: ResultsAreaProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1m');

  // Ordena investimentos por lucro/prejuízo
  const sortedInvestments = [...investments].sort((a, b) => b.profitLoss - a.profitLoss);

  return (
    <div className="space-y-6">

      {/* Gráfico de Evolução */}
      <div className="investment-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">Evolução do Patrimônio</h3>
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  selectedPeriod === period.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-card-foreground"
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
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Lucro/Prejuízo por Ativo</h3>
          <div className="space-y-3">
            {sortedInvestments.map((inv) => {
              const invIsPositive = inv.profitLoss >= 0;
              return (
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: categoryColors[inv.category] }}
                    />
                    <div>
                      <p className="font-medium text-card-foreground">
                        {inv.name}
                        {inv.ticker && (
                          <span className="ml-1 text-primary text-sm">({inv.ticker})</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[inv.category]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-mono font-medium",
                      invIsPositive ? "text-success" : "text-destructive"
                    )}>
                      {invIsPositive ? '+' : ''}{formatCurrency(inv.profitLoss)}
                    </p>
                    <p className={cn(
                      "text-sm font-mono",
                      invIsPositive ? "text-success/70" : "text-destructive/70"
                    )}>
                      {invIsPositive ? '+' : ''}{formatPercent(inv.profitLossPercent)}
                    </p>
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
