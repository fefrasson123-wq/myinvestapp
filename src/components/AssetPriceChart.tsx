import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetPriceChartProps {
  symbol: string;
  currentPrice: number;
  change24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
  currency?: 'BRL' | 'USD';
}

interface ChartDataPoint {
  time: string;
  price: number;
}

// Gera dados simulados de variação 24h baseado no preço atual
function generate24hData(currentPrice: number, changePercent: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const hours = 24;
  const basePrice = currentPrice / (1 + changePercent / 100);
  
  for (let i = 0; i <= hours; i++) {
    const progress = i / hours;
    // Simula volatilidade com movimento em direção ao preço atual
    const randomVariation = (Math.random() - 0.5) * (currentPrice * 0.02);
    const trendPrice = basePrice + (currentPrice - basePrice) * progress;
    const price = trendPrice + randomVariation * (1 - progress * 0.5);
    
    const time = new Date();
    time.setHours(time.getHours() - (hours - i));
    
    data.push({
      time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      price: Math.max(0, price),
    });
  }
  
  // Garante que o último ponto seja o preço atual
  data[data.length - 1].price = currentPrice;
  
  return data;
}

export function AssetPriceChart({ 
  symbol, 
  currentPrice, 
  change24h = 0, 
  changePercent24h = 0,
  high24h: propHigh24h,
  low24h: propLow24h,
  currency = 'BRL' 
}: AssetPriceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  const isPositive = changePercent24h >= 0;
  const formatPrice = (value: number) => {
    if (currency === 'USD') {
      return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Use props if provided, otherwise calculate from chart data
  const high24h = propHigh24h ?? (chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : currentPrice);
  const low24h = propLow24h ?? (chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : currentPrice);

  useEffect(() => {
    const data = generate24hData(currentPrice, changePercent24h);
    setChartData(data);
    // Debug: helps verify render + data generation in production logs
    // eslint-disable-next-line no-console
    console.debug('[AssetPriceChart]', { symbol, currentPrice, changePercent24h, points: data.length });
  }, [symbol, currentPrice, changePercent24h]);

  const openPrice = chartData.length > 0 ? chartData[0].price : currentPrice;

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
      {/* Header com variação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-card-foreground">Variação 24h</span>
        </div>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-destructive" />
          )}
          <span className={cn(
            "font-mono font-medium text-sm",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? '+' : ''}{changePercent24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="100%" 
                  stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              hide 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']} 
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
              formatter={(value: number) => [formatPrice(value), 'Preço']}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <ReferenceLine 
              y={openPrice} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
              strokeWidth={2}
              dot={false}
              fill={`url(#gradient-${symbol})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info de Alta/Baixa */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <span className="text-xs text-muted-foreground block">Mínima 24h</span>
          <span className="font-mono text-sm text-destructive">{formatPrice(low24h)}</span>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-xs text-muted-foreground block">Atual</span>
          <span className="font-mono text-sm text-primary font-medium">{formatPrice(currentPrice)}</span>
        </div>
        <div className="p-2 rounded-lg bg-success/10 border border-success/20">
          <span className="text-xs text-muted-foreground block">Máxima 24h</span>
          <span className="font-mono text-sm text-success">{formatPrice(high24h)}</span>
        </div>
      </div>
    </div>
  );
}
