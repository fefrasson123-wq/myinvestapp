import { Trash2, Edit, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Investment, categoryLabels, categoryColors } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InvestmentListProps {
  investments: Investment[];
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onSell: (investment: Investment) => void;
}

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

export function InvestmentList({ investments, onEdit, onDelete, onSell }: InvestmentListProps) {
  if (investments.length === 0) {
    return (
      <div className="investment-card text-center py-12 animate-smooth-appear">
        <p className="text-muted-foreground">Nenhum investimento cadastrado ainda.</p>
        <p className="text-muted-foreground text-sm mt-2">Clique em "Adicionar Investimento" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {investments.map((investment, index) => {
        const isPositive = investment.profitLoss >= 0;
        const isCrypto = investment.category === 'crypto';
        const currency = isCrypto ? 'USD' : 'BRL';
        
        return (
          <div 
            key={investment.id} 
            className="investment-card animate-slide-up group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Info principal */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {investment.name}
                    {investment.ticker && (
                      <span className="ml-2 text-primary font-mono text-sm">
                        ({investment.ticker})
                      </span>
                    )}
                  </h4>
                  <span 
                    className="category-badge transition-transform duration-200 hover:scale-105"
                    style={{ 
                      borderColor: categoryColors[investment.category],
                      color: categoryColors[investment.category],
                      backgroundColor: `${categoryColors[investment.category]}20`,
                    }}
                  >
                    {categoryLabels[investment.category]}
                  </span>
                  {isCrypto && (
                    <span className="text-xs text-muted-foreground font-mono">USD</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="transition-colors">
                    <span className="text-muted-foreground">Quantidade</span>
                    <p className="font-mono text-card-foreground">{investment.quantity.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Médio</span>
                    <p className="font-mono text-card-foreground">{formatCurrency(investment.averagePrice, currency)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Atual</span>
                    <p className="font-mono text-card-foreground">{formatCurrency(investment.currentPrice, currency)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor Atual</span>
                    <p className="font-mono text-primary font-medium">{formatCurrency(investment.currentValue, currency)}</p>
                  </div>
                </div>
              </div>

              {/* Lucro/Prejuízo */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-success transition-transform group-hover:scale-110" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive transition-transform group-hover:scale-110" />
                    )}
                    <span className={cn(
                      "font-mono font-medium",
                      isPositive ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(investment.profitLoss, currency)}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-mono",
                    isPositive ? "text-success/70" : "text-destructive/70"
                  )}>
                    {isPositive ? '+' : ''}{formatPercent(investment.profitLossPercent)}
                  </span>
                </div>

                {/* Ações */}
                <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onSell(investment)}
                    className="hover:text-primary hover:bg-primary/10 btn-interactive"
                    title="Vender"
                  >
                    <DollarSign className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(investment)}
                    className="btn-interactive"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(investment.id)}
                    className="hover:text-destructive hover:bg-destructive/10 btn-interactive"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
