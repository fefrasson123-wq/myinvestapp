import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
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

// Gera dados simulados baseados nos investimentos existentes
function generateHistoricalData(investments: Investment[], period: string): PriceHistory[] {
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  
  if (totalValue === 0) return [];
  
  const now = new Date();
  const data: PriceHistory[] = [];
  
  let points: number;
  let interval: number; // em milissegundos
  
  switch (period) {
    case '1d':
      points = 24;
      interval = 60 * 60 * 1000;
      break;
    case '1w':
      points = 7;
      interval = 24 * 60 * 60 * 1000;
      break;
    case '1m':
      points = 30;
      interval = 24 * 60 * 60 * 1000;
      break;
    case '6m':
      points = 26;
      interval = 7 * 24 * 60 * 60 * 1000;
      break;
    case '1y':
      points = 12;
      interval = 30 * 24 * 60 * 60 * 1000;
      break;
    case 'total':
      points = 24;
      interval = 30 * 24 * 60 * 60 * 1000; // 2 anos de dados
      break;
    default:
      points = 30;
      interval = 24 * 60 * 60 * 1000;
  }
  
  // Simula variação de preços ao longo do tempo
  const volatility = 0.02; // 2% de volatilidade
  let currentValue = totalInvested * 0.95; // Começa um pouco abaixo do investido
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * interval));
    const change = (Math.random() - 0.45) * volatility; // Tendência levemente positiva
    currentValue = currentValue * (1 + change);
    
    // Garante que o último ponto seja o valor atual real
    if (i === 0) {
      currentValue = totalValue;
    }
    
    let dateStr: string;
    if (period === '1d') {
      dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (period === '1w' || period === '1m') {
      dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (period === 'total') {
      dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } else {
      dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }
    
    data.push({
      date: dateStr,
      value: Math.max(0, currentValue),
    });
  }
  
  return data;
}

export function PerformanceChart({ investments, period }: PerformanceChartProps) {
  const data = useMemo(() => generateHistoricalData(investments, period), [investments, period]);
  
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Adicione investimentos para ver o gráfico de evolução
      </div>
    );
  }

  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isPositive = lastValue >= firstValue;
  const gradientColor = isPositive ? 'hsl(140, 100%, 50%)' : 'hsl(0, 72%, 51%)';
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-primary font-mono font-semibold">
            {formatCurrency(payload[0].value)}
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
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={lineColor} 
            strokeWidth={2}
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
