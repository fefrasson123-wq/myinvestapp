import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealEstateValueChartProps {
  purchasePrice: number;
  currentValue: number;
  purchaseDate?: string;
  expanded?: boolean; // Para exibir gráfico maior no Dashboard
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
  purchaseDate?: string,
  expanded?: boolean
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  
  const startDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (!purchaseDate) {
    startDate.setFullYear(startDate.getFullYear() - 2); // Fallback: 2 anos atrás se não tiver data
  }
  
  const endDate = new Date();
  const totalDays = Math.max(30, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Define quantidade de pontos baseado no período e se é expandido
  let points: number;
  
  if (expanded) {
    // Mais pontos para gráfico expandido
    if (totalDays <= 365) {
      points = 24; // Quinzenal para 1 ano
    } else if (totalDays <= 365 * 2) {
      points = 24; // Mensal para 2 anos
    } else if (totalDays <= 365 * 5) {
      points = 30; // Bimestral para 5 anos
    } else {
      points = 36; // Trimestral para períodos longos
    }
  } else {
    if (totalDays <= 365) {
      points = 12;
    } else if (totalDays <= 365 * 3) {
      points = 18;
    } else {
      points = 24;
    }
  }
  
  const totalProfit = currentValue - purchasePrice;
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    
    // Simula valorização gradual realista do imóvel
    // Usa uma curva logarítmica suave para simular valorização mais intensa no início
    // e mais estável depois, típico de imóveis
    const baseGrowth = Math.pow(progress, 0.9); // Curva suave
    
    // Adiciona pequenas variações sazonais (típicas do mercado imobiliário)
    const seasonalVariation = Math.sin(progress * Math.PI * 4) * 0.008;
    const marketNoise = (Math.random() - 0.5) * 0.005 * (1 - progress); // Mais ruído no início
    
    const adjustedProgress = Math.max(0, Math.min(1, baseGrowth + seasonalVariation + marketNoise));
    
    const value = purchasePrice + (totalProfit * adjustedProgress);
    const profit = value - purchasePrice;
    const profitPercent = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;
    
    const pointDate = new Date(startDate.getTime() + (totalDays * progress * 24 * 60 * 60 * 1000));
    
    // Formata label baseado no período total
    let label: string;
    if (totalDays <= 365) {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else if (totalDays <= 365 * 3) {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else {
      // Para períodos longos, mostra mês/ano a cada 6 meses
      const month = pointDate.getMonth();
      if (month === 0 || month === 6 || i === 0 || i === points) {
        label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      } else {
        label = pointDate.toLocaleDateString('pt-BR', { month: 'short' });
      }
    }
    
    data.push({
      date: label,
      value: Math.round(value),
      profit: Math.round(profit),
      profitPercent: parseFloat(profitPercent.toFixed(2)),
    });
  }
  
  // Garante que o primeiro ponto seja o valor de compra
  if (data.length > 0) {
    data[0].value = purchasePrice;
    data[0].profit = 0;
    data[0].profitPercent = 0;
  }
  
  // Garante que o último ponto seja o valor atual
  if (data.length > 1) {
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
  purchaseDate,
  expanded = false // Por padrão compacto para lista de investimentos
}: RealEstateValueChartProps) {
  const chartData = useMemo(() => 
    generateValueGrowthData(purchasePrice, currentValue, purchaseDate, expanded),
    [purchasePrice, currentValue, purchaseDate, expanded]
  );

  const totalProfit = currentValue - purchasePrice;
  const totalProfitPercent = purchasePrice > 0 ? (totalProfit / purchasePrice) * 100 : 0;
  const isPositive = totalProfit >= 0;

  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  // Calcula período do investimento
  const getPeriodText = () => {
    if (!purchaseDate) return 'Período estimado';
    const start = new Date(purchaseDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12);
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mês${months !== 1 ? 'es' : ''}`;
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-card-foreground">Valorização do Imóvel</span>
          <span className="text-xs text-muted-foreground">({getPeriodText()})</span>
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

      {/* Gráfico de Valorização - Altura maior para melhor visualização */}
      <div className={cn("w-full", expanded ? "h-48" : "h-24")}>
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