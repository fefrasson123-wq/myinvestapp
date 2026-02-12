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
import { useUSAStockPrices } from '@/hooks/useUSAStockPrices';
import { useETFPrices } from '@/hooks/useETFPrices';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/UpgradePrompt';

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
  const { hasFeature } = useSubscription();

  // Live prices (best-effort). If unavailable, we fall back to the stored DB price.
  const stock = useStockPrices();
  const fii = useFIIPrices();
  const crypto = useCryptoPrices();
  const usaStock = useUSAStockPrices();
  const etf = useETFPrices();
  const gold = useGoldPrice();

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
    const usaStockTickers = new Set<string>();
    const etfTickers = new Set<string>();

    investments.forEach((inv) => {
      const ticker = inv.ticker?.trim();
      if (!ticker) return;

      if (inv.category === 'stocks' || inv.category === 'bdr') stocksTickers.add(ticker.toUpperCase());
      if (inv.category === 'fii') fiiTickers.add(ticker.toUpperCase());
      if (inv.category === 'crypto') cryptoTickers.add(ticker.toUpperCase());
      if (inv.category === 'usastocks' || inv.category === 'reits') usaStockTickers.add(ticker.toUpperCase());
      if (inv.category === 'etf') etfTickers.add(ticker.toUpperCase());
    });

    return {
      stocks: Array.from(stocksTickers),
      fii: Array.from(fiiTickers),
      crypto: Array.from(cryptoTickers),
      usaStocks: Array.from(usaStockTickers),
      etf: Array.from(etfTickers),
    };
  }, [investments]);

  // Fetch prices only once on mount and then refresh periodically
  // Avoid triggering on every tickersByType change to prevent rate limiter overflow
  useEffect(() => {
    const hasStocks = tickersByType.stocks.length > 0;
    const hasFII = tickersByType.fii.length > 0;
    const hasCrypto = tickersByType.crypto.length > 0;
    const hasUSAStocks = tickersByType.usaStocks.length > 0;
    const hasETF = tickersByType.etf.length > 0;
    
    if (!hasStocks && !hasFII && !hasCrypto && !hasUSAStocks && !hasETF) return;

    const initialTimeout = setTimeout(() => {
      if (hasStocks) stock.fetchPrices(tickersByType.stocks);
      if (hasFII) fii.fetchPrices(tickersByType.fii);
      if (hasCrypto) crypto.fetchPrices(tickersByType.crypto);
      if (hasUSAStocks) usaStock.fetchPrices(tickersByType.usaStocks);
      if (hasETF) etf.fetchPrices(tickersByType.etf);
    }, 500);

    const interval = window.setInterval(() => {
      if (hasStocks) stock.fetchPrices(tickersByType.stocks);
      if (hasFII) fii.fetchPrices(tickersByType.fii);
      if (hasCrypto) crypto.fetchPrices(tickersByType.crypto);
      if (hasUSAStocks) usaStock.fetchPrices(tickersByType.usaStocks);
      if (hasETF) etf.fetchPrices(tickersByType.etf);
    }, 120_000);

    return () => {
      clearTimeout(initialTimeout);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tickersByType)]);

  const getLivePrice = (inv: Investment): number | null => {
    const ticker = inv.ticker?.trim();

    if (inv.category === 'stocks' || inv.category === 'bdr') return ticker ? stock.getPrice(ticker) : null;
    if (inv.category === 'fii') return ticker ? fii.getPrice(ticker) : null;
    if (inv.category === 'crypto') return ticker ? crypto.getPrice(ticker) : null;
    if (inv.category === 'usastocks' || inv.category === 'reits') return ticker ? usaStock.getPrice(ticker) : null;
    if (inv.category === 'etf') return ticker ? etf.getPrice(ticker) : null;
    if (inv.category === 'gold' && inv.goldType === 'digital' && ticker) {
      // PAXG digital gold uses crypto prices
      return crypto.getPrice(ticker);
    }
    if (inv.category === 'gold' && inv.goldType === 'physical' && gold.pricePerGram) {
      // Physical gold: apply purity multiplier
      const purityStr = inv.goldPurity?.replace('K', '') || '24';
      const purityMultiplier = parseInt(purityStr) / 24;
      return gold.pricePerGram * purityMultiplier;
    }

    return null;
  };

  const hasLivePriceSupport = (inv: Investment) => ['stocks', 'fii', 'crypto', 'bdr', 'usastocks', 'reits', 'etf', 'gold'].includes(inv.category);

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
          const isUsdDenominated = ['crypto', 'usastocks', 'reits'].includes(investment.category);
          const isRealEstate = investment.category === 'realestate';
          const currency = isUsdDenominated ? 'USD' : 'BRL';
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
                      {isUsdDenominated && (
                        <span className="text-xs text-muted-foreground font-mono">USD</span>
                      )}
                      {isUsingFallback && (
                        <span className="text-xs text-muted-foreground">
                          sem cotação ao vivo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Quantidade</span>
                        <p className="font-mono text-card-foreground text-xs sm:text-sm truncate">{formatQuantity(investment.quantity)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Preço Médio</span>
                        <p className="font-mono text-card-foreground text-xs sm:text-sm truncate">{formatCurrency(investment.averagePrice, currency)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Cotação Atual</span>
                        <p className="font-mono text-card-foreground text-xs sm:text-sm truncate">{formatCurrency(effectiveCurrentPrice, currency)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Acumulado Total</span>
                        <p className="font-mono text-primary font-medium text-xs sm:text-sm truncate">
                          {isUsdDenominated 
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
                            'font-mono font-medium text-sm sm:text-base whitespace-nowrap',
                            isPositive ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {formatCurrencyValue(isUsdDenominated ? effectiveProfitLoss * usdBrlRate : effectiveProfitLoss)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-mono whitespace-nowrap',
                          isPositive ? 'text-success/70' : 'text-destructive/70'
                        )}
                      >
                        {formatPercent(effectiveProfitLossPercent)}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      {hasFeature('evolution_charts') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEvolutionInvestment(investment)}
                          className="hover:text-success hover:bg-success/10 btn-interactive h-7 w-7 sm:h-8 sm:w-8"
                          title="Evolução do Investimento"
                        >
                          <LineChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                      {hasFeature('benchmark_comparison') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedInvestment(investment)}
                          className="hover:text-primary hover:bg-primary/10 btn-interactive h-7 w-7 sm:h-8 sm:w-8"
                          title="Comparar com Benchmarks"
                        >
                          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                      {hasFeature('tags') && onTagChange && (
                        <TagSelector
                          currentTag={currentTag || null}
                          onTagChange={(tag) => onTagChange(investment.id, tag)}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSell(investment)}
                        className="hover:text-primary hover:bg-primary/10 btn-interactive h-7 w-7 sm:h-8 sm:w-8"
                        title="Vender"
                      >
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(investment)}
                        className="btn-interactive h-7 w-7 sm:h-8 sm:w-8"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(investment.id)}
                        className="hover:text-destructive hover:bg-destructive/10 btn-interactive h-7 w-7 sm:h-8 sm:w-8"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
