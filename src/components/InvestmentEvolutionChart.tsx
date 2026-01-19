import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Investment, categoryLabels } from '@/types/investment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface InvestmentEvolutionChartProps {
  investment: Investment;
  isOpen: boolean;
  onClose: () => void;
}

interface ChartDataPoint {
  date: string;
  value: number;
  profit: number;
  profitPercent: number;
}

// Gera dados de evolução para IMÓVEIS com valorização composta
function generateRealEstateEvolutionData(
  investedAmount: number, 
  currentValue: number, 
  purchaseDate?: string,
  annualRate?: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  
  const startDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (!purchaseDate) {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  const endDate = new Date();
  const totalDays = Math.max(30, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalYears = totalDays / 365.25;
  
  // Calcula a taxa anual real baseada no valor investido e atual
  const effectiveRate = annualRate || (totalYears > 0 
    ? (Math.pow(currentValue / investedAmount, 1 / totalYears) - 1) * 100 
    : 7.73);
  
  // Define quantidade de pontos - para imóveis, 1 ponto por ano + pontos intermediários
  const years = Math.ceil(totalYears);
  const points = Math.max(12, Math.min(years * 2, 30));
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const yearsElapsed = totalYears * progress;
    
    // Valorização composta gradual - sem volatilidade para imóveis
    const value = investedAmount * Math.pow(1 + effectiveRate / 100, yearsElapsed);
    const profit = value - investedAmount;
    const profitPercent = investedAmount > 0 ? (profit / investedAmount) * 100 : 0;
    
    const pointDate = new Date(startDate.getTime() + (totalDays * progress * 24 * 60 * 60 * 1000));
    
    // Formata label baseado no período total
    let label: string;
    if (totalDays <= 365) {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
    
    data.push({
      date: label,
      value: Math.round(value * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercent: parseFloat(profitPercent.toFixed(2)),
    });
  }
  
  // Garante que o primeiro ponto seja o valor investido
  if (data.length > 0) {
    data[0].value = investedAmount;
    data[0].profit = 0;
    data[0].profitPercent = 0;
  }
  
  // Garante que o último ponto seja o valor atual
  if (data.length > 1) {
    data[data.length - 1].value = currentValue;
    data[data.length - 1].profit = currentValue - investedAmount;
    data[data.length - 1].profitPercent = investedAmount > 0 
      ? parseFloat(((currentValue - investedAmount) / investedAmount * 100).toFixed(2))
      : 0;
  }
  
  return data;
}

// Gera dados de evolução do investimento ao longo do tempo (para outros ativos)
function generateEvolutionData(
  investedAmount: number, 
  currentValue: number, 
  purchaseDate?: string
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  
  const startDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (!purchaseDate) {
    startDate.setMonth(startDate.getMonth() - 6); // Fallback: 6 meses atrás
  }
  
  const endDate = new Date();
  const totalDays = Math.max(7, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Define quantidade de pontos baseado no período
  let points: number;
  if (totalDays <= 30) {
    points = Math.min(totalDays, 15);
  } else if (totalDays <= 90) {
    points = 18;
  } else if (totalDays <= 365) {
    points = 24;
  } else if (totalDays <= 365 * 2) {
    points = 30;
  } else {
    points = 36;
  }
  
  const totalProfit = currentValue - investedAmount;
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    
    // Simula evolução do investimento com volatilidade realista
    // Começa mais estável e vai convergindo para o valor atual
    const baseGrowth = Math.pow(progress, 0.85);
    
    // Adiciona volatilidade de mercado (mais no meio, menos nas pontas)
    const volatilityFactor = Math.sin(progress * Math.PI) * 0.15;
    const randomNoise = (Math.random() - 0.5) * volatilityFactor * (1 - Math.pow(progress - 0.5, 2) * 4);
    
    const adjustedProgress = Math.max(0, Math.min(1, baseGrowth + randomNoise * 0.3));
    
    const value = investedAmount + (totalProfit * adjustedProgress);
    const profit = value - investedAmount;
    const profitPercent = investedAmount > 0 ? (profit / investedAmount) * 100 : 0;
    
    const pointDate = new Date(startDate.getTime() + (totalDays * progress * 24 * 60 * 60 * 1000));
    
    // Formata label baseado no período total
    let label: string;
    if (totalDays <= 30) {
      label = pointDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } else if (totalDays <= 365) {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    } else {
      label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }
    
    data.push({
      date: label,
      value: Math.round(value * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercent: parseFloat(profitPercent.toFixed(2)),
    });
  }
  
  // Garante que o primeiro ponto seja o valor investido
  if (data.length > 0) {
    data[0].value = investedAmount;
    data[0].profit = 0;
    data[0].profitPercent = 0;
  }
  
  // Garante que o último ponto seja o valor atual
  if (data.length > 1) {
    data[data.length - 1].value = currentValue;
    data[data.length - 1].profit = currentValue - investedAmount;
    data[data.length - 1].profitPercent = investedAmount > 0 
      ? parseFloat(((currentValue - investedAmount) / investedAmount * 100).toFixed(2))
      : 0;
  }
  
  return data;
}

export function InvestmentEvolutionChart({ 
  investment,
  isOpen,
  onClose
}: InvestmentEvolutionChartProps) {
  const isRealEstate = investment.category === 'realestate';
  
  const chartData = useMemo(() => {
    if (isRealEstate) {
      return generateRealEstateEvolutionData(
        investment.investedAmount, 
        investment.currentValue, 
        investment.purchaseDate,
        investment.interestRate
      );
    }
    return generateEvolutionData(investment.investedAmount, investment.currentValue, investment.purchaseDate);
  }, [investment.investedAmount, investment.currentValue, investment.purchaseDate, investment.interestRate, isRealEstate]);

  const totalProfit = investment.currentValue - investment.investedAmount;
  const totalProfitPercent = investment.investedAmount > 0 ? (totalProfit / investment.investedAmount) * 100 : 0;
  const isPositive = totalProfit >= 0;
  const isCrypto = investment.category === 'crypto';
  const currency = isCrypto ? 'USD' : 'BRL';

  const formatCurrency = (value: number) => {
    if (currency === 'USD') {
      return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  // Calcula período do investimento
  const getPeriodText = () => {
    if (!investment.purchaseDate) return 'Período estimado';
    const start = new Date(investment.purchaseDate);
    const now = new Date();
    const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays < 30) {
      return `${totalDays} dia${totalDays !== 1 ? 's' : ''}`;
    }
    
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mês${months !== 1 ? 'es' : ''}`;
  };

  // Calcula domínio do Y com margem
  const minValue = Math.min(...chartData.map(d => d.value));
  const maxValue = Math.max(...chartData.map(d => d.value));
  const valueRange = maxValue - minValue;
  const yDomain = [
    Math.floor(minValue - valueRange * 0.1),
    Math.ceil(maxValue + valueRange * 0.1)
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Evolução do Investimento</span>
            {investment.ticker && (
              <span className="text-primary font-mono text-sm">({investment.ticker})</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Gráfico mostrando a evolução do valor do investimento ao longo do tempo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header com info do investimento */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="font-semibold text-card-foreground">{investment.name}</h4>
                <span className="text-xs text-muted-foreground">
                  {categoryLabels[investment.category]} • {getPeriodText()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
              <span className={cn(
                "font-mono font-medium text-lg",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {formatPercent(totalProfitPercent)}
              </span>
            </div>
          </div>

          {/* Gráfico de Evolução */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <defs>
                  <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
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
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={yDomain}
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
                    if (name === 'profit') return [formatCurrency(value), 'Lucro/Prejuízo'];
                    if (name === 'profitPercent') return [`${value}%`, 'Rentabilidade'];
                    return [value, name];
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                  strokeWidth={2.5}
                  fill="url(#evolutionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <span className="text-xs text-muted-foreground block mb-1">Valor Investido</span>
              <span className="font-mono text-sm text-card-foreground font-medium">
                {formatCurrency(investment.investedAmount)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-muted-foreground block mb-1">Valor Atual</span>
              <span className="font-mono text-sm text-primary font-semibold">
                {formatCurrency(investment.currentValue)}
              </span>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              isPositive 
                ? "bg-success/10 border-success/20" 
                : "bg-destructive/10 border-destructive/20"
            )}>
              <span className="text-xs text-muted-foreground block mb-1">
                {isPositive ? 'Lucro Total' : 'Prejuízo Total'}
              </span>
              <span className={cn(
                "font-mono text-sm font-semibold",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(Math.abs(totalProfit))}
              </span>
            </div>
          </div>

          {/* Detalhes adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Quantidade</span>
              <span className="font-mono text-sm text-card-foreground">
                {investment.quantity.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Preço Médio</span>
              <span className="font-mono text-sm text-card-foreground">
                {formatCurrency(investment.averagePrice)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Preço Atual</span>
              <span className="font-mono text-sm text-card-foreground">
                {formatCurrency(investment.currentPrice)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Rentabilidade</span>
              <span className={cn(
                "font-mono text-sm font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {formatPercent(totalProfitPercent)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
