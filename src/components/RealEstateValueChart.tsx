import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealEstateValueChartProps {
  purchasePrice: number;
  currentValue: number;
  purchaseDate?: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  profit: number;
  profitPercent: number;
}

// Gera dados de valorização do imóvel ao longo do tempo
function generateValueGrowthData(
  purchasePrice: number, 
  currentValue: number, 
  purchaseDate?: string
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  
  const startDate = purchaseDate ? new Date(purchaseDate) : new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // Fallback: 1 ano atrás se não tiver data
  
  const endDate = new Date();
  const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Define quantidade de pontos baseado no período
  let points: number;
  let labelFormat: 'month' | 'year';
  
  if (totalDays <= 365) {
    points = Math.min(12, totalDays); // Mensal para até 1 ano
    labelFormat = 'month';
  } else if (totalDays <= 365 * 3) {
    points = Math.min(24, Math.floor(totalDays / 30)); // A cada 2 meses para até 3 anos
    labelFormat = 'month';
  } else {
    points = Math.min(20, Math.floor(totalDays / 180)); // Semestral para períodos longos
    labelFormat = 'year';
  }
  
  points = Math.max(6, points); // Mínimo 6 pontos
  
  const totalProfit = currentValue - purchasePrice;
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    
    // Simula valorização gradual com pequenas variações
    // Imóveis tendem a valorizar de forma mais estável
    const baseGrowth = progress;
    const variation = Math.sin(progress * Math.PI * 2) * 0.02; // Pequena oscilação
    const adjustedProgress = Math.max(0, Math.min(1, baseGrowth + variation * (1 - progress)));
    
    const value = purchasePrice + (totalProfit * adjustedProgress);
    const profit = value - purchasePrice;
    const profitPercent = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;
    
    const pointDate = new Date(startDate.getTime() + (totalDays * progress * 24 * 60 * 60 * 1000));
    
    let label: string;
    if (labelFormat === 'month') {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else {
      label = pointDate.getFullYear().toString();
    }
    
    data.push({
      date: label,
      value: Math.round(value),
      profit: Math.round(profit),
      profitPercent: parseFloat(profitPercent.toFixed(2)),
    });
  }
  
  // Garante que o último ponto seja o valor atual
  if (data.length > 0) {
    data[data.length - 1].value = currentValue;
    data[data.length - 1].profit = currentValue - purchasePrice;
    data[data.length - 1].profitPercent = purchasePrice > 0 
      ? parseFloat(((currentValue - purchasePrice) / purchasePrice * 100).toFixed(2))
      : 0;
  }
  
  return data;
}

export function RealEstateValueChart({ 
  purchasePrice, 
  currentValue, 
  purchaseDate 
}: RealEstateValueChartProps) {
  const chartData = useMemo(() => 
    generateValueGrowthData(purchasePrice, currentValue, purchaseDate),
    [purchasePrice, currentValue, purchaseDate]
  );

  const totalProfit = currentValue - purchasePrice;
  const totalProfitPercent = purchasePrice > 0 ? (totalProfit / purchasePrice) * 100 : 0;
  const isPositive = totalProfit >= 0;

  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-card-foreground">Valorização do Imóvel</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className={cn(
            "w-4 h-4",
            isPositive ? "text-success" : "text-destructive"
          )} />
          <span className={cn(
            "font-mono font-medium text-sm",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {formatPercent(totalProfitPercent)}
          </span>
        </div>
      </div>

      {/* Gráfico de Valorização */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="realEstateGradient" x1="0" y1="0" x2="0" y2="1">
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
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 1000', 'dataMax + 1000']} 
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
                if (name === 'profit') return [formatCurrency(value), 'Lucro'];
                if (name === 'profitPercent') return [`${value}%`, 'Valorização'];
                return [value, name];
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
              strokeWidth={2}
              fill="url(#realEstateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
          <span className="text-xs text-muted-foreground block">Valor Inicial</span>
          <span className="font-mono text-sm text-card-foreground">{formatCurrency(purchasePrice)}</span>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-xs text-muted-foreground block">Valor Atual</span>
          <span className="font-mono text-sm text-primary font-medium">{formatCurrency(currentValue)}</span>
        </div>
        <div className={cn(
          "p-2 rounded-lg border",
          isPositive 
            ? "bg-success/10 border-success/20" 
            : "bg-destructive/10 border-destructive/20"
        )}>
          <span className="text-xs text-muted-foreground block">Lucro Total</span>
          <span className={cn(
            "font-mono text-sm font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {formatCurrency(totalProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}