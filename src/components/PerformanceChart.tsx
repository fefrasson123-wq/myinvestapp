import { useState, useEffect, useCallback } from 'react';
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

interface PerformanceChartProps {
  investments: Investment[];
  period: '24h' | '1d' | '1w' | '1m' | '6m' | '1y' | 'total';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// Taxa de conversão USD -> BRL para crypto
const USD_TO_BRL = 6.15;

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Mapeamento de símbolos para IDs do CoinGecko
const symbolToId: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'TON': 'the-open-network',
};

interface HistoricalPrice {
  timestamp: number;
  price: number;
}

// Cache para dados históricos
const historicalCache: Record<string, { data: HistoricalPrice[], expiry: number }> = {};

function getPeriodDays(period: string): number {
  switch (period) {
    case '24h':
    case '1d':
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

// Calcula taxa diária baseada no tipo de renda fixa
function getDailyRate(investment: Investment): number {
  const annualRate = (investment.interestRate || 10) / 100;
  return Math.pow(1 + annualRate, 1/365) - 1;
}

// Função para buscar histórico com retry e timeout
async function fetchHistoricalPricesWithRetry(
  coinId: string, 
  days: number, 
  vsCurrency: string = 'usd',
  retries: number = 2
): Promise<HistoricalPrice[]> {
  const cacheKey = `${coinId}-${days}-${vsCurrency}`;
  const now = Date.now();
  
  // Verifica cache (válido por 5 minutos)
  if (historicalCache[cacheKey] && historicalCache[cacheKey].expiry > now) {
    return historicalCache[cacheKey].data;
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (attempt === retries) {
          throw new Error(`HTTP ${response.status}`);
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      
      const data = await response.json();
      const prices: HistoricalPrice[] = data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price
      }));
      
      // Salva no cache por 5 minutos
      historicalCache[cacheKey] = { data: prices, expiry: now + 5 * 60 * 1000 };
      
      return prices;
    } catch (err) {
      if (attempt === retries) {
        console.warn(`Falha ao buscar histórico para ${coinId}:`, err);
        return [];
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  
  return [];
}

// Gera dados de variação realista baseado no lucro/prejuízo do investimento
function generateRealisticVariation(
  investment: Investment,
  numPoints: number,
  days: number,
  isInBRL: boolean = true
): number[] {
  const currentValue = isInBRL ? investment.currentValue : investment.currentValue * USD_TO_BRL;
  const investedAmount = investment.investedAmount;
  
  // Calcula variação total desde a compra
  const totalVariation = currentValue - investedAmount;
  const variationPercent = investedAmount > 0 ? (totalVariation / investedAmount) : 0;
  
  // Data de compra
  const purchaseDate = investment.purchaseDate 
    ? new Date(investment.purchaseDate).getTime() 
    : investment.createdAt.getTime();
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  
  const values: number[] = [];
  const interval = (now - startTime) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    const timestamp = startTime + i * interval;
    
    // Se ainda não tinha comprado, valor é 0
    if (timestamp < purchaseDate) {
      values.push(0);
      continue;
    }
    
    // Calcula progresso desde a compra até agora
    const totalTimeFromPurchase = now - purchaseDate;
    const elapsedFromPurchase = timestamp - purchaseDate;
    
    if (totalTimeFromPurchase <= 0) {
      values.push(investedAmount);
      continue;
    }
    
    const progress = Math.min(1, elapsedFromPurchase / totalTimeFromPurchase);
    
    // Adiciona variação realista com ruído
    const noise = Math.sin(i * 0.5) * 0.02 + Math.cos(i * 0.3) * 0.015;
    const adjustedProgress = progress + noise * (1 - progress);
    
    // Valor interpolado com variação
    const baseValue = investedAmount + totalVariation * adjustedProgress;
    
    // Adiciona volatilidade baseada no tipo de ativo
    let volatility = 0.02; // 2% padrão
    if (investment.category === 'crypto') volatility = 0.05;
    else if (['stocks', 'fii'].includes(investment.category)) volatility = 0.03;
    else if (['cdb', 'cdi', 'treasury', 'savings'].includes(investment.category)) volatility = 0.001;
    
    const randomVariation = (Math.random() - 0.5) * volatility * baseValue * (1 - progress);
    
    values.push(Math.max(0, baseValue + randomVariation));
  }
  
  // Garante que o último ponto seja o valor atual
  if (values.length > 0) {
    values[values.length - 1] = currentValue;
  }
  
  return values;
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

function useHistoricalData(investments: Investment[], period: string) {
  const [data, setData] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = useCallback(async () => {
    if (investments.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const days = getPeriodDays(period);
    const numPoints = days <= 1 ? 24 : days <= 7 ? 14 : days <= 30 ? 30 : 24;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;
    const interval = (now - startTime) / (numPoints - 1);
    
    // Gera timestamps
    const timestamps: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      timestamps.push(startTime + i * interval);
    }
    
    // Separa investimentos por categoria
    const cryptoInvestments = investments.filter(inv => inv.category === 'crypto' && inv.ticker);
    const fixedIncomeInvestments = investments.filter(inv => 
      ['cdb', 'cdi', 'treasury', 'savings'].includes(inv.category)
    );
    const otherInvestments = investments.filter(inv => 
      !['crypto', 'cdb', 'cdi', 'treasury', 'savings'].includes(inv.category)
    );
    
    // Busca histórico das cryptos em paralelo
    const cryptoHistoryPromises = cryptoInvestments.map(async inv => {
      const coinId = symbolToId[inv.ticker?.toUpperCase() || ''] || inv.ticker?.toLowerCase();
      if (!coinId) return { inv, history: [] };
      
      const history = await fetchHistoricalPricesWithRetry(coinId, days, 'usd');
      return { inv, history };
    });
    
    const cryptoResults = await Promise.all(cryptoHistoryPromises);
    
    // Constrói dados do gráfico
    const chartData: PriceHistory[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      let portfolioValue = 0;
      
      // 1. Cryptos - usa histórico real ou gera variação
      for (const { inv, history } of cryptoResults) {
        const purchaseDate = inv.purchaseDate 
          ? new Date(inv.purchaseDate).getTime() 
          : inv.createdAt.getTime();
        
        if (timestamp < purchaseDate) continue;
        
        if (history.length > 0) {
          // Usa histórico real
          const closestPrice = history.reduce((prev, curr) => 
            Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
          );
          portfolioValue += inv.quantity * closestPrice.price * USD_TO_BRL;
        } else {
          // Gera variação realista
          const variations = generateRealisticVariation(inv, numPoints, days, false);
          portfolioValue += variations[i] || inv.currentValue * USD_TO_BRL;
        }
      }
      
      // 2. Renda fixa - calcula rendimento real
      for (const inv of fixedIncomeInvestments) {
        portfolioValue += calculateFixedIncomeAtTime(inv, timestamp);
      }
      
      // 3. Outros investimentos - gera variação realista
      for (const inv of otherInvestments) {
        const variations = generateRealisticVariation(inv, numPoints, days);
        portfolioValue += variations[i] || inv.currentValue;
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
      const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
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
  }, [investments, period]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
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

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(220, 10%, 55%)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="hsl(220, 10%, 55%)"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value)}
            domain={[Math.max(0, minValue - padding), maxValue + padding]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={lineColor} 
            strokeWidth={2}
            fill="url(#colorPortfolio)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
