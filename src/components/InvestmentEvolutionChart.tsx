import { useMemo, memo, useCallback, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Investment, categoryLabels } from '@/types/investment';
import { supabase } from '@/integrations/supabase/client';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface InvestmentEvolutionChartProps {
  investment: Investment;
  isOpen: boolean;
  onClose: () => void;
}

interface ChartDataPoint {
  date: string;
  value: number;
  price: number;
  profit: number;
  profitPercent: number;
}

// Categorias que usam valorização composta (sem dados de mercado)
const COMPOUND_GROWTH_CATEGORIES = [
  'realestate', 
  'cdb', 
  'lci', 
  'lca', 
  'lcilca', 
  'treasury', 
  'savings', 
  'debentures', 
  'cricra', 
  'fixedincomefund',
  'cash'
];

// Categorias com dados de mercado disponíveis
const MARKET_DATA_CATEGORIES = [
  'crypto',
  'stocks',
  'fii',
  'usastocks',
  'reits',
  'bdr',
  'etf',
  'gold'
];

// Busca histórico via edge function
async function fetchHistoricalPrices(
  ticker: string,
  market: 'br' | 'usa' | 'crypto',
  range: string = '1mo'
): Promise<Array<{ date: string; price: number }>> {
  try {
    const { data, error } = await supabase.functions.invoke('stock-quotes', {
      body: { 
        symbols: [ticker], 
        market, 
        action: 'historical',
        range
      }
    });
    
    if (error) {
      console.error('Error fetching historical:', error);
      return [];
    }
    
    const symbol = ticker.toUpperCase().replace('.SA', '').replace('-USD', '');
    return data?.history?.[symbol] || [];
  } catch (e) {
    console.error('Error fetching historical:', e);
    return [];
  }
}

// Determina o mercado baseado na categoria
function getMarketFromCategory(category: string): 'br' | 'usa' | 'crypto' {
  if (category === 'crypto') return 'crypto';
  if (category === 'usastocks' || category === 'reits' || category === 'gold') return 'usa';
  return 'br';
}

