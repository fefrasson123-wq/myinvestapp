import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Check, Trash2, TrendingUp, Calendar, Car, Palmtree, ChartLine, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { usePersonalGoal, GoalType, goalTypeLabels } from '@/hooks/usePersonalGoal';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [targetAmount, setTargetAmount] = useState('');
  const [debouncedTargetAmount, setDebouncedTargetAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('value_goal');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce targetAmount changes to prevent heavy recalculations on every keystroke
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedTargetAmount(targetAmount);
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [targetAmount]);

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

    // For passive income goals, calculate the required portfolio value
    // based on 10% annual yield: portfolioNeeded = (monthlyIncome * 12) / 0.10
    const targetPortfolioValue = goalType === 'passive_income' 
      ? (amount * 12) / 0.10 
      : amount;

    const result = await saveGoal({
      name: goalName || goalTypeLabels[goalType],
      goal_type: goalType,
      target_amount: targetPortfolioValue,
    });

    if (result) {
      const displayMessage = goalType === 'passive_income'
        ? `Sua meta de ${formatCurrency(amount)}/mês (patrimônio de ${formatCurrency(targetPortfolioValue)}) foi salva.`
        : `Sua meta de ${formatCurrency(amount)} foi salva.`;
      toast({
        title: goal ? 'Meta atualizada' : 'Meta criada',
        description: displayMessage,
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
    // Redirect to signup if not logged in
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    
    if (goal) {
      setGoalName(goal.name);
      setGoalType(goal.goal_type);
      // For passive income goals, convert stored portfolio value back to monthly income
      const displayAmount = goal.goal_type === 'passive_income'
        ? (goal.target_amount * 0.10) / 12
        : goal.target_amount;
      setTargetAmount(
        displayAmount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setGoalName('');
      setGoalType('value_goal');
      setTargetAmount('');
    }
    setIsDialogOpen(true);
  };

  // Calculate average monthly contribution rate and annual return from transactions
  // Use debounced value for heavy calculations to prevent blocking input
  const projectionData = useMemo(() => {
    const inputTargetAmount = parsePtBrNumber(debouncedTargetAmount);
    // For passive income, convert monthly income to required portfolio value
    const effectiveTarget = goalType === 'passive_income' 
      ? (inputTargetAmount * 12) / 0.10 
      : inputTargetAmount;
    const targetToUse = effectiveTarget > 0 ? effectiveTarget : (goal?.target_amount || 0);
    
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

    // Filter only buy transactions to count distinct months of investment
    const now = new Date();
    
    const buyTransactions = transactions.filter(tx => tx.type === 'buy');

    if (buyTransactions.length === 0) {
      return { monthlyRate: 0, annualReturnRate, monthsToGoal: null, estimatedDate: null };
    }

    // Count distinct months where user made investments (all time, not just last 12 months)
    const distinctMonths = new Set(
      buyTransactions.map(tx => {
        const d = new Date(tx.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    ).size;

    const monthsCount = Math.max(1, distinctMonths);

    // Monthly rate = total invested amount / number of distinct months with investments
    const monthlyRate = totalInvestedAmount / monthsCount;
    
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
  }, [transactions, debouncedTargetAmount, goal, goalType, currentPortfolioValue, totalInvestedAmount]);

  // Generate chart data for goal progression with two projection lines
  const chartData = useMemo(() => {
    const inputTargetAmount = parsePtBrNumber(debouncedTargetAmount);
    // For passive income, convert monthly income to required portfolio value
    const effectiveTarget = goalType === 'passive_income' 
      ? (inputTargetAmount * 12) / 0.10 
      : inputTargetAmount;
    const targetToUse = effectiveTarget > 0 ? effectiveTarget : (goal?.target_amount || 0);
    
    if (targetToUse <= 0 || currentPortfolioValue <= 0) return [];

    const { monthlyRate, annualReturnRate } = projectionData;
    
    // If no monthly rate, just show current progress
    if (monthlyRate <= 0) {
      return [
        { name: 'Hoje', patrimonio: currentPortfolioValue, meta: targetToUse },
      ];
    }

    const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;
    
    // Calculate months needed to reach goal with compound returns
    let monthsToGoal = 0;
    let projectedValue = currentPortfolioValue;
    const maxMonths = 600;
    
    while (projectedValue < targetToUse && monthsToGoal < maxMonths) {
      projectedValue = projectedValue * (1 + monthlyReturnRate) + monthlyRate;
      monthsToGoal++;
    }
    
    // Determine timeline to show (add a bit more to show reaching the goal)
    const maxMonthsToShow = Math.min(monthsToGoal + 2, maxMonths);
    
    // Generate data points at regular intervals
    const numPoints = Math.min(10, maxMonthsToShow);
    const interval = Math.max(1, Math.floor(maxMonthsToShow / numPoints));
    
    const data = [];
    
    // Starting point
    data.push({
      name: 'Hoje',
      patrimonio: currentPortfolioValue,
      meta: targetToUse,
    });
    
    // Generate projection points
    for (let month = interval; month <= maxMonthsToShow; month += interval) {
      // Compound growth calculation
      let projectedWithReturns = currentPortfolioValue;
      for (let m = 0; m < month; m++) {
        projectedWithReturns = projectedWithReturns * (1 + monthlyReturnRate) + monthlyRate;
      }
      
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
        patrimonio: projectedWithReturns,
        meta: targetToUse,
      });
    }

    return data;
  }, [debouncedTargetAmount, goal, goalType, currentPortfolioValue, projectionData]);

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
  // For passive income, convert monthly income to required portfolio value
  const effectiveTarget = goalType === 'passive_income' 
    ? (inputTargetAmount * 12) / 0.10 
    : inputTargetAmount;
  const targetToUse = effectiveTarget > 0 ? effectiveTarget : (goal?.target_amount || 0);
  const previewProgress = targetToUse > 0
    ? Math.min((currentPortfolioValue / targetToUse) * 100, 100)
    : 0;
  const previewRemaining = targetToUse - currentPortfolioValue;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={false}>
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
                  : progress === 0
                    ? '0%'
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
            <span className="text-xs text-muted-foreground">🏆 Metas financeiras</span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden w-[calc(100vw-2rem)] glass-card border-primary/30 shadow-xl shadow-primary/10">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/20 glow-primary">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="gradient-text font-bold">
              {goal ? 'Editar Meta' : 'Definir Meta Pessoal'}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure sua meta pessoal de patrimônio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Goal Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tipo de Meta
            </label>
            <RadioGroup
              value={goalType}
              onValueChange={(value) => setGoalType(value as GoalType)}
              className="grid grid-cols-2 gap-3"
            >
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                goalType === 'value_goal' 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 bg-secondary/30 hover:border-primary/30"
              )}>
                <RadioGroupItem value="value_goal" id="value_goal" />
                <Label htmlFor="value_goal" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm">Meta de Investimentos</span>
                </Label>
              </div>
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                goalType === 'buy_car' 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 bg-secondary/30 hover:border-primary/30"
              )}>
                <RadioGroupItem value="buy_car" id="buy_car" />
                <Label htmlFor="buy_car" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Car className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Comprar Carro</span>
                </Label>
              </div>
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                goalType === 'financial_independence' 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 bg-secondary/30 hover:border-primary/30"
              )}>
                <RadioGroupItem value="financial_independence" id="financial_independence" />
                <Label htmlFor="financial_independence" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Palmtree className="w-4 h-4 text-success" />
                  <span className="text-sm">Independência</span>
                </Label>
              </div>
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                goalType === 'passive_income' 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 bg-secondary/30 hover:border-primary/30"
              )}>
                <RadioGroupItem value="passive_income" id="passive_income" />
                <Label htmlFor="passive_income" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ChartLine className="w-4 h-4 text-info" />
                  <span className="text-sm">Renda Passiva</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Goal Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Nome da Meta
            </label>
            <Input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder={`Ex: ${goalTypeLabels[goalType]}`}
              className="bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {goalType === 'passive_income' ? 'Renda Mensal Desejada' : 'Valor da Meta'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-medium">
                R$
              </span>
              <Input
                value={targetAmount}
                onChange={handleInputChange}
                placeholder={goalType === 'passive_income' ? '5.000,00' : '0,00'}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 font-mono text-lg"
              />
            </div>
            {goalType === 'passive_income' && inputTargetAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Patrimônio necessário:{' '}
                <span className="font-medium text-primary">
                  {formatCurrency((inputTargetAmount * 12) / 0.10)}
                </span>
                {' '}(considerando 10% a.a. de rendimentos)
              </p>
            )}
          </div>

          {/* Current Progress Preview */}
          <div className="investment-card space-y-4">
            {/* Portfolio / Goal summary */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Patrimônio / Meta</span>
              <span className="font-mono font-medium text-card-foreground">
                {formatCurrency(currentPortfolioValue)} <span className="text-muted-foreground">/</span> {targetToUse > 0 ? formatCurrency(targetToUse) : '—'}
              </span>
            </div>
            
            <div className="relative">
              <Progress value={previewProgress} className="h-3 bg-secondary" />
              <div 
                className="absolute inset-0 h-3 rounded-full overflow-hidden pointer-events-none"
                style={{ 
                  background: `linear-gradient(90deg, hsl(var(--primary) / 0.3) ${previewProgress}%, transparent ${previewProgress}%)`,
                  boxShadow: previewProgress > 0 ? 'inset 0 0 10px hsl(var(--primary) / 0.3)' : 'none'
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Progresso</p>
                <p className={cn(
                  "text-xl font-bold font-mono",
                  previewProgress >= 100 ? "text-success number-glow" : "text-primary"
                )}>
                  {previewProgress.toFixed(1).replace('.', ',')}%
                </p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Faltam</p>
                <p className={cn(
                  "text-lg font-bold font-mono",
                  previewRemaining <= 0 ? "text-success" : "text-card-foreground"
                )}>
                  {targetToUse <= 0 
                    ? '—' 
                    : previewRemaining <= 0 
                      ? '🎉' 
                      : formatCurrency(previewRemaining)}
                </p>
              </div>
            </div>
          </div>

          {/* Evolution Chart - Only show when we have a target */}
          {targetToUse > 0 && chartData.length > 0 && (
            <div className="investment-card">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Projeção de Crescimento
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.1}/>
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
                      domain={[0, (dataMax: number) => Math.max(dataMax, targetToUse) * 1.1]}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (value === null) return [null, null];
                        const label = name === 'patrimonio' ? 'Patrimônio' : 'Meta';
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
                    {/* Meta line - horizontal reference */}
                    <ReferenceLine 
                      y={targetToUse} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: `Meta: ${formatCompact(targetToUse)}`, 
                        position: 'insideTopRight', 
                        fill: 'hsl(var(--primary))', 
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />
                    {/* Patrimônio projection line */}
                    <Area
                      type="monotone"
                      dataKey="patrimonio"
                      stroke="hsl(142, 76%, 45%)"
                      fill="url(#colorPatrimonio)"
                      strokeWidth={3}
                      dot={{ r: 5, fill: 'hsl(142, 76%, 50%)', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                      activeDot={{ r: 7, fill: 'hsl(142, 76%, 55%)', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-success rounded" />
                  <span className="text-xs text-muted-foreground">Patrimônio Projetado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-primary rounded" style={{ borderStyle: 'dashed', borderWidth: '2px 0 0 0' }} />
                  <span className="text-xs text-muted-foreground">Meta</span>
                </div>
              </div>

              {/* Projection Stats */}
              {projectionData.monthlyRate > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Aporte/mês</span>
                    </div>
                    <span className="font-mono font-bold text-card-foreground">
                      {formatCurrency(projectionData.monthlyRate)}
                    </span>
                  </div>
                  
                  {projectionData.annualReturnRate > 0 && (
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rent. anual</span>
                      </div>
                      <span className="font-mono font-bold text-success">
                        +{(projectionData.annualReturnRate * 100).toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Estimated Date */}
              {projectionData.monthsToGoal !== null && projectionData.monthsToGoal > 0 && projectionData.estimatedDate && (
                <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Previsão:</span>
                    <span className="font-medium text-success">
                      {projectionData.estimatedDate.toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (~{Math.ceil(projectionData.monthsToGoal)} {Math.ceil(projectionData.monthsToGoal) === 1 ? 'mês' : 'meses'})
                    </span>
                  </div>
                </div>
              )}
              
              {projectionData.monthsToGoal === 0 && (
                <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                  <span className="font-medium text-success">🎉 Meta já atingida!</span>
                </div>
              )}

              {projectionData.monthlyRate === 0 && previewRemaining > 0 && (
                <p className="text-xs text-muted-foreground mt-4 text-center italic">
                  Sem aportes recentes para calcular projeção
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3 pt-2 border-t border-border/30">
          {goal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span className="text-xs">Excluir</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-card border-destructive/30">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">Remover Meta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sua meta será removida permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-secondary hover:bg-secondary/80">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex gap-3 ml-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-border/50 hover:bg-secondary/50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary btn-interactive"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Salvar Meta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
