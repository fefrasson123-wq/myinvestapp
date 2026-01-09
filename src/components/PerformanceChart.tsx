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

async function fetchHistoricalPrices(coinId: string, days: number): Promise<HistoricalPrice[]> {
  const cacheKey = `${coinId}-${days}`;
  const now = Date.now();
  
  // Verifica cache (válido por 5 minutos)
  if (historicalCache[cacheKey] && historicalCache[cacheKey].expiry > now) {
    return historicalCache[cacheKey].data;
  }
  
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
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
      
      // Busca histórico para cada crypto
      const cryptoInvestments = investments.filter(inv => inv.category === 'crypto' && inv.ticker);
      const otherInvestments = investments.filter(inv => inv.category !== 'crypto');
      
      // Valor total dos investimentos não-crypto (constante no gráfico)
      const otherValue = otherInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
      
      // Busca dados históricos das cryptos
      const historicalDataMap: Record<string, HistoricalPrice[]> = {};
      
      for (const inv of cryptoInvestments) {
        const coinId = symbolToId[inv.ticker?.toUpperCase() || ''] || inv.ticker?.toLowerCase();
        if (coinId && !historicalDataMap[coinId]) {
          const history = await fetchHistoricalPrices(coinId, days);
          if (history.length > 0) {
            historicalDataMap[coinId] = history;
          }
        }
      }
      
      // Se não conseguiu buscar dados históricos, usa fallback
      if (Object.keys(historicalDataMap).length === 0 && cryptoInvestments.length > 0) {
        // Fallback: gera dados simulados baseados no valor atual
        const totalValue = investments.reduce((sum, inv) => {
          const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
          return sum + value;
        }, 0);
        
        const points = days <= 1 ? 24 : days <= 7 ? 7 : days <= 30 ? 30 : 12;
        const fallbackData: PriceHistory[] = [];
        const now = Date.now();
        const interval = (days * 24 * 60 * 60 * 1000) / points;
        
        for (let i = 0; i < points; i++) {
          const timestamp = now - (points - i - 1) * interval;
          const date = new Date(timestamp);
          
          let dateStr: string;
          if (days <= 1) {
            dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          } else if (days <= 30) {
            dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          } else {
            dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          }
          
          fallbackData.push({ date: dateStr, value: totalValue });
        }
        
        setData(fallbackData);
        setIsLoading(false);
        return;
      }
      
      // Pega o primeiro histórico para usar como base de timestamps
      const firstHistory = Object.values(historicalDataMap)[0] || [];
      if (firstHistory.length === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      // Reduz o número de pontos para melhor visualização
      const maxPoints = days <= 1 ? 24 : days <= 7 ? 7 : days <= 30 ? 30 : 12;
      const step = Math.max(1, Math.floor(firstHistory.length / maxPoints));
      
      const chartData: PriceHistory[] = [];
      
      for (let i = 0; i < firstHistory.length; i += step) {
        const timestamp = firstHistory[i].timestamp;
        const date = new Date(timestamp);
        
        // Calcula o valor total do portfolio nesse momento
        let portfolioValue = otherValue; // Investimentos não-crypto
        
        for (const inv of cryptoInvestments) {
          const coinId = symbolToId[inv.ticker?.toUpperCase() || ''] || inv.ticker?.toLowerCase();
          const history = historicalDataMap[coinId];
          
          if (history) {
            // Encontra o preço mais próximo do timestamp
            const closestPrice = history.reduce((prev, curr) => {
              return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev;
            });
            
            // Valor = quantidade * preço histórico * conversão USD->BRL
            portfolioValue += inv.quantity * closestPrice.price * USD_TO_BRL;
          } else {
            // Fallback: usa valor atual
            portfolioValue += inv.currentValue * USD_TO_BRL;
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
      
      // Adiciona o ponto atual
      const now = new Date();
      const totalValue = investments.reduce((sum, inv) => {
        const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
        return sum + value;
      }, 0);
      
      const lastDateStr = days <= 1 
        ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Agora';
      
      if (chartData.length === 0 || chartData[chartData.length - 1].date !== lastDateStr) {
        chartData.push({ date: lastDateStr, value: totalValue });
      } else {
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
