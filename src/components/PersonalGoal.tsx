import { useState, useMemo } from 'react';
import { Target, Check, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePersonalGoal } from '@/hooks/usePersonalGoal';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Transaction } from '@/types/investment';

interface PersonalGoalProps {
  currentPortfolioValue: number;
  totalInvestedAmount: number;
  transactions?: Transaction[];
  className?: string;
}

export function PersonalGoal({ currentPortfolioValue, totalInvestedAmount, transactions = [], className }: PersonalGoalProps) {
  const { goal, isLoading, saveGoal, deleteGoal } = usePersonalGoal();
  const { showValues } = useValuesVisibility();
  const { toast } = useToast();
  const [targetAmount, setTargetAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    if (!showValues) return '•••••';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatCompact = (value: number) => {
    if (!showValues) return '•••';
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace('.', ',')}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toFixed(0);
  };

  const parsePtBrNumber = (value: string) => {
    // Accepts: "200", "200,50", "200.000", "200.000,50"
    const cleaned = value
      .replace(/\s/g, '')
      .replace(/R\$/gi, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleSave = async () => {
    const amount = parsePtBrNumber(targetAmount);
    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Digite um valor válido para a meta.',
      });
      return;
    }

    const result = await saveGoal({
      name: goalName || 'Meta Principal',
      target_amount: amount,
    });

    if (result) {
      toast({
        title: goal ? 'Meta atualizada' : 'Meta criada',
        description: `Sua meta de ${formatCurrency(amount)} foi salva.`,
      });
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    await deleteGoal();
    toast({
      title: 'Meta removida',
      description: 'Sua meta foi excluída.',
    });
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetAmount(e.target.value);
  };

  const openEditDialog = () => {
    if (goal) {
      setGoalName(goal.name);
      setTargetAmount(
        goal.target_amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setGoalName('');
      setTargetAmount('');
    }
    setIsDialogOpen(true);
  };

  // Calculate average monthly contribution rate and annual return from transactions
  const projectionData = useMemo(() => {
    const inputTargetAmount = parsePtBrNumber(targetAmount);
    const targetToUse = inputTargetAmount > 0 ? inputTargetAmount : (goal?.target_amount || 0);
    
    if (targetToUse <= 0 || currentPortfolioValue <= 0) {
      return { monthlyRate: 0, annualReturnRate: 0, monthsToGoal: null, estimatedDate: null };
    }

    // Calculate annual return rate from portfolio performance
    // (currentValue - totalInvested) / totalInvested = total return
    // Then annualize based on how long the user has been investing
    let annualReturnRate = 0;
    
    if (totalInvestedAmount > 0 && currentPortfolioValue > totalInvestedAmount) {
      const totalReturn = (currentPortfolioValue - totalInvestedAmount) / totalInvestedAmount;
      
      // Find the oldest transaction to calculate investment period
      const sortedTx = [...transactions].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      if (sortedTx.length > 0) {
        const oldestDate = new Date(sortedTx[0].date);
        const now = new Date();
        const yearsInvesting = Math.max(0.5, (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
        
        // Annualized return: (1 + totalReturn)^(1/years) - 1
        annualReturnRate = Math.pow(1 + totalReturn, 1 / yearsInvesting) - 1;
        
        // Cap at reasonable bounds (0% to 50% annual)
        annualReturnRate = Math.max(0, Math.min(0.5, annualReturnRate));
      }
    }

    // Filter only buy transactions in the last 12 months
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    const recentBuys = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.type === 'buy' && txDate >= oneYearAgo && txDate <= now;
    });

    if (recentBuys.length === 0) {
      return { monthlyRate: 0, annualReturnRate, monthsToGoal: null, estimatedDate: null };
    }

    // Calculate total invested in the period (robust against bad/legacy data)
    const investedValues = recentBuys
      .map(tx => Number(tx.total))
      .filter(v => Number.isFinite(v) && v > 0);

    if (investedValues.length === 0) {
      return { monthlyRate: 0, annualReturnRate, monthsToGoal: null, estimatedDate: null };
    }

    const totalInvested = investedValues.reduce((sum, v) => sum + v, 0);

    // Use distinct months in the last 12 months to avoid inflated rates when there's only 1 recent transaction
    const monthsCount = Math.min(
      12,
      Math.max(
        1,
        new Set(
          recentBuys.map(tx => {
            const d = new Date(tx.date);
            return `${d.getFullYear()}-${d.getMonth()}`;
          })
        ).size
      )
    );

    const monthlyRate = totalInvested / monthsCount;
    
    // Calculate months to reach goal considering compound returns
    const remaining = targetToUse - currentPortfolioValue;
    if (remaining <= 0) {
      return { monthlyRate, annualReturnRate, monthsToGoal: 0, estimatedDate: now };
    }
    
    // Monthly return rate from annual
    const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;
    
    // Simulate month by month to find when goal is reached
    // Formula: FV = PV * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
    // We solve iteratively since it's cleaner
    let projectedValue = currentPortfolioValue;
    let months = 0;
    const maxMonths = 600; // 50 years cap
    
    while (projectedValue < targetToUse && months < maxMonths) {
      // Apply monthly return to current value
      projectedValue = projectedValue * (1 + monthlyReturnRate) + monthlyRate;
      months++;
    }
    
    if (months >= maxMonths) {
      return { monthlyRate, annualReturnRate, monthsToGoal: null, estimatedDate: null };
    }
    
    const estimatedDate = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);
    
    return { monthlyRate, annualReturnRate, monthsToGoal: months, estimatedDate };
  }, [transactions, targetAmount, goal, currentPortfolioValue, totalInvestedAmount]);

  // Generate chart data for goal progression with two projection lines
  const chartData = useMemo(() => {
    const inputTargetAmount = parsePtBrNumber(targetAmount);
    const targetToUse = inputTargetAmount > 0 ? inputTargetAmount : (goal?.target_amount || 0);
    
    if (targetToUse <= 0 || currentPortfolioValue <= 0) return [];

    const { monthlyRate, annualReturnRate } = projectionData;
    
    // If no monthly rate, just show current progress
    if (monthlyRate <= 0) {
      return [
        { name: 'Início', current: 0, onlyContributions: 0, withReturns: 0 },
        { name: 'Hoje', current: currentPortfolioValue, onlyContributions: currentPortfolioValue, withReturns: currentPortfolioValue },
      ];
    }

    const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;
    
    // Calculate months needed for each scenario
    let monthsOnlyContributions = 0;
    let monthsWithReturns = 0;
    let valueOnlyContributions = currentPortfolioValue;
    let valueWithReturns = currentPortfolioValue;
    const maxMonths = 600;
    
    // Calculate for only contributions (no returns)
    while (valueOnlyContributions < targetToUse && monthsOnlyContributions < maxMonths) {
      valueOnlyContributions += monthlyRate;
      monthsOnlyContributions++;
    }
    
    // Calculate with contributions + returns
    while (valueWithReturns < targetToUse && monthsWithReturns < maxMonths) {
      valueWithReturns = valueWithReturns * (1 + monthlyReturnRate) + monthlyRate;
      monthsWithReturns++;
    }
    
    // Determine the longest timeline to show
    const maxMonthsToShow = Math.min(Math.max(monthsOnlyContributions, monthsWithReturns) + 3, maxMonths);
    
    // Generate data points at regular intervals
    const numPoints = Math.min(12, maxMonthsToShow); // Max 12 points for readability
    const interval = Math.max(1, Math.floor(maxMonthsToShow / numPoints));
    
    const data = [];
    
    // Starting point
    data.push({
      name: 'Hoje',
      current: currentPortfolioValue,
      onlyContributions: currentPortfolioValue,
      withReturns: currentPortfolioValue,
    });
    
    // Generate projection points
    for (let month = interval; month <= maxMonthsToShow; month += interval) {
      const projectedOnlyContributions = Math.min(
        currentPortfolioValue + (monthlyRate * month),
        targetToUse * 1.1 // Cap slightly above goal for visual purposes
      );
      
      // Compound growth calculation
      let projectedWithReturns = currentPortfolioValue;
      for (let m = 0; m < month; m++) {
        projectedWithReturns = projectedWithReturns * (1 + monthlyReturnRate) + monthlyRate;
      }
      projectedWithReturns = Math.min(projectedWithReturns, targetToUse * 1.1);
      
      // Format month label
      let label = '';
      if (month < 12) {
        label = `${month}m`;
      } else {
        const years = Math.floor(month / 12);
        const remainingMonths = month % 12;
        label = remainingMonths > 0 ? `${years}a${remainingMonths}m` : `${years}a`;
      }
      
      data.push({
        name: label,
        current: null, // Only show current value at "Hoje"
        onlyContributions: projectedOnlyContributions,
        withReturns: projectedWithReturns,
      });
    }

    return data;
  }, [targetAmount, goal, currentPortfolioValue, projectionData]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="w-20 h-4 bg-muted rounded" />
      </div>
    );
  }

  const progress = goal && goal.target_amount > 0
    ? Math.min((currentPortfolioValue / goal.target_amount) * 100, 100)
    : 0;

  const remaining = goal ? goal.target_amount - currentPortfolioValue : 0;

  // Calculate values for the preview
  const inputTargetAmount = parsePtBrNumber(targetAmount);
  const targetToUse = inputTargetAmount > 0 ? inputTargetAmount : (goal?.target_amount || 0);
  const previewProgress = targetToUse > 0
    ? Math.min((currentPortfolioValue / targetToUse) * 100, 100)
    : 0;
  const previewRemaining = targetToUse - currentPortfolioValue;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button
          onClick={openEditDialog}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group",
            className
          )}
        >
          <Target className="w-4 h-4 text-primary" />
          {goal ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{goal.name}:</span>
              <span className="text-sm font-medium text-card-foreground">
                {!showValues
                  ? '•••'
                  : progress < 0.1
                    ? '<0,1%'
                    : progress < 1
                      ? `${progress.toFixed(1).replace('.', ',')}%`
                      : `${progress.toFixed(0)}%`}
              </span>
              <div className="hidden sm:block w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Definir Meta</span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {goal ? 'Editar Meta' : 'Definir Meta Pessoal'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Goal Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Nome da Meta
            </label>
            <Input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Ex: Aposentadoria, Reserva de Emergência..."
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Valor da Meta
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                value={targetAmount}
                onChange={handleInputChange}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Current Progress Preview - Always visible */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            {/* Portfolio / Goal summary */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Patrimônio / Meta</span>
              <span className="font-medium text-card-foreground">
                {formatCurrency(currentPortfolioValue)} / {targetToUse > 0 ? formatCurrency(targetToUse) : '—'}
              </span>
            </div>
            
            <Progress value={previewProgress} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className={cn(
                "font-medium",
                previewProgress >= 100 ? "text-profit" : "text-card-foreground"
              )}>
                {previewProgress.toFixed(1).replace('.', ',')}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Falta para a meta</span>
              <span className={cn(
                "font-medium",
                previewRemaining <= 0 ? "text-profit" : "text-card-foreground"
              )}>
                {targetToUse <= 0 
                  ? '—' 
                  : previewRemaining <= 0 
                    ? 'Meta atingida! 🎉' 
                    : formatCurrency(previewRemaining)}
              </span>
            </div>
          </div>

          {/* Evolution Chart - Only show when we have a target */}
          {targetToUse > 0 && chartData.length > 0 && (
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-card-foreground mb-3">
                Projeção: Aportes vs Aportes + Rentabilidade
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOnlyContributions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWithReturns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--profit))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--profit))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCompact(value)}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (value === null) return [null, null];
                        const label = name === 'onlyContributions' 
                          ? 'Só aportes' 
                          : name === 'withReturns' 
                            ? 'Aportes + Juros' 
                            : 'Atual';
                        return [formatCurrency(value), label];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                    />
                    <ReferenceLine 
                      y={targetToUse} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: 'Meta', 
                        position: 'right', 
                        fill: 'hsl(var(--primary))', 
                        fontSize: 10 
                      }}
                    />
                    {/* Only contributions line (slower growth) */}
                    <Area
                      type="monotone"
                      dataKey="onlyContributions"
                      stroke="hsl(var(--muted-foreground))"
                      fill="url(#colorOnlyContributions)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                    />
                    {/* With returns line (faster growth - compound interest) */}
                    <Area
                      type="monotone"
                      dataKey="withReturns"
                      stroke="hsl(var(--profit))"
                      fill="url(#colorWithReturns)"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls
                    />
                    {/* Current value point */}
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      strokeWidth={0}
                      dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed', borderWidth: '1px 0 0 0' }} />
                  <span className="text-muted-foreground">Só aportes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-profit rounded" />
                  <span className="text-muted-foreground">Aportes + Juros</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-primary" style={{ borderStyle: 'dashed', borderWidth: '1px 0 0 0' }} />
                  <span className="text-muted-foreground">Meta</span>
                </div>
              </div>

              {/* Projection Info */}
              {projectionData.monthlyRate > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Aporte médio mensal:</span>
                    <span className="font-medium text-card-foreground">
                      {formatCurrency(projectionData.monthlyRate)}
                    </span>
                  </div>
                  
                  {projectionData.annualReturnRate > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-profit" />
                      <span className="text-muted-foreground">Rentabilidade anual:</span>
                      <span className="font-medium text-profit">
                        +{(projectionData.annualReturnRate * 100).toFixed(1).replace('.', ',')}% a.a.
                      </span>
                    </div>
                  )}
                  
                  {projectionData.monthsToGoal !== null && projectionData.monthsToGoal > 0 && projectionData.estimatedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-profit" />
                      <span className="text-muted-foreground">Com juros compostos:</span>
                      <span className="font-medium text-profit">
                        {projectionData.estimatedDate.toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                        {' '}
                        <span className="text-muted-foreground font-normal">
                          (~{Math.ceil(projectionData.monthsToGoal)} {Math.ceil(projectionData.monthsToGoal) === 1 ? 'mês' : 'meses'})
                        </span>
                      </span>
                    </div>
                  )}
                  
                  {projectionData.monthsToGoal === 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-profit" />
                      <span className="font-medium text-profit">🎉 Meta já atingida!</span>
                    </div>
                  )}
                </div>
              )}

              {projectionData.monthlyRate === 0 && previewRemaining > 0 && (
                <p className="text-xs text-muted-foreground mt-3 text-center italic">
                  Sem aportes recentes para calcular projeção
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2">
          {goal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover Meta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sua meta será removida permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
