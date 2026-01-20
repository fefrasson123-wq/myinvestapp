import { useState, useMemo } from 'react';
import { Target, Check, Trash2 } from 'lucide-react';
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

interface PersonalGoalProps {
  currentPortfolioValue: number;
  className?: string;
}

export function PersonalGoal({ currentPortfolioValue, className }: PersonalGoalProps) {
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

  // Generate chart data for goal progression
  const chartData = useMemo(() => {
    const inputTargetAmount = parsePtBrNumber(targetAmount);
    const targetToUse = inputTargetAmount > 0 ? inputTargetAmount : (goal?.target_amount || 0);
    
    if (targetToUse <= 0 || currentPortfolioValue <= 0) return [];

    const data = [];
    const startValue = 0;
    const currentValue = currentPortfolioValue;
    const goalValue = targetToUse;
    
    // Create points: Start -> Current -> Goal
    // Show progression from 0 to current, then projected to goal
    const progressPercent = Math.min((currentValue / goalValue) * 100, 100);
    
    // Historical/current portion (filled area)
    data.push({ name: 'Início', value: startValue, projected: startValue });
    data.push({ name: 'Hoje', value: currentValue, projected: currentValue });
    
    // Projected portion (if not yet at goal)
    if (currentValue < goalValue) {
      data.push({ name: 'Meta', value: currentValue, projected: goalValue });
    } else {
      data.push({ name: 'Meta ✓', value: goalValue, projected: goalValue });
    }

    return data;
  }, [targetAmount, goal, currentPortfolioValue]);

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
                Evolução até a Meta
              </h4>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                      formatter={(value: number) => [formatCurrency(value), '']}
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
                      stroke="hsl(var(--profit))" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      fill="url(#colorProjected)"
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorValue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Linha tracejada verde = sua meta
              </p>
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
