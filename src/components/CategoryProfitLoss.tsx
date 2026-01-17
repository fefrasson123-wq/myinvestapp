import { TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { Investment, InvestmentCategory, categoryLabels, categoryColors } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';

interface CategoryProfitLossProps {
  investments: Investment[];
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

interface CategoryData {
  category: InvestmentCategory;
  invested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export function CategoryProfitLoss({ investments }: CategoryProfitLossProps) {
  const { rate: usdToBrl } = useUsdBrlRate();

  // Agrupa investimentos por categoria e calcula totais
  const categoryData: CategoryData[] = Object.entries(
    investments.reduce((acc, inv) => {
      const category = inv.category;
      const isCrypto = category === 'crypto';
      const invested = isCrypto ? inv.investedAmount * usdToBrl : inv.investedAmount;
      const currentValue = isCrypto ? inv.currentValue * usdToBrl : inv.currentValue;
      
      if (!acc[category]) {
        acc[category] = { invested: 0, currentValue: 0 };
      }
      acc[category].invested += invested;
      acc[category].currentValue += currentValue;
      
      return acc;
    }, {} as Record<InvestmentCategory, { invested: number; currentValue: number }>)
  ).map(([category, data]) => {
    const profitLoss = data.currentValue - data.invested;
    const profitLossPercent = data.invested > 0 ? (profitLoss / data.invested) * 100 : 0;
    
    return {
      category: category as InvestmentCategory,
      invested: data.invested,
      currentValue: data.currentValue,
      profitLoss,
      profitLossPercent,
    };
  }).sort((a, b) => b.currentValue - a.currentValue);

  // Calcula o total da carteira para percentual
  const totalPortfolioValue = categoryData.reduce((sum, cat) => sum + cat.currentValue, 0);

  // Adiciona percentual de cada categoria
  const categoryDataWithPercent = categoryData.map(data => ({
    ...data,
    portfolioPercent: totalPortfolioValue > 0 ? (data.currentValue / totalPortfolioValue) * 100 : 0,
  }));

  if (categoryDataWithPercent.length === 0) {
    return null;
  }

  return (
    <div className="investment-card">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-card-foreground">Lucro/Prejuízo por Classe</h3>
      </div>
      <div className="space-y-3">
        {categoryDataWithPercent.map((data, index) => {
          const isPositive = data.profitLoss >= 0;
          
          return (
            <div 
              key={data.category} 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 hover:translate-x-1 animate-smooth-appear"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-8 rounded-full transition-all duration-300"
                  style={{ backgroundColor: categoryColors[data.category] }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-card-foreground">
                      {categoryLabels[data.category]}
                    </p>
                    <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                      {data.portfolioPercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Investido: {formatCurrency(data.invested)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <p className={cn(
                    "font-mono font-medium transition-colors duration-300",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? '+' : ''}{formatCurrency(data.profitLoss)}
                  </p>
                </div>
                <p className={cn(
                  "text-sm font-mono transition-colors duration-300",
                  isPositive ? "text-success/70" : "text-destructive/70"
                )}>
                  {isPositive ? '+' : ''}{formatPercent(data.profitLossPercent)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
