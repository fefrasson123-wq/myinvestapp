import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Investment, InvestmentCategory, categoryLabels, categoryColors } from '@/types/investment';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryDetailModalProps {
  category: InvestmentCategory;
  investments: Investment[];
  onClose: () => void;
}

// Taxa de conversão USD -> BRL
const USD_TO_BRL = 6.15;

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

export function CategoryDetailModal({ category, investments, onClose }: CategoryDetailModalProps) {
  const categoryInvestments = investments.filter(inv => inv.category === category);
  
  const totalValue = categoryInvestments.reduce((acc, inv) => {
    const isCrypto = inv.category === 'crypto';
    return acc + (isCrypto ? inv.currentValue * USD_TO_BRL : inv.currentValue);
  }, 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColors[category] }}
            />
            {categoryLabels[category]}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground">Valor Total na Categoria</p>
            <p className="text-2xl font-mono font-bold text-primary">
              {formatCurrency(totalValue)}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Ativos ({categoryInvestments.length})
            </h4>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categoryInvestments.map((inv, index) => {
                const isCrypto = inv.category === 'crypto';
                const value = isCrypto ? inv.currentValue * USD_TO_BRL : inv.currentValue;
                const isPositive = inv.profitLoss >= 0;
                
                return (
                  <div 
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 animate-smooth-appear"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-card-foreground truncate">
                        {inv.name}
                        {inv.ticker && (
                          <span className="ml-1 text-primary text-sm font-mono">({inv.ticker})</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3 text-success" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        )}
                        <span className={cn(
                          "text-xs font-mono",
                          isPositive ? "text-success" : "text-destructive"
                        )}>
                          {isPositive ? '+' : ''}{formatPercent(inv.profitLossPercent)}
                        </span>
                      </div>
                    </div>
                    <p className="font-mono font-medium text-card-foreground">
                      {formatCurrency(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
