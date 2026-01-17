import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Investment } from '@/types/investment';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEconomicRates } from '@/hooks/useEconomicRates';

interface BenchmarkComparisonProps {
  investment: Investment;
  onClose: () => void;
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

function calculateBenchmarkReturn(invested: number, purchaseDate: string | undefined, annualRate: number): number {
  if (!purchaseDate) return invested;
  
  const start = new Date(purchaseDate);
  const now = new Date();
  const years = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (years <= 0) return invested;
  
  return invested * Math.pow(1 + annualRate / 100, years);
}

export function BenchmarkComparison({ investment, onClose }: BenchmarkComparisonProps) {
  const { rates, isLoading: ratesLoading } = useEconomicRates();
  
  // Usar taxas em tempo real do Banco Central + S&P 500 média histórica
  const benchmarks = [
    { name: 'CDI', rate: rates.cdi, color: 'hsl(140, 100%, 50%)' },
    { name: 'IBOVESPA', rate: 15.0, color: 'hsl(200, 100%, 50%)' },
    { name: 'IPCA', rate: rates.ipca, color: 'hsl(30, 100%, 50%)' },
    { name: 'S&P 500', rate: 12.0, color: 'hsl(280, 100%, 50%)' }, // Média histórica ~10-12% a.a.
  ];
  
  const benchmarkReturns = benchmarks.map(benchmark => {
    const expectedValue = calculateBenchmarkReturn(
      investment.investedAmount, 
      investment.purchaseDate, 
      benchmark.rate
    );
    const expectedProfit = expectedValue - investment.investedAmount;
    const actualProfit = investment.profitLoss;
    const difference = actualProfit - expectedProfit;
    const performedBetter = difference > 0;
    
    return {
      ...benchmark,
      expectedValue,
      expectedProfit,
      difference,
      performedBetter,
    };
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comparação com Benchmarks
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="font-semibold text-card-foreground mb-2">
              {investment.name}
              {investment.ticker && (
                <span className="ml-2 text-primary text-sm font-mono">({investment.ticker})</span>
              )}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Investido</span>
                <p className="font-mono text-card-foreground">
                  {formatCurrency(investment.investedAmount)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Atual</span>
                <p className="font-mono text-primary font-medium">
                  {formatCurrency(investment.currentValue)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Lucro/Prejuízo</span>
                <p className={cn(
                  "font-mono font-medium",
                  investment.profitLoss >= 0 ? "text-success" : "text-destructive"
                )}>
                  {investment.profitLoss >= 0 ? '+' : ''}
                  {formatCurrency(investment.profitLoss)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Rentabilidade</span>
                <p className={cn(
                  "font-mono font-medium",
                  investment.profitLossPercent >= 0 ? "text-success" : "text-destructive"
                )}>
                  {investment.profitLossPercent >= 0 ? '+' : ''}
                  {formatPercent(investment.profitLossPercent)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Se você tivesse investido em:
              </h4>
              {ratesLoading && (
                <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
              )}
            </div>
            
            {benchmarkReturns.map((benchmark, index) => (
              <div 
                key={benchmark.name}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 animate-smooth-appear"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: benchmark.color }}
                  />
                  <div>
                    <p className="font-medium text-card-foreground">{benchmark.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {benchmark.rate}% a.a.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-muted-foreground">
                    Teria: {formatCurrency(benchmark.expectedValue)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {benchmark.performedBetter ? (
                      <TrendingUp className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-destructive" />
                    )}
                    <p className={cn(
                      "text-sm font-mono font-medium",
                      benchmark.performedBetter ? "text-success" : "text-destructive"
                    )}>
                      {benchmark.performedBetter ? 'Superou' : 'Perdeu'} {formatCurrency(Math.abs(benchmark.difference))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!investment.purchaseDate && (
            <p className="text-xs text-muted-foreground text-center">
              * Para uma comparação precisa, adicione a data de compra do investimento.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
