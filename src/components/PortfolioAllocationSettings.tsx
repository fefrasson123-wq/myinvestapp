import { useState, useEffect, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Save, RotateCcw, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, PieChart, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestmentCategory, categoryLabels, categoryColors } from '@/types/investment';
import { usePortfolioAllocations } from '@/hooks/usePortfolioAllocations';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { Investment } from '@/types/investment';

interface PortfolioAllocationSettingsProps {
  investments: Investment[];
}

// Categorias principais para alocação
const ALLOCATION_CATEGORIES: InvestmentCategory[] = [
  'crypto',
  'stocks',
  'fii',
  'usastocks',
  'reits',
  'bdr',
  'etf',
  'cdb',
  'treasury',
  'realestate',
  'gold',
  'cash'
];

export function PortfolioAllocationSettings({ investments }: PortfolioAllocationSettingsProps) {
  const { formatCurrencyValue } = useValuesVisibility();
  const { 
    allocations, 
    isLoading, 
    saveAllAllocations,
    getRebalancingSummary 
  } = usePortfolioAllocations(investments.map(inv => ({ 
    category: inv.category, 
    currentValue: inv.currentValue 
  })));

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeviationOpen, setIsDeviationOpen] = useState(false);
  const [localAllocations, setLocalAllocations] = useState<Record<InvestmentCategory, number>>({} as Record<InvestmentCategory, number>);

  // Initialize local state from saved allocations
  useEffect(() => {
    const initial: Record<InvestmentCategory, number> = {} as Record<InvestmentCategory, number>;
    ALLOCATION_CATEGORIES.forEach(cat => {
      const saved = allocations.find(a => a.category === cat);
      initial[cat] = saved?.target_percent || 0;
    });
    setLocalAllocations(initial);
  }, [allocations]);

  const totalPercent = useMemo(() => 
    Object.values(localAllocations).reduce((sum, val) => sum + val, 0)
  , [localAllocations]);

  const isValid = Math.abs(totalPercent - 100) < 0.01;

  const handleSliderChange = (category: InvestmentCategory, value: number[]) => {
    setLocalAllocations(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };

  const handleSave = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    const success = await saveAllAllocations(localAllocations);
    setIsSaving(false);
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    const initial: Record<InvestmentCategory, number> = {} as Record<InvestmentCategory, number>;
    ALLOCATION_CATEGORIES.forEach(cat => {
      const saved = allocations.find(a => a.category === cat);
      initial[cat] = saved?.target_percent || 0;
    });
    setLocalAllocations(initial);
  };

  const { allocationsWithDeviation, totalToInvest, underweightCategories, overweightCategories } = getRebalancingSummary();

  // Calcula alocação atual por categoria
  const currentAllocations = useMemo(() => {
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    if (totalValue <= 0) return {};

    const byCategory = investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<InvestmentCategory, number>);

    return Object.entries(byCategory).reduce((acc, [cat, value]) => {
      acc[cat as InvestmentCategory] = (value / totalValue) * 100;
      return acc;
    }, {} as Record<InvestmentCategory, number>);
  }, [investments]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasAllocations = allocations.length > 0;

  return (
    <div className="space-y-4">
      {/* Card de Configuração */}
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg truncate">Alocação Ideal da Carteira</CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Editar</span>
              <Switch 
                checked={isEditing} 
                onCheckedChange={setIsEditing}
              />
            </div>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Defina a porcentagem ideal para cada classe de ativo
          </CardDescription>
        </CardHeader>

        {isEditing && (
          <CardContent className="space-y-4 px-3 sm:px-6">
            {/* Status do total */}
            <div className={cn(
              "flex items-center gap-2 p-2 sm:p-3 rounded-lg",
              isValid 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium">
                Total: {totalPercent.toFixed(1)}%
                {!isValid && (totalPercent > 100 ? ' (excede 100%)' : ' (deve somar 100%)')}
              </span>
            </div>

            {/* Sliders por categoria */}
            <div className="space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
              {ALLOCATION_CATEGORIES.map(category => {
                const currentPct = currentAllocations[category] || 0;
                const targetPct = localAllocations[category] || 0;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: categoryColors[category] }}
                        />
                        <span className="text-xs sm:text-sm font-medium truncate">{categoryLabels[category]}</span>
                        {currentPct > 0 && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                            ({currentPct.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                      <Badge variant={targetPct > 0 ? "default" : "outline"} className="text-xs flex-shrink-0">
                        {targetPct.toFixed(0)}%
                      </Badge>
                    </div>
                    <Slider
                      value={[targetPct]}
                      onValueChange={(value) => handleSliderChange(category, value)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1 text-xs sm:text-sm"
                size="sm"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Resetar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!isValid || isSaving}
                className="flex-1 text-xs sm:text-sm"
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Card de Desvios e Rebalanceamento - Collapsible */}
      {hasAllocations && !isEditing && (
        <Collapsible open={isDeviationOpen} onOpenChange={setIsDeviationOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Desvio da Alocação Ideal</CardTitle>
                    <CardDescription>
                      Veja quanto sua carteira está desalinhada da meta
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    isDeviationOpen && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {allocationsWithDeviation.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Configure sua alocação ideal acima
                  </p>
                ) : (
                  <>
                    {/* Lista de desvios */}
                    <div className="space-y-3">
                      {allocationsWithDeviation
                        .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
                        .map(allocation => {
                          const isOverweight = allocation.deviation > 0;
                          const isUnderweight = allocation.deviation < 0;
                          const isBalanced = Math.abs(allocation.deviation) <= 1;
                          
                          return (
                            <div 
                              key={allocation.category}
                              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-2 h-8 rounded-full"
                                  style={{ backgroundColor: categoryColors[allocation.category] }}
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    {categoryLabels[allocation.category]}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Meta: {allocation.target_percent.toFixed(0)}% • Atual: {allocation.currentPercent.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  {isBalanced ? (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  ) : isOverweight ? (
                                    <TrendingUp className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-primary" />
                                  )}
                                  <span className={cn(
                                    "font-mono text-sm font-medium",
                                    isBalanced && "text-success",
                                    isOverweight && "text-amber-500",
                                    isUnderweight && "text-primary"
                                  )}>
                                    {allocation.deviation >= 0 ? '+' : ''}{allocation.deviation.toFixed(1)}%
                                  </span>
                                </div>
                                {!isBalanced && (
                                  <p className={cn(
                                    "text-xs font-mono",
                                    allocation.amountToRebalance > 0 ? "text-primary" : "text-amber-500"
                                  )}>
                                    {allocation.amountToRebalance > 0 ? 'Investir: ' : 'Reduzir: '}
                                    {formatCurrencyValue(Math.abs(allocation.amountToRebalance))}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Resumo de rebalanceamento */}
                    {(underweightCategories.length > 0 || overweightCategories.length > 0) && (
                      <div className="pt-3 border-t border-border/50">
                        <h4 className="text-sm font-medium mb-2">Para rebalancear:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {underweightCategories.length > 0 && (
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="text-xs text-muted-foreground mb-1">Investir em</p>
                              <div className="space-y-1">
                                {underweightCategories.slice(0, 3).map(cat => (
                                  <div key={cat.category} className="flex justify-between text-sm">
                                    <span>{categoryLabels[cat.category]}</span>
                                    <span className="font-mono text-primary">
                                      {formatCurrencyValue(cat.amountToRebalance)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {overweightCategories.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <p className="text-xs text-muted-foreground mb-1">Acima do ideal</p>
                              <div className="space-y-1">
                                {overweightCategories.slice(0, 3).map(cat => (
                                  <div key={cat.category} className="flex justify-between text-sm">
                                    <span>{categoryLabels[cat.category]}</span>
                                    <span className="font-mono text-amber-500">
                                      +{formatCurrencyValue(Math.abs(cat.amountToRebalance))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Total para investir */}
                    {totalToInvest > 0 && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Para atingir a alocação ideal, invista</p>
                        <p className="text-2xl font-mono font-bold text-primary">
                          {formatCurrencyValue(totalToInvest)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          nas categorias abaixo do ideal
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
