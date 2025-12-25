import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { Investment, categoryLabels, categoryColors } from '@/types/investment';
import { PerformanceChart } from './PerformanceChart';
import { cn } from '@/lib/utils';

interface ResultsAreaProps {
  investments: Investment[];
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
}

type Period = '1d' | '1w' | '1m' | '6m' | '1y';

const periods: { id: Period; label: string }[] = [
  { id: '1d', label: '1 Dia' },
  { id: '1w', label: '1 Semana' },
  { id: '1m', label: '1 Mês' },
  { id: '6m', label: '6 Meses' },
  { id: '1y', label: '1 Ano' },
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

export function ResultsArea({ investments, totalValue, totalInvested, totalProfitLoss }: ResultsAreaProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1m');
  const profitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  const isPositive = totalProfitLoss >= 0;

  // Ordena investimentos por lucro/prejuízo
  const sortedInvestments = [...investments].sort((a, b) => b.profitLoss - a.profitLoss);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="investment-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Lucro Total</span>
          </div>
          <p className={cn(
            "text-2xl font-bold font-mono",
            isPositive ? "text-success text-glow" : "text-destructive"
          )}>
            {isPositive ? '+' : ''}{formatCurrency(totalProfitLoss)}
          </p>
        </div>

        <div className="investment-card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Investido</span>
          </div>
          <p className="text-2xl font-bold font-mono text-card-foreground">
            {formatCurrency(totalInvested)}
          </p>
        </div>

        <div className="investment-card">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Retorno</span>
          </div>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <p className={cn(
              "text-2xl font-bold font-mono",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {isPositive ? '+' : ''}{formatPercent(profitLossPercent)}
            </p>
          </div>
        </div>
      </div>

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
