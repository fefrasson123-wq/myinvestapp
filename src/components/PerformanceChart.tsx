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

// Gera dados baseados nos investimentos reais - mostra evolução do lucro/prejuízo
function generateHistoricalData(investments: Investment[], period: string, cacheRef: React.MutableRefObject<{key: string, data: PriceHistory[]}>): PriceHistory[] {
  // Calcula valores totais convertendo crypto para BRL
  const totalValue = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
    return sum + value;
  }, 0);
  
  const totalInvested = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.investedAmount * USD_TO_BRL : inv.investedAmount;
    return sum + value;
  }, 0);
  
  const totalProfitLoss = totalValue - totalInvested;
  
  if (investments.length === 0) return [];
  
  // Cria uma chave única baseada nos dados dos investimentos
  const investmentKey = `${period}-${investments.length}-${totalValue.toFixed(2)}-${totalInvested.toFixed(2)}-${totalProfitLoss.toFixed(2)}`;
  
  // Se já temos dados em cache para essa chave, retorna o cache
  if (cacheRef.current.key === investmentKey) {
    // Atualiza o último ponto com o valor atual real
    const cachedData = [...cacheRef.current.data];
    if (cachedData.length > 0) {
      cachedData[cachedData.length - 1] = { ...cachedData[cachedData.length - 1], value: totalProfitLoss };
    }
    return cachedData;
  }
  
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
      interval = 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      points = 30;
      interval = 24 * 60 * 60 * 1000;
  }
  
  // Calcula o lucro/prejuízo por investimento considerando a data de compra
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * interval));
    
    // Calcula o lucro acumulado até essa data
    let profitAtDate = 0;
    
    investments.forEach(inv => {
      const purchaseDate = inv.purchaseDate ? new Date(inv.purchaseDate) : inv.createdAt;
      
      // Se o investimento já existia nessa data
      if (purchaseDate <= date) {
        // Calcula quanto tempo passou desde a compra até a data do ponto
        const totalDays = Math.max(1, (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysAtPoint = Math.max(0, (date.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Proporção do lucro atual que corresponde a esse ponto no tempo
        const profitRatio = Math.min(1, daysAtPoint / totalDays);
        
        // Lucro proporcional (convertendo crypto para BRL)
        const invProfitLoss = inv.category === 'crypto' ? inv.profitLoss * USD_TO_BRL : inv.profitLoss;
        
        // Se é o ponto atual (i === 0), usa o lucro real
        if (i === 0) {
          profitAtDate += invProfitLoss;
        } else {
          // Para pontos passados, calcula proporcionalmente
          profitAtDate += invProfitLoss * profitRatio;
        }
      }
    });
    
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
      value: profitAtDate,
    });
  }
  
  // Salva no cache
  cacheRef.current = { key: investmentKey, data };
  
  return data;
}

export function PerformanceChart({ investments, period }: PerformanceChartProps) {
  // Cache para evitar regeneração desnecessária dos dados históricos
  const cacheRef = useRef<{key: string, data: PriceHistory[]}>({ key: '', data: [] });
  
  // Calcula o valor total atual para forçar atualização quando preços mudam
  const totalValue = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.currentValue * USD_TO_BRL : inv.currentValue;
    return sum + value;
  }, 0);
  const totalInvested = investments.reduce((sum, inv) => {
    const value = inv.category === 'crypto' ? inv.investedAmount * USD_TO_BRL : inv.investedAmount;
    return sum + value;
  }, 0);
  const totalProfitLoss = totalValue - totalInvested;
  
  const data = useMemo(() => 
    generateHistoricalData(investments, period, cacheRef), 
    [investments, period, totalValue, totalInvested, totalProfitLoss]
  );
  
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
