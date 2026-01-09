import { useMemo, useRef, useState, useEffect } from 'react';
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

async function fetchHistoricalPrices(coinId: string, days: number, vsCurrency: string = 'usd'): Promise<HistoricalPrice[]> {
  const cacheKey = `${coinId}-${days}-${vsCurrency}`;
  const now = Date.now();
  
  // Verifica cache (válido por 5 minutos)
  if (historicalCache[cacheKey] && historicalCache[cacheKey].expiry > now) {
    return historicalCache[cacheKey].data;
  }
  
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar histórico: ${response.status}`);
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
    console.error('Erro ao buscar histórico:', err);
    return [];
  }
}

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

// Calcula o valor da renda fixa em um determinado momento baseado na taxa de juros
function calculateFixedIncomeValueAtTime(
  investment: Investment, 
  timestamp: number,
  dailyRate: number
): number {
  const purchaseDate = investment.purchaseDate 
    ? new Date(investment.purchaseDate).getTime() 
    : investment.createdAt.getTime();
  
  // Se o timestamp é antes da compra, retorna 0
  if (timestamp < purchaseDate) {
    return 0;
  }
  
  const daysElapsed = (timestamp - purchaseDate) / (1000 * 60 * 60 * 24);
  const value = investment.investedAmount * Math.pow(1 + dailyRate, daysElapsed);
  
  return value;
}

// Calcula taxa diária baseada no tipo de renda fixa
function getDailyRate(investment: Investment): number {
  const annualRate = (investment.interestRate || 10) / 100;
  
  // Taxa diária = (1 + taxa anual)^(1/365) - 1
  return Math.pow(1 + annualRate, 1/365) - 1;
}

// Gera timestamps para o período
function generateTimestamps(days: number, numPoints: number): number[] {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  const timestamps: number[] = [];
  const interval = (now - startTime) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    timestamps.push(startTime + i * interval);
  }
  
  return timestamps;
}

function useHistoricalData(investments: Investment[], period: string) {
  const [data, setData] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      if (investments.length === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      const days = getPeriodDays(period);
      const numPoints = days <= 1 ? 24 : days <= 7 ? 7 : days <= 30 ? 30 : 12;
      const timestamps = generateTimestamps(days, numPoints);
      
      // Separa investimentos por categoria
      const cryptoInvestments = investments.filter(inv => inv.category === 'crypto' && inv.ticker);
      const goldInvestments = investments.filter(inv => inv.category === 'gold');
      const fixedIncomeInvestments = investments.filter(inv => 
        ['cdb', 'cdi', 'treasury', 'savings'].includes(inv.category)
      );
      const stockInvestments = investments.filter(inv => 
        ['stocks', 'fii'].includes(inv.category)
      );
      const otherInvestments = investments.filter(inv => 
        ['cash', 'realestate', 'other'].includes(inv.category)
      );
      
      // Busca dados históricos das cryptos
      const cryptoHistoryMap: Record<string, HistoricalPrice[]> = {};
      
      for (const inv of cryptoInvestments) {
        const coinId = symbolToId[inv.ticker?.toUpperCase() || ''] || inv.ticker?.toLowerCase();
        if (coinId && !cryptoHistoryMap[coinId]) {
          const history = await fetchHistoricalPrices(coinId, days, 'usd');
          if (history.length > 0) {
            cryptoHistoryMap[coinId] = history;
          }
        }
      }
      
      // Busca histórico do ouro (PAX Gold em BRL)
      let goldHistory: HistoricalPrice[] = [];
      if (goldInvestments.length > 0) {
        goldHistory = await fetchHistoricalPrices('pax-gold', days, 'brl');
      }
      
      // Constrói os dados do gráfico
      const chartData: PriceHistory[] = [];
      
      for (const timestamp of timestamps) {
        let portfolioValue = 0;
        const date = new Date(timestamp);
        
        // 1. Calcula valor das cryptos com preço histórico real
        for (const inv of cryptoInvestments) {
          const coinId = symbolToId[inv.ticker?.toUpperCase() || ''] || inv.ticker?.toLowerCase();
          const history = cryptoHistoryMap[coinId];
          
          if (history && history.length > 0) {
            // Encontra o preço mais próximo do timestamp
            const closestPrice = history.reduce((prev, curr) => {
              return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev;
            });
            
            // Só conta se a compra já foi feita
            const purchaseDate = inv.purchaseDate 
              ? new Date(inv.purchaseDate).getTime() 
              : inv.createdAt.getTime();
            
            if (timestamp >= purchaseDate) {
              portfolioValue += inv.quantity * closestPrice.price * USD_TO_BRL;
            }
          } else {
            // Fallback: usa valor atual
            const purchaseDate = inv.purchaseDate 
              ? new Date(inv.purchaseDate).getTime() 
              : inv.createdAt.getTime();
            
            if (timestamp >= purchaseDate) {
              portfolioValue += inv.currentValue * USD_TO_BRL;
            }
          }
        }
        
        // 2. Calcula valor do ouro com preço histórico real
        for (const inv of goldInvestments) {
          const purchaseDate = inv.purchaseDate 
            ? new Date(inv.purchaseDate).getTime() 
            : inv.createdAt.getTime();
          
          if (timestamp >= purchaseDate) {
            if (goldHistory.length > 0) {
              const closestPrice = goldHistory.reduce((prev, curr) => {
                return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev;
              });
              // PAX Gold = 1 onça troy, converter para gramas
              const pricePerGram = closestPrice.price / 31.1035;
              const weight = inv.weightGrams || inv.quantity;
              portfolioValue += weight * pricePerGram;
            } else {
              portfolioValue += inv.currentValue;
            }
          }
        }
        
        // 3. Calcula valor da renda fixa com evolução baseada na taxa de juros
        for (const inv of fixedIncomeInvestments) {
          const purchaseDate = inv.purchaseDate 
            ? new Date(inv.purchaseDate).getTime() 
            : inv.createdAt.getTime();
          
          if (timestamp >= purchaseDate) {
            const dailyRate = getDailyRate(inv);
            const value = calculateFixedIncomeValueAtTime(inv, timestamp, dailyRate);
            portfolioValue += value;
          }
        }
        
        // 4. Ações e FIIs - usa preço atual (sem API de histórico gratuita)
        // Simula variação baseada na diferença entre preço médio e atual
        for (const inv of stockInvestments) {
          const purchaseDate = inv.purchaseDate 
            ? new Date(inv.purchaseDate).getTime() 
            : inv.createdAt.getTime();
          
          if (timestamp >= purchaseDate) {
            const now = Date.now();
            const totalPeriod = now - purchaseDate;
            const elapsed = timestamp - purchaseDate;
            
            if (totalPeriod > 0 && elapsed > 0) {
              // Interpolação linear entre valor investido e valor atual
              const progress = elapsed / totalPeriod;
              const valueAtTime = inv.investedAmount + (inv.currentValue - inv.investedAmount) * progress;
              portfolioValue += valueAtTime;
            } else {
              portfolioValue += inv.investedAmount;
            }
          }
        }
        
        // 5. Outros investimentos (imóveis, caixa, outros) - valor constante
        for (const inv of otherInvestments) {
          const purchaseDate = inv.purchaseDate 
            ? new Date(inv.purchaseDate).getTime() 
            : inv.createdAt.getTime();
          
          if (timestamp >= purchaseDate) {
            portfolioValue += inv.currentValue;
          }
        }
        
        // Formata a data de acordo com o período
        let dateStr: string;
        if (days <= 1) {
          dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (days <= 30) {
          dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
          dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        }
        
        chartData.push({
          date: dateStr,
          value: portfolioValue
        });
      }
      
      // Adiciona o ponto atual com valores reais
      const now = new Date();
      let totalValue = 0;
      
      for (const inv of investments) {
        if (inv.category === 'crypto') {
          totalValue += inv.currentValue * USD_TO_BRL;
        } else {
          totalValue += inv.currentValue;
        }
      }
      
      const lastDateStr = days <= 1 
        ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Agora';
      
      if (chartData.length > 0 && chartData[chartData.length - 1].date !== lastDateStr) {
        chartData.push({ date: lastDateStr, value: totalValue });
      } else if (chartData.length > 0) {
        chartData[chartData.length - 1].value = totalValue;
      }
      
      setData(chartData);
      setIsLoading(false);
    }
    
    loadData();
  }, [investments, period]);
  
  return { data, isLoading };
}

export function PerformanceChart({ investments, period }: PerformanceChartProps) {
  const { data, isLoading } = useHistoricalData(investments, period);
  
  const totalValue = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
    return sum + value;
  }, 0);
  
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
            domain={['dataMin * 0.95', 'dataMax * 1.05']}
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
