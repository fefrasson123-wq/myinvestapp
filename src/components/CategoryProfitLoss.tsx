import { TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { Investment, InvestmentCategory, categoryLabels, categoryColors } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';

interface CategoryProfitLossProps {
  investments: Investment[];
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
  const { formatCurrencyValue } = useValuesVisibility();

  // Agrupa investimentos por categoria e calcula totais
  const categoryData: CategoryData[] = Object.entries(
    investments.reduce((acc, inv) => {
      const category = inv.category;
      const isUsdBased = category === 'crypto' || category === 'usastocks' || category === 'reits';
      const invested = isUsdBased ? inv.investedAmount * usdToBrl : inv.investedAmount;
      const currentValue = isUsdBased ? inv.currentValue * usdToBrl : inv.currentValue;
      
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
  }).sort((a, b) => b.profitLoss - a.profitLoss);

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
              className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 animate-smooth-appear overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div 
                  className="w-1.5 sm:w-2 h-6 sm:h-8 rounded-full transition-all duration-300 flex-shrink-0"
                  style={{ backgroundColor: categoryColors[data.category] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <p className="font-medium text-card-foreground text-sm sm:text-base truncate">
                      {categoryLabels[data.category]}
                    </p>
                    <span className="text-[10px] sm:text-xs font-mono text-muted-foreground bg-secondary/50 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">
                      {data.portfolioPercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Investido: {formatCurrencyValue(data.invested)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-success flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />
                  )}
                  <p className={cn(
                    "font-mono font-medium transition-colors duration-300 text-xs sm:text-sm whitespace-nowrap",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? '+' : ''}{formatCurrencyValue(data.profitLoss)}
                  </p>
                </div>
                <p className={cn(
                  "text-xs font-mono transition-colors duration-300 whitespace-nowrap",
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
