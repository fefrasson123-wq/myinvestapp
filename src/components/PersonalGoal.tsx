import { useState } from 'react';
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

      <DialogContent className="sm:max-w-md">
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

          {/* Current Progress Preview */}
          {targetAmount && (() => {
            // Calculate preview values from the INPUT, not the saved goal
            const inputTargetAmount = parsePtBrNumber(targetAmount);
            const previewProgress = inputTargetAmount > 0
              ? Math.min((currentPortfolioValue / inputTargetAmount) * 100, 100)
              : 0;
            const previewRemaining = inputTargetAmount - currentPortfolioValue;

            return (
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Patrimônio Atual</span>
                  <span className="font-medium text-card-foreground">
                    {formatCurrency(currentPortfolioValue)}
                  </span>
                </div>
                <Progress value={previewProgress} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Falta para a meta</span>
                  <span className={cn(
                    "font-medium",
                    previewRemaining <= 0 ? "text-profit" : "text-card-foreground"
                  )}>
                    {previewRemaining <= 0 ? 'Meta atingida! 🎉' : formatCurrency(previewRemaining)}
                  </span>
                </div>
              </div>
            );
          })()}
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
