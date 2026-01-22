import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Investment } from '@/types/investment';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEconomicRates } from '@/hooks/useEconomicRates';
import { useState, useEffect } from 'react';

interface BenchmarkComparisonProps {
  investment: Investment;
  onClose: () => void;
}

// Hook para buscar retorno de 12 meses do Bitcoin
function useBitcoin12MonthReturn() {
  const [return12m, setReturn12m] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBitcoinHistory() {
      try {
        // Buscar preço atual e de 365 dias atrás
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=brl&days=365&interval=daily'
        );
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        const prices = data.prices as [number, number][];
        
        if (prices && prices.length >= 2) {
          const priceNow = prices[prices.length - 1][1];
          const price12MonthsAgo = prices[0][1];
          const returnPercent = ((priceNow - price12MonthsAgo) / price12MonthsAgo) * 100;
          setReturn12m(returnPercent);
        }
      } catch (error) {
        console.error('Error fetching Bitcoin 12m return:', error);
        setReturn12m(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBitcoinHistory();
  }, []);

  return { return12m, isLoading };
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

// Calcula retorno do benchmark baseado no tipo de taxa
// CDI: taxa anual composta
// IBOVESPA, S&P500, IPCA, Bitcoin: retorno acumulado de 12 meses
function calculateBenchmarkReturn(
  invested: number, 
  purchaseDate: string | undefined, 
  rate: number,
  isAnnualRate: boolean = false
): number {
  if (!purchaseDate) return invested;
  
  const start = new Date(purchaseDate);
  const now = new Date();
  const years = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (years <= 0) return invested;
  
  if (isAnnualRate) {
    // CDI: taxa anual composta
    return invested * Math.pow(1 + rate / 100, years);
  } else {
    // Retorno de 12 meses: projetar proporcionalmente ao período
    // Se investiu há 2 anos, o retorno é composto: (1 + rate/100)^years
    return invested * Math.pow(1 + rate / 100, years);
  }
}

export function BenchmarkComparison({ investment, onClose }: BenchmarkComparisonProps) {
  const { rates, isLoading: ratesLoading } = useEconomicRates();
  const { return12m: btcReturn, isLoading: btcLoading } = useBitcoin12MonthReturn();
  
  // Detectar se o investimento é do mesmo tipo que o benchmark
  const isBitcoinInvestment = investment.category === 'crypto' && 
    (investment.ticker?.toUpperCase() === 'BTC' ||
     investment.name?.toLowerCase().includes('bitcoin'));
  
  // Categorias de renda fixa que usam CDI
  const fixedIncomeCategories = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'];
  const isFixedIncome = fixedIncomeCategories.includes(investment.category);
  
  const isCDIInvestment = isFixedIncome && 
    (investment.fixedIncomeType === 'pos' || 
     investment.fixedIncomeType === 'cdi' ||
     investment.notes?.toLowerCase().includes('cdi') || 
     investment.notes?.toLowerCase().includes('pós-fixado'));
  
  const isIPCAInvestment = isFixedIncome && 
    (investment.fixedIncomeType === 'ipca' ||
     investment.notes?.toLowerCase().includes('ipca'));
  
  // Usar taxas em tempo real - todas são retornos dos últimos 12 meses (exceto CDI que é a.a.)
  const benchmarks = [
    { name: 'CDI', rate: rates.cdi, color: 'hsl(140, 100%, 50%)', label: 'a.a.', isAnnualRate: true, isSameAsInvestment: isCDIInvestment },
    { name: 'IBOVESPA', rate: rates.ibovespa, color: 'hsl(200, 100%, 50%)', label: '12m', isAnnualRate: false, isSameAsInvestment: false },
    { name: 'IPCA', rate: rates.ipca, color: 'hsl(30, 100%, 50%)', label: '12m', isAnnualRate: false, isSameAsInvestment: isIPCAInvestment },
    { name: 'S&P 500', rate: rates.sp500, color: 'hsl(280, 100%, 50%)', label: '12m', isAnnualRate: false, isSameAsInvestment: false },
    { name: 'Bitcoin', rate: btcReturn ?? 50, color: 'hsl(45, 100%, 50%)', label: '12m', isAnnualRate: false, isSameAsInvestment: isBitcoinInvestment },
  ];
  
  const benchmarkReturns = benchmarks.map(benchmark => {
    const expectedValue = calculateBenchmarkReturn(
      investment.investedAmount, 
      investment.purchaseDate, 
      benchmark.rate,
      benchmark.isAnnualRate
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
          <DialogDescription className="sr-only">
            Compare o desempenho do seu investimento com índices de mercado
          </DialogDescription>
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
              {(ratesLoading || btcLoading) && (
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
                      {typeof benchmark.rate === 'number' ? benchmark.rate.toFixed(1) : benchmark.rate}% {benchmark.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {benchmark.isSameAsInvestment ? (
                    <>
                      <p className="text-sm font-mono text-muted-foreground">—</p>
                      <p className="text-sm font-mono text-muted-foreground">Mesmo ativo</p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
