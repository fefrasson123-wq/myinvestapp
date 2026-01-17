import { useState, useEffect, useRef, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Investment, PriceHistory } from '@/types/investment';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceChartProps {
  investments: Investment[];
  period: '24h' | '1w' | '1m' | '6m' | '1y' | 'total';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getPeriodDays(period: string): number {
  switch (period) {
    case '24h':
      return 1;
    case '1w':
      return 7;
    case '1m':
      return 30;
    case '6m':
      return 180;
    case '1y':
      return 365;
    case 'total':
    default:
      return 365;
  }
}

function getYahooRange(period: string): string {
  switch (period) {
    case '24h':
      return '1d';
    case '1w':
      return '1w';
    case '1m':
      return '1mo';
    case '6m':
      return '6mo';
    case '1y':
      return '1y';
    case 'total':
    default:
      return '1y';
  }
}

// Calcula taxa diária baseada no tipo de renda fixa
function getDailyRate(investment: Investment): number {
  const annualRate = (investment.interestRate || 10) / 100;
  return Math.pow(1 + annualRate, 1/365) - 1;
}

// Calcula valor da renda fixa em um momento específico
function calculateFixedIncomeAtTime(investment: Investment, timestamp: number): number {
  const purchaseDate = investment.purchaseDate 
    ? new Date(investment.purchaseDate).getTime() 
    : investment.createdAt.getTime();
  
  if (timestamp < purchaseDate) return 0;
  
  const dailyRate = getDailyRate(investment);
  const daysElapsed = (timestamp - purchaseDate) / (1000 * 60 * 60 * 24);
  
  return investment.investedAmount * Math.pow(1 + dailyRate, daysElapsed);
}

// Tipo para histórico de preços
type HistoricalPrices = Record<string, Array<{ date: string; price: number }>>;

// Busca histórico via edge function
async function fetchHistoricalFromYahoo(
  symbols: string[],
  market: 'br' | 'usa' | 'crypto',
  range: string
): Promise<HistoricalPrices> {
  if (symbols.length === 0) return {};
  
  try {
    const { data, error } = await supabase.functions.invoke('stock-quotes', {
      body: { 
        symbols, 
        market, 
        action: 'historical',
        range
      }
    });
    
    if (error) {
      console.error('Error fetching historical:', error);
      return {};
    }
    
    return data?.history || {};
  } catch (e) {
    console.error('Error fetching historical:', e);
    return {};
  }
}

// Interpola preço para um timestamp específico usando histórico real
function getInterpolatedPrice(
  history: Array<{ date: string; price: number }>,
  timestamp: number
): number | null {
  if (!history || history.length === 0) return null;
  
  // Converte todas as datas para timestamps
  const dataPoints = history.map(h => ({
    time: new Date(h.date).getTime(),
    price: h.price
  })).sort((a, b) => a.time - b.time);
  
  // Se timestamp é antes do primeiro ponto, usa o primeiro
  if (timestamp <= dataPoints[0].time) {
    return dataPoints[0].price;
  }
  
  // Se timestamp é depois do último ponto, usa o último
  if (timestamp >= dataPoints[dataPoints.length - 1].time) {
    return dataPoints[dataPoints.length - 1].price;
  }
  
  // Encontra os dois pontos mais próximos e interpola
  for (let i = 0; i < dataPoints.length - 1; i++) {
    if (timestamp >= dataPoints[i].time && timestamp <= dataPoints[i + 1].time) {
      const t1 = dataPoints[i].time;
      const t2 = dataPoints[i + 1].time;
      const p1 = dataPoints[i].price;
      const p2 = dataPoints[i + 1].price;
      
      const progress = (timestamp - t1) / (t2 - t1);
      return p1 + (p2 - p1) * progress;
    }
  }
  
  return dataPoints[dataPoints.length - 1].price;
}

// Calcula valor do investimento usando histórico real
function calculateValueAtTime(
  investment: Investment,
  timestamp: number,
  historicalPrices: HistoricalPrices,
  usdToBrl: number
): number {
  const purchaseDate = investment.purchaseDate 
    ? new Date(investment.purchaseDate).getTime() 
    : investment.createdAt.getTime();
  
  if (timestamp < purchaseDate) return 0;
  
  const isCrypto = investment.category === 'crypto';
  const isUSA = investment.category === 'usastocks' || investment.category === 'reits';
  const isBRStock = investment.category === 'stocks' || investment.category === 'fii';
  
  // Para ativos com ticker, busca preço histórico real
  if (investment.ticker && (isCrypto || isUSA || isBRStock)) {
    const symbol = investment.ticker.toUpperCase().replace('.SA', '').replace('-USD', '');
    const history = historicalPrices[symbol];
    
    if (history && history.length > 0) {
      const price = getInterpolatedPrice(history, timestamp);
      if (price !== null) {
        const multiplier = (isCrypto || isUSA) ? usdToBrl : 1;
        return investment.quantity * price * multiplier;
      }
    }
  }
  
  // Fallback: interpolação entre valor investido e atual
  const now = Date.now();
  const totalTime = now - purchaseDate;
  
  if (totalTime <= 0) return investment.investedAmount;
  
  const elapsed = timestamp - purchaseDate;
  const progress = Math.min(1, elapsed / totalTime);
  
  const currentValue = (isCrypto || isUSA) 
    ? investment.currentValue * usdToBrl 
    : investment.currentValue;
  
  const investedAmount = (isCrypto || isUSA)
    ? investment.investedAmount * usdToBrl
    : investment.investedAmount;
  
  const totalChange = currentValue - investedAmount;
  const easedProgress = progress * progress * (3 - 2 * progress);
  
  return investedAmount + totalChange * easedProgress;
}

function useHistoricalData(investments: Investment[], period: string) {
  const { rate: usdToBrl } = useUsdBrlRate();
  const [data, setData] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const lastPeriodRef = useRef(period);
  const lastInvestmentsKeyRef = useRef('');
  
  // Create stable keys to compare investments without reference changes
  const investmentsKey = investments
    .map(inv => `${inv.id}-${inv.quantity}-${inv.currentValue}`)
    .sort()
    .join('|');
  
  const loadData = useCallback(async () => {
    if (investments.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    const days = getPeriodDays(period);
    const range = getYahooRange(period);
    
    // Separa investimentos por categoria
    const fixedIncomeCategories = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'];
    const fixedIncomeInvestments = investments.filter(inv => 
      fixedIncomeCategories.includes(inv.category)
    );
    const otherInvestments = investments.filter(inv => 
      !fixedIncomeCategories.includes(inv.category)
    );
    
    // Separa por mercado para buscar histórico
    const cryptoTickers: string[] = [];
    const usaTickers: string[] = [];
    const brTickers: string[] = [];
    
    for (const inv of otherInvestments) {
      if (inv.ticker) {
        const ticker = inv.ticker.toUpperCase().replace('.SA', '').replace('-USD', '');
        if (inv.category === 'crypto') {
          cryptoTickers.push(ticker);
        } else if (inv.category === 'usastocks' || inv.category === 'reits') {
          usaTickers.push(ticker);
        } else if (inv.category === 'stocks' || inv.category === 'fii') {
          brTickers.push(ticker);
        }
      }
    }
    
    // Busca histórico em paralelo
    const [cryptoHistory, usaHistory, brHistory] = await Promise.all([
      cryptoTickers.length > 0 ? fetchHistoricalFromYahoo(cryptoTickers, 'crypto', range) : {},
      usaTickers.length > 0 ? fetchHistoricalFromYahoo(usaTickers, 'usa', range) : {},
      brTickers.length > 0 ? fetchHistoricalFromYahoo(brTickers, 'br', range) : {}
    ]);
    
    const allHistory: HistoricalPrices = { ...cryptoHistory, ...usaHistory, ...brHistory };
    
    console.log(`Loaded historical for ${Object.keys(allHistory).length} symbols`);
    
    // Gera timestamps para o gráfico
    const numPoints = days <= 1 ? 24 : days <= 7 ? 14 : days <= 30 ? 30 : 24;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;
    const interval = (now - startTime) / (numPoints - 1);
    
    const timestamps: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      timestamps.push(startTime + i * interval);
    }
    
    // Constrói dados do gráfico
    const chartData: PriceHistory[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      let portfolioValue = 0;

      // 1. Renda fixa - calcula rendimento real baseado na taxa
      for (const inv of fixedIncomeInvestments) {
        portfolioValue += calculateFixedIncomeAtTime(inv, timestamp);
      }

      // 2. Outros investimentos - usa histórico real quando disponível
      for (const inv of otherInvestments) {
        portfolioValue += calculateValueAtTime(inv, timestamp, allHistory, usdToBrl);
      }

      // Formata data
      const date = new Date(timestamp);
      let dateStr: string;
      if (days <= 1) {
        dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else if (days <= 7) {
        dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      } else if (days <= 30) {
        dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else {
        dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      }

      chartData.push({ date: dateStr, value: portfolioValue });
    }
    
    // Garante que o último ponto tenha o valor atual correto
    const totalCurrentValue = investments.reduce((sum, inv) => {
      const isCrypto = inv.category === 'crypto';
      const isUSA = inv.category === 'usastocks' || inv.category === 'reits';
      const value = (isCrypto || isUSA) ? inv.currentValue * usdToBrl : inv.currentValue;
      return sum + value;
    }, 0);
    
    if (chartData.length > 0) {
      chartData[chartData.length - 1] = { 
        date: 'Agora', 
        value: totalCurrentValue 
      };
    }
    
    setData(chartData);
    setIsLoading(false);
    hasLoadedOnceRef.current = true;
  }, [investments, period, usdToBrl]);
  
  useEffect(() => {
    // Reset loading state when period or investments change
    const periodChanged = lastPeriodRef.current !== period;
    const investmentsChanged = lastInvestmentsKeyRef.current !== investmentsKey;
    
    if (periodChanged || investmentsChanged) {
      lastPeriodRef.current = period;
      lastInvestmentsKeyRef.current = investmentsKey;
      
      if (!hasLoadedOnceRef.current || periodChanged) {
        setIsLoading(true);
      }
    }
    
    loadData();
  }, [investmentsKey, period, loadData]);
  
  return { data, isLoading };
}

export function PerformanceChart({ investments, period }: PerformanceChartProps) {
  const { data, isLoading } = useHistoricalData(investments, period);
  
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Carregando histórico...</span>
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Adicione investimentos para ver o gráfico de patrimônio
      </div>
    );
  }

  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isPositive = lastValue >= firstValue;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const change = value - firstValue;
      const changePercent = firstValue > 0 ? ((change / firstValue) * 100) : 0;
      const changeIsPositive = change >= 0;
      
      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-muted-foreground text-sm mb-1">{label}</p>
          <p className="text-primary font-mono font-semibold text-lg">
            {formatCurrency(value)}
          </p>
          <p className={`text-sm font-mono ${changeIsPositive ? 'text-success' : 'text-destructive'}`}>
            {changeIsPositive ? '+' : ''}{formatCurrency(change)} ({changeIsPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcula domínio do Y para melhor visualização das variações
  const values = data.map(d => d.value).filter(v => v > 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || maxValue * 0.05;
  const yDomain = [Math.max(0, minValue - padding), maxValue + padding];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={65}
          domain={yDomain}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={lineColor} 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorValue)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}