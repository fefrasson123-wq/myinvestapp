import { useState } from 'react';
import { Tag, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Investment, categoryLabels, categoryColors } from '@/types/investment';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';

export type InvestmentTag = 'short-term' | 'long-term' | 'passive-income' | 'speculation';

export const tagLabels: Record<InvestmentTag, string> = {
  'short-term': 'Curto Prazo',
  'long-term': 'Longo Prazo',
  'passive-income': 'Renda Passiva',
  'speculation': 'Especulação',
};

export const tagColors: Record<InvestmentTag, string> = {
  'short-term': 'hsl(280, 100%, 60%)',
  'long-term': 'hsl(200, 100%, 50%)',
  'passive-income': 'hsl(140, 100%, 45%)',
  'speculation': 'hsl(45, 100%, 50%)',
};

interface InvestmentsByTagProps {
  investments: Investment[];
  investmentTags: Record<string, InvestmentTag>;
  onTagChange: (investmentId: string, tag: InvestmentTag | null) => void;
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

export function InvestmentsByTag({ investments, investmentTags, onTagChange }: InvestmentsByTagProps) {
  const { rate: usdToBrl } = useUsdBrlRate();
  const [expandedTags, setExpandedTags] = useState<Record<InvestmentTag, boolean>>({
    'short-term': false,
    'long-term': false,
    'passive-income': false,
    'speculation': false,
  });

  const toggleTag = (tag: InvestmentTag) => {
    setExpandedTags(prev => ({ ...prev, [tag]: !prev[tag] }));
  };

  // Agrupa investimentos por tag
  const investmentsByTag = Object.entries(tagLabels).reduce((acc, [tag]) => {
    acc[tag as InvestmentTag] = investments.filter(inv => investmentTags[inv.id] === tag);
    return acc;
  }, {} as Record<InvestmentTag, Investment[]>);

  // Investimentos sem tag
  const untaggedInvestments = investments.filter(inv => !investmentTags[inv.id]);

  const hasAnyTaggedInvestments = Object.values(investmentsByTag).some(invs => invs.length > 0);

  if (!hasAnyTaggedInvestments && untaggedInvestments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Investimentos por Tag</h2>
      </div>

      {(Object.entries(tagLabels) as [InvestmentTag, string][]).map(([tag, label]) => {
        const tagInvestments = investmentsByTag[tag];
        if (tagInvestments.length === 0) return null;

        const totalValue = tagInvestments.reduce((acc, inv) => {
          const isCrypto = inv.category === 'crypto';
          return acc + (isCrypto ? inv.currentValue * usdToBrl : inv.currentValue);
        }, 0);

        const totalProfitLoss = tagInvestments.reduce((acc, inv) => {
          const isCrypto = inv.category === 'crypto';
          return acc + (isCrypto ? inv.profitLoss * usdToBrl : inv.profitLoss);
        }, 0);

        const isPositive = totalProfitLoss >= 0;
        const isExpanded = expandedTags[tag];

        return (
          <div key={tag} className="investment-card overflow-hidden">
            <button
              onClick={() => toggleTag(tag)}
              className="w-full flex items-center justify-between p-0 mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tagColors[tag] }}
                />
                <h3 className="font-semibold text-card-foreground">{label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {tagInvestments.length}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-mono text-sm text-card-foreground">
                    {formatCurrency(totalValue)}
                  </p>
                  <p className={cn(
                    "text-xs font-mono",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? '+' : ''}{formatCurrency(totalProfitLoss)}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-2 animate-smooth-appear">
                {tagInvestments.map((inv, index) => {
                  const isCrypto = inv.category === 'crypto';
                  const value = isCrypto ? inv.currentValue * usdToBrl : inv.currentValue;
                  const invIsPositive = inv.profitLoss >= 0;

                  return (
                    <div 
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="w-2 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoryColors[inv.category] }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-card-foreground truncate">
                            {inv.name}
                            {inv.ticker && (
                              <span className="ml-1 text-primary text-sm font-mono">({inv.ticker})</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[inv.category]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-mono text-sm text-card-foreground">
                            {formatCurrency(value)}
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            {invIsPositive ? (
                              <TrendingUp className="w-3 h-3 text-success" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-destructive" />
                            )}
                            <span className={cn(
                              "text-xs font-mono",
                              invIsPositive ? "text-success" : "text-destructive"
                            )}>
                              {formatPercent(inv.profitLossPercent)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTagChange(inv.id, null);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
