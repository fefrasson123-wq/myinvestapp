import { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { Trash2, Edit, TrendingUp, TrendingDown, DollarSign, BarChart3, LineChart, Building2 } from 'lucide-react';
import { Investment, categoryLabels, categoryColors } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RealEstateValueChart } from '@/components/RealEstateValueChart';
import { BenchmarkComparison } from '@/components/BenchmarkComparison';
import { InvestmentEvolutionChart } from '@/components/InvestmentEvolutionChart';
import { TagSelector } from '@/components/TagSelector';
import { InvestmentTag, tagColors } from '@/components/InvestmentsByTag';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useFIIPrices } from '@/hooks/useFIIPrices';
import { useStockPrices } from '@/hooks/useStockPrices';

interface InvestmentListProps {
  investments: Investment[];
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onSell: (investment: Investment) => void;
  investmentTags?: Record<string, InvestmentTag>;
  onTagChange?: (investmentId: string, tag: InvestmentTag | null) => void;
}

function InvestmentListComponent({ investments, onEdit, onDelete, onSell, investmentTags = {}, onTagChange }: InvestmentListProps) {
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [evolutionInvestment, setEvolutionInvestment] = useState<Investment | null>(null);
  const [realEstateChartInvestment, setRealEstateChartInvestment] = useState<Investment | null>(null);
  const { showValues, formatPercent, formatCurrencyValue, usdBrlRate, displayCurrency } = useValuesVisibility();

  // Live prices (best-effort). If unavailable, we fall back to the stored DB price.
  const stock = useStockPrices();
  const fii = useFIIPrices();
  const crypto = useCryptoPrices();

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
    if (!showValues) return currency === 'BRL' ? 'R$ •••••' : '$ •••••';
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatQuantity = (value: number) => {
    if (!showValues) return '•••';
    return value.toLocaleString('pt-BR');
  };

  const tickersByType = useMemo(() => {
    const stocksTickers = new Set<string>();
    const fiiTickers = new Set<string>();
    const cryptoTickers = new Set<string>();

    investments.forEach((inv) => {
      const ticker = inv.ticker?.trim();
      if (!ticker) return;

      if (inv.category === 'stocks' || inv.category === 'bdr') stocksTickers.add(ticker.toUpperCase());
      if (inv.category === 'fii') fiiTickers.add(ticker.toUpperCase());
      if (inv.category === 'crypto') cryptoTickers.add(ticker.toUpperCase());
    });

    return {
      stocks: Array.from(stocksTickers),
      fii: Array.from(fiiTickers),
      crypto: Array.from(cryptoTickers),
    };
  }, [investments]);

  // Fetch prices only once on mount and then refresh periodically
  // Avoid triggering on every tickersByType change to prevent rate limiter overflow
  useEffect(() => {
    // Use a debounced/throttled approach - only fetch if we have tickers
    const hasStocks = tickersByType.stocks.length > 0;
    const hasFII = tickersByType.fii.length > 0;
    const hasCrypto = tickersByType.crypto.length > 0;
    
    // Skip if no tickers to fetch
    if (!hasStocks && !hasFII && !hasCrypto) return;

    // Initial fetch with slight delay to avoid race conditions with other components
    const initialTimeout = setTimeout(() => {
      if (hasStocks) stock.fetchPrices(tickersByType.stocks);
      if (hasFII) fii.fetchPrices(tickersByType.fii);
      if (hasCrypto) crypto.fetchPrices(tickersByType.crypto);
    }, 500);

    // Periodic refresh every 2 minutes (reduced frequency to avoid rate limiting)
    const interval = window.setInterval(() => {
      if (hasStocks) stock.fetchPrices(tickersByType.stocks);
      if (hasFII) fii.fetchPrices(tickersByType.fii);
      if (hasCrypto) crypto.fetchPrices(tickersByType.crypto);
    }, 120_000);

    return () => {
      clearTimeout(initialTimeout);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tickersByType)]);

  const getLivePrice = (inv: Investment): number | null => {
    const ticker = inv.ticker?.trim();
    if (!ticker) return null;

    if (inv.category === 'stocks' || inv.category === 'bdr') return stock.getPrice(ticker);
    if (inv.category === 'fii') return fii.getPrice(ticker);
    if (inv.category === 'crypto') return crypto.getPrice(ticker);

    return null;
  };

  const hasLivePriceSupport = (inv: Investment) => ['stocks', 'fii', 'crypto', 'bdr'].includes(inv.category);

  if (investments.length === 0) {
    return (
      <div className="investment-card text-center py-12 animate-smooth-appear">
        <p className="text-muted-foreground">Nenhum investimento cadastrado ainda.</p>
        <p className="text-muted-foreground text-sm mt-2">Clique em "Cadastrar" para começar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {investments.map((investment, index) => {
          const livePrice = getLivePrice(investment);
          const effectiveCurrentPrice = livePrice ?? investment.currentPrice;

          const effectiveCurrentValue = investment.quantity * effectiveCurrentPrice;
          const effectiveProfitLoss = effectiveCurrentValue - investment.investedAmount;
          const effectiveProfitLossPercent = investment.investedAmount > 0
            ? (effectiveProfitLoss / investment.investedAmount) * 100
            : 0;

          const isPositive = effectiveProfitLoss >= 0;
          const isCrypto = investment.category === 'crypto';
          const isRealEstate = investment.category === 'realestate';
          const currency = isCrypto ? 'USD' : 'BRL';
          const currentTag = investmentTags[investment.id];

          const isUsingFallback = hasLivePriceSupport(investment) && !!investment.ticker && livePrice == null;

          return (
            <div
              key={investment.id}
              className="investment-card animate-slide-up group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 md:items-center">
                  {/* Info principal */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                      {currentTag && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            borderColor: tagColors[currentTag],
                            color: tagColors[currentTag],
                            backgroundColor: `${tagColors[currentTag]}20`,
                            border: '1px solid',
                          }}
                        >
                          {currentTag === 'long-term'
                            ? 'Longo Prazo'
                            : currentTag === 'passive-income'
                              ? 'Renda Passiva'
                              : 'Especulação'}
                        </span>
                      )}
                      {isCrypto && (
                        <span className="text-xs text-muted-foreground font-mono">USD</span>
                      )}
                      {isUsingFallback && (
                        <span className="text-xs text-muted-foreground">
                          sem cotação ao vivo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Quantidade</span>
                        <p className="font-mono text-card-foreground truncate">{formatQuantity(investment.quantity)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Preço Médio</span>
                        <p className="font-mono text-card-foreground truncate">{formatCurrency(investment.averagePrice, currency)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Cotação Atual</span>
                        <p className="font-mono text-card-foreground truncate">{formatCurrency(effectiveCurrentPrice, currency)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Acumulado Total</span>
                        <p className="font-mono text-primary font-medium truncate">
                          {isCrypto 
                            ? formatCurrency(
                                displayCurrency === 'BRL' 
                                  ? effectiveCurrentValue * usdBrlRate 
                                  : effectiveCurrentValue, 
                                displayCurrency
                              )
                            : formatCurrency(effectiveCurrentValue, currency)
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lucro/Prejuízo e Ações */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full md:w-[260px] flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-1 justify-start sm:justify-end">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-success transition-transform group-hover:scale-110" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive transition-transform group-hover:scale-110" />
                        )}
                        <span
                          className={cn(
                            'font-mono font-medium text-sm sm:text-base',
                            isPositive ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {formatCurrencyValue(isCrypto ? effectiveProfitLoss * usdBrlRate : effectiveProfitLoss)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-mono',
                          isPositive ? 'text-success/70' : 'text-destructive/70'
                        )}
                      >
                        {formatPercent(effectiveProfitLossPercent)}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity flex-wrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEvolutionInvestment(investment)}
                        className="hover:text-success hover:bg-success/10 btn-interactive h-8 w-8 sm:h-10 sm:w-10"
                        title="Evolução do Investimento"
                      >
                        <LineChart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedInvestment(investment)}
                        className="hover:text-primary hover:bg-primary/10 btn-interactive h-8 w-8 sm:h-10 sm:w-10"
                        title="Comparar com Benchmarks"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      {onTagChange && (
                        <TagSelector
                          currentTag={currentTag || null}
                          onTagChange={(tag) => onTagChange(investment.id, tag)}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSell(investment)}
                        className="hover:text-primary hover:bg-primary/10 btn-interactive h-8 w-8 sm:h-10 sm:w-10"
                        title="Vender"
                      >
                        <DollarSign className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(investment)}
                        className="btn-interactive h-8 w-8 sm:h-10 sm:w-10"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(investment.id)}
                        className="hover:text-destructive hover:bg-destructive/10 btn-interactive h-8 w-8 sm:h-10 sm:w-10"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {selectedInvestment && (
        <BenchmarkComparison
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
        />
      )}

      {evolutionInvestment && (
        <InvestmentEvolutionChart
          investment={evolutionInvestment}
          isOpen={!!evolutionInvestment}
          onClose={() => setEvolutionInvestment(null)}
        />
      )}

      {/* Modal de Valorização de Imóvel */}
      {realEstateChartInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setRealEstateChartInvestment(null)} 
          />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl animate-scale-in">
            <div className="p-4">
              <RealEstateValueChart
                purchasePrice={realEstateChartInvestment.investedAmount}
                currentValue={realEstateChartInvestment.currentValue}
                purchaseDate={realEstateChartInvestment.purchaseDate}
                expanded={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const InvestmentList = memo(InvestmentListComponent);
