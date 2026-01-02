import { useMemo, useRef } from 'react';
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
  period: '1d' | '1w' | '1m' | '6m' | '1y' | 'total';
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

// Gera dados de evolução do patrimônio total ao longo do tempo
function generatePortfolioHistory(investments: Investment[], period: string, cacheRef: React.MutableRefObject<{key: string, data: PriceHistory[]}>): PriceHistory[] {
  if (investments.length === 0) return [];
  
  // Calcula valores totais convertendo crypto para BRL
  const totalValue = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
    return sum + value;
  }, 0);
  
  const totalInvested = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.investedAmount * USD_TO_BRL : inv.investedAmount;
    return sum + value;
  }, 0);
  
  // Cria uma chave única baseada nos dados dos investimentos
  const investmentKey = `portfolio-${period}-${investments.length}-${totalValue.toFixed(2)}-${totalInvested.toFixed(2)}`;
  
  // Se já temos dados em cache para essa chave, retorna o cache
  if (cacheRef.current.key === investmentKey) {
    const cachedData = [...cacheRef.current.data];
    if (cachedData.length > 0) {
      cachedData[cachedData.length - 1] = { ...cachedData[cachedData.length - 1], value: totalValue };
    }
    return cachedData;
  }
  
  const now = new Date();
  const data: PriceHistory[] = [];
  
  // Encontra a data mais antiga de investimento
  const oldestDate = investments.reduce((oldest, inv) => {
    const invDate = inv.purchaseDate ? new Date(inv.purchaseDate) : inv.createdAt;
    return invDate < oldest ? invDate : oldest;
  }, now);
  
  // Calcula o período total desde o primeiro investimento
  const totalDays = Math.max(1, (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let points: number;
  let interval: number;
  let startDate: Date;
  
  switch (period) {
    case '1d':
      points = 24;
      interval = 60 * 60 * 1000;
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '1w':
      points = 7;
      interval = 24 * 60 * 60 * 1000;
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1m':
      points = 30;
      interval = 24 * 60 * 60 * 1000;
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '6m':
      points = 26;
      interval = 7 * 24 * 60 * 60 * 1000;
      startDate = new Date(now.getTime() - 182 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      points = 12;
      interval = 30 * 24 * 60 * 60 * 1000;
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'total':
    default:
      // Para 'total', usa o período desde o primeiro investimento
      const daysSinceFirst = Math.ceil(totalDays);
      if (daysSinceFirst <= 30) {
        points = daysSinceFirst || 1;
        interval = 24 * 60 * 60 * 1000;
      } else if (daysSinceFirst <= 180) {
        points = Math.ceil(daysSinceFirst / 7);
        interval = 7 * 24 * 60 * 60 * 1000;
      } else {
        points = Math.ceil(daysSinceFirst / 30);
        interval = 30 * 24 * 60 * 60 * 1000;
      }
      startDate = oldestDate;
      break;
  }
  
  // Gera os pontos de dados
  for (let i = 0; i < points; i++) {
    const date = new Date(startDate.getTime() + (i * interval));
    
    // Não gera pontos no futuro
    if (date > now) break;
    
    // Calcula o patrimônio total nessa data
    let portfolioAtDate = 0;
    
    investments.forEach(inv => {
      const purchaseDate = inv.purchaseDate ? new Date(inv.purchaseDate) : inv.createdAt;
      
      // Se o investimento já existia nessa data
      if (purchaseDate <= date) {
        const investedAmount = inv.category === 'crypto' ? inv.investedAmount * USD_TO_BRL : inv.investedAmount;
        const currentValue = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
        const profitLoss = currentValue - investedAmount;
        
        // Calcula quanto tempo passou desde a compra até a data atual
        const totalInvDays = Math.max(1, (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        // Quanto tempo passou desde a compra até o ponto do gráfico
        const daysAtPoint = Math.max(0, (date.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Proporção do lucro/prejuízo acumulado até esse ponto
        const profitRatio = Math.min(1, daysAtPoint / totalInvDays);
        
        // Valor do investimento nesse ponto = valor investido + lucro proporcional
        const valueAtPoint = investedAmount + (profitLoss * profitRatio);
        
        portfolioAtDate += valueAtPoint;
      }
    });
    
    let dateStr: string;
    if (period === '1d') {
      dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (period === '1w' || period === '1m') {
      dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (period === 'total' && totalDays > 365) {
      dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } else {
      dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }
    
    data.push({
      date: dateStr,
      value: portfolioAtDate,
    });
  }
  
  // Adiciona o ponto atual se o último ponto não for o valor atual
  if (data.length > 0) {
    const lastDate = data[data.length - 1].date;
    const nowStr = period === '1d' 
      ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    if (lastDate !== nowStr) {
      data.push({
        date: 'Agora',
        value: totalValue,
      });
    } else {
      data[data.length - 1].value = totalValue;
    }
  }
  
  // Salva no cache
  cacheRef.current = { key: investmentKey, data };
  
  return data;
}

export function PerformanceChart({ investments, period }: PerformanceChartProps) {
  const cacheRef = useRef<{key: string, data: PriceHistory[]}>({ key: '', data: [] });
  
  const totalValue = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
    return sum + value;
  }, 0);
  const totalInvested = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.investedAmount * USD_TO_BRL : inv.investedAmount;
    return sum + value;
  }, 0);
  
  const data = useMemo(() => 
    generatePortfolioHistory(investments, period, cacheRef), 
    [investments, period, totalValue, totalInvested]
  );
  
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