// Determina o range baseado na data de compra
function getRangeFromPurchaseDate(purchaseDate?: string): string {
  if (!purchaseDate) return '1y';
  
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const days = Math.ceil((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days <= 7) return '5d';
  if (days <= 30) return '1mo';
  if (days <= 90) return '3mo';
  if (days <= 180) return '6mo';
  if (days <= 365) return '1y';
  if (days <= 730) return '2y';
  return '5y';
}

// Gera dados de evolução com valorização composta (para imóveis e renda fixa)
function generateCompoundEvolutionData(
  investedAmount: number, 
  currentValue: number, 
  quantity: number,
  purchaseDate?: string,
  annualRate?: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  
  const startDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (!purchaseDate) {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  const endDate = new Date();
  const totalDays = Math.max(30, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalYears = totalDays / 365.25;
  
  let effectiveRate: number;
  if (currentValue > 0 && investedAmount > 0 && totalYears > 0) {
    effectiveRate = (Math.pow(currentValue / investedAmount, 1 / totalYears) - 1) * 100;
  } else {
    effectiveRate = annualRate || 7.73;
  }
  
  let points: number;
  if (totalYears <= 1) {
    points = 12;
  } else if (totalYears <= 3) {
    points = Math.ceil(totalYears * 6);
  } else if (totalYears <= 10) {
    points = Math.ceil(totalYears * 4);
  } else {
    points = Math.ceil(totalYears * 2);
  }
  points = Math.min(points, 36);
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const yearsElapsed = totalYears * progress;
    
    const value = investedAmount * Math.pow(1 + effectiveRate / 100, yearsElapsed);
    const profit = value - investedAmount;
    const profitPercent = investedAmount > 0 ? (profit / investedAmount) * 100 : 0;
    const price = quantity > 0 ? value / quantity : value;
    
    const pointDate = new Date(startDate.getTime() + (totalDays * progress * 24 * 60 * 60 * 1000));
    
    let label: string;
    if (totalDays <= 365) {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
    
    data.push({
      date: label,
      value: Math.round(value * 100) / 100,
      price: Math.round(price * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercent: parseFloat(profitPercent.toFixed(2)),
    });
  }
  
  if (data.length > 0) {
    data[0].value = investedAmount;
    data[0].profit = 0;
    data[0].profitPercent = 0;
  }
  
  if (data.length > 1) {
    data[data.length - 1].value = currentValue;
    data[data.length - 1].profit = currentValue - investedAmount;
    data[data.length - 1].profitPercent = investedAmount > 0 
      ? parseFloat(((currentValue - investedAmount) / investedAmount * 100).toFixed(2))
      : 0;
  }
  
  return data;
}

// Converte histórico de preços para dados do gráfico
function convertHistoryToChartData(
  history: Array<{ date: string; price: number }>,
  quantity: number,
  investedAmount: number,
  purchaseDate?: string,
  multiplier: number = 1
): ChartDataPoint[] {
  if (!history || history.length === 0) return [];
  
  const purchaseTs = purchaseDate ? new Date(purchaseDate).getTime() : 0;
  
  // Filtra pontos após a data de compra
  const filteredHistory = purchaseTs > 0 
    ? history.filter(h => new Date(h.date).getTime() >= purchaseTs)
    : history;
  
  if (filteredHistory.length === 0) return [];
  
  // Reduz pontos se tiver muitos (máximo ~50 para performance)
  const step = Math.max(1, Math.floor(filteredHistory.length / 50));
  const sampledHistory = filteredHistory.filter((_, i) => i % step === 0 || i === filteredHistory.length - 1);
  
  return sampledHistory.map((point, index) => {
    const price = point.price * multiplier;
    const value = quantity * price;
    const profit = value - investedAmount;
    const profitPercent = investedAmount > 0 ? (profit / investedAmount) * 100 : 0;
    
    const pointDate = new Date(point.date);
    const totalDays = (new Date().getTime() - new Date(sampledHistory[0].date).getTime()) / (1000 * 60 * 60 * 24);
    
    let label: string;
    if (totalDays <= 7) {
      label = pointDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
    } else if (totalDays <= 30) {
      label = pointDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (totalDays <= 365) {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }
    
    // Último ponto sempre mostra "Agora"
    if (index === sampledHistory.length - 1) {
      label = 'Agora';
    }
    
    return {
      date: label,
      value: Math.round(value * 100) / 100,
      price: Math.round(price * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercent: parseFloat(profitPercent.toFixed(2)),
    };
  });
}

// Hook para buscar dados históricos
function useHistoricalChartData(investment: Investment, isOpen: boolean) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { usdBrlRate, displayCurrency } = useValuesVisibility();
  
  const isCompoundGrowth = COMPOUND_GROWTH_CATEGORIES.includes(investment.category);
  const hasMarketData = MARKET_DATA_CATEGORIES.includes(investment.category);
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Para categorias sem dados de mercado, gera dados compostos
    if (isCompoundGrowth) {
      const data = generateCompoundEvolutionData(
        investment.investedAmount,
        investment.currentValue,
        investment.quantity,
        investment.purchaseDate,
        investment.interestRate
      );
      setChartData(data);
      return;
    }
    
    // Para categorias com dados de mercado, busca histórico real
    if (hasMarketData && investment.ticker) {
      setIsLoading(true);
      
      const market = getMarketFromCategory(investment.category);
      const range = getRangeFromPurchaseDate(investment.purchaseDate);
      const ticker = investment.category === 'gold' ? 'GC=F' : investment.ticker;
      
      fetchHistoricalPrices(ticker, market, range)
        .then(history => {
          if (history.length > 0) {
            const isCrypto = investment.category === 'crypto';
            const isUSA = investment.category === 'usastocks' || investment.category === 'reits';
            const isGold = investment.category === 'gold';
            const multiplier = (isCrypto || isUSA) ? usdBrlRate : 1;
            
            // Para ouro, converte de onça para grama
            const goldMultiplier = isGold ? (usdBrlRate / 31.1035) : 1;
            const finalMultiplier = isGold ? goldMultiplier : multiplier;
            
            const data = convertHistoryToChartData(
              history,
              investment.quantity,
              investment.investedAmount,
              investment.purchaseDate,
              finalMultiplier
            );
            
            if (data.length > 0) {
              // Ajusta último ponto para valor atual real
              data[data.length - 1] = {
                ...data[data.length - 1],
                date: 'Agora',
                value: investment.currentValue,
                price: investment.currentPrice,
                profit: investment.profitLoss,
                profitPercent: investment.profitLossPercent
              };
              setChartData(data);
            } else {
              // Fallback para dados compostos se não houver histórico filtrado
              const fallbackData = generateCompoundEvolutionData(
                investment.investedAmount,
                investment.currentValue,
                investment.quantity,
                investment.purchaseDate
              );
              setChartData(fallbackData);
            }
          } else {
            // Fallback para dados compostos se não houver histórico
            const fallbackData = generateCompoundEvolutionData(
              investment.investedAmount,
              investment.currentValue,
              investment.quantity,
              investment.purchaseDate
            );
            setChartData(fallbackData);
          }
        })
        .catch(err => {
          console.error('Error loading historical data:', err);
          // Fallback
          const fallbackData = generateCompoundEvolutionData(
            investment.investedAmount,
            investment.currentValue,
            investment.quantity,
            investment.purchaseDate
          );
          setChartData(fallbackData);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Sem ticker, usa dados compostos
      const data = generateCompoundEvolutionData(
        investment.investedAmount,
        investment.currentValue,
        investment.quantity,
        investment.purchaseDate
      );
      setChartData(data);
    }
  }, [isOpen, investment, isCompoundGrowth, hasMarketData, usdBrlRate]);
  
  return { chartData, isLoading, hasMarketData };
}

// Componente do gráfico memoizado
const EvolutionAreaChart = memo(function EvolutionAreaChart({
  chartData,
  isPositive,
  yDomain,
  formatCurrency,
}: {
  chartData: ChartDataPoint[];
  isPositive: boolean;
  yDomain: [number, number];
  formatCurrency: (value: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <defs>
          <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop 
              offset="0%" 
              stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
              stopOpacity={0.4}
            />
            <stop 
              offset="100%" 
              stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis 
          domain={yDomain}
          hide 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'value') return [formatCurrency(value), 'Valor'];
            if (name === 'price') return [formatCurrency(value), 'Preço'];
            if (name === 'profit') return [formatCurrency(value), 'Lucro/Prejuízo'];
            if (name === 'profitPercent') return [`${value >= 0 ? '+' : ''}${value}%`, 'Rentabilidade'];
            return [value, name];
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
          strokeWidth={2.5}
          fill="url(#evolutionGradient)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export function InvestmentEvolutionChart({ 
  investment,
  isOpen,
  onClose
}: InvestmentEvolutionChartProps) {
  const { chartData, isLoading, hasMarketData } = useHistoricalChartData(investment, isOpen);
  const { displayCurrency, formatCurrencyValue, usdBrlRate } = useValuesVisibility();
  
  // Verifica se o ativo é cotado em USD
  const isUsdAsset = investment.category === 'crypto' || 
                     investment.category === 'usastocks' || 
                     investment.category === 'reits';
  
  // Converte valores de USD para BRL se necessário antes de usar o formatador global
  const convertToBrl = useCallback((value: number) => {
    if (isUsdAsset && usdBrlRate > 0) {
      return value * usdBrlRate;
    }
    return value;
  }, [isUsdAsset, usdBrlRate]);
  
  // Valores convertidos para BRL (para usar com o formatador global)
  const investedAmountBrl = convertToBrl(investment.investedAmount);
  const currentValueBrl = convertToBrl(investment.currentValue);
  
  const totalProfit = currentValueBrl - investedAmountBrl;
  const totalProfitPercent = investedAmountBrl > 0 ? (totalProfit / investedAmountBrl) * 100 : 0;
  const isPositive = totalProfit >= 0;

  // Calcula rentabilidade do ativo nos últimos 12 meses (baseado no histórico de preços)
  const annual12mReturn = useMemo(() => {
    if (chartData.length < 2) return null;
    
    // Pega o primeiro e último ponto do gráfico para calcular a variação
    // Se o histórico for maior que 12 meses, precisamos pegar aproximadamente 12 meses atrás
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];
    
    if (firstPoint.price <= 0 || lastPoint.price <= 0) return null;
    
    // Retorno percentual do período do gráfico
    const returnPercent = ((lastPoint.price - firstPoint.price) / firstPoint.price) * 100;
    return returnPercent;
  }, [chartData]);

  // Formata moeda respeitando a preferência global
  // Os valores já estão convertidos para BRL, o formatador global cuida do resto
  const formatCurrency = useCallback((value: number) => {
    return formatCurrencyValue(value);
  }, [formatCurrencyValue]);

  const formatPercent = useCallback((value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, []);

  const getPeriodText = useCallback(() => {
    if (!investment.purchaseDate) return 'Período estimado';
    const start = new Date(investment.purchaseDate);
    const now = new Date();
    const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays < 30) {
      return `${totalDays} dia${totalDays !== 1 ? 's' : ''}`;
    }
    
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mês${months !== 1 ? 'es' : ''}`;
  }, [investment.purchaseDate]);

  const yDomain = useMemo((): [number, number] => {
    if (chartData.length === 0) return [0, 100];
    
    const minValue = Math.min(...chartData.map(d => d.value));
    const maxValue = Math.max(...chartData.map(d => d.value));
    const valueRange = maxValue - minValue;
    
    // Escala absoluta para não exagerar variações pequenas
    const yMin = Math.max(0, minValue - valueRange * 0.1);
    
    return [yMin, Math.ceil(maxValue + valueRange * 0.05)];
  }, [chartData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Evolução do Investimento</span>
            {investment.ticker && (
              <span className="text-primary font-mono text-sm">({investment.ticker})</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Gráfico mostrando a evolução do valor do investimento ao longo do tempo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header com info do investimento */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="font-semibold text-card-foreground">{investment.name}</h4>
                <span className="text-xs text-muted-foreground">
                  {categoryLabels[investment.category]} • {getPeriodText()}
                  {hasMarketData && investment.ticker && (
                    <span className="ml-1 text-primary">• Dados reais</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
              <span className={cn(
                "font-mono font-medium text-lg",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {formatPercent(totalProfitPercent)}
              </span>
            </div>
          </div>

          {/* Gráfico de Evolução */}
          <div className="w-full h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
              </div>
            ) : chartData.length > 0 ? (
              <EvolutionAreaChart 
                chartData={chartData}
                isPositive={isPositive}
                yDomain={yDomain}
                formatCurrency={formatCurrency}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <span className="text-xs text-muted-foreground block mb-1">Valor Investido</span>
              <span className="font-mono text-sm text-card-foreground font-medium">
                {formatCurrency(investedAmountBrl)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-muted-foreground block mb-1">Acumulado Total</span>
              <span className="font-mono text-sm text-primary font-semibold">
                {formatCurrency(currentValueBrl)}
              </span>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              isPositive 
                ? "bg-success/10 border-success/20" 
                : "bg-destructive/10 border-destructive/20"
            )}>
              <span className="text-xs text-muted-foreground block mb-1">
                {isPositive ? 'Lucro Total' : 'Prejuízo Total'}
              </span>
              <span className={cn(
                "font-mono text-sm font-semibold",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(Math.abs(totalProfit))}
              </span>
            </div>
          </div>

          {/* Detalhes adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Quantidade</span>
              <span className="font-mono text-sm text-card-foreground">
                {investment.quantity.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Preço Médio</span>
              <span className="font-mono text-sm text-card-foreground">
                {formatCurrency(investment.averagePrice)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Preço Atual</span>
              <span className="font-mono text-sm text-card-foreground">
                {formatCurrency(investment.currentPrice)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Rent. Total</span>
              <span className={cn(
                "font-mono text-sm font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {formatPercent(totalProfitPercent)}
              </span>
            </div>
          </div>
          
          {/* Rentabilidade do Ativo no Período */}
          {annual12mReturn !== null && (
            <div className={cn(
              "p-3 rounded-lg border text-center",
              annual12mReturn >= 0 
                ? "bg-success/10 border-success/30" 
                : "bg-destructive/10 border-destructive/30"
            )}>
              <span className="text-xs text-muted-foreground block mb-1">Variação do Ativo no Período</span>
              <span className={cn(
                "font-mono text-lg font-semibold",
                annual12mReturn >= 0 ? "text-success" : "text-destructive"
              )}>
                {annual12mReturn >= 0 ? '+' : ''}{annual12mReturn.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}