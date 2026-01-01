import { useState, useMemo, useCallback, memo } from 'react';
import { Check, ArrowLeft, Percent, Banknote, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment, FixedIncomeType, fixedIncomeLabels, InvestmentCategory } from '@/types/investment';
import { useEconomicRates } from '@/hooks/useEconomicRates';

interface FixedIncomeFormProps {
  category: 'cdb' | 'cdi' | 'treasury' | 'savings';
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

const fixedIncomeTypes: FixedIncomeType[] = ['pos', 'pre', 'ipca', 'cdi'];

const categoryTitles: Record<string, string> = {
  cdb: 'CDB',
  cdi: 'Investimento CDI',
  treasury: 'Tesouro Direto',
  savings: 'Poupança',
};

const rateLabels: Record<FixedIncomeType, { label: string; placeholder: string; suffix: string }> = {
  pos: { label: '% do CDI', placeholder: 'Ex: 110', suffix: '% do CDI' },
  pre: { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' },
  ipca: { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 5.5', suffix: '% a.a.' },
  cdi: { label: '% do CDI', placeholder: 'Ex: 100', suffix: '% do CDI' },
};

const TypeSelector = memo(({ 
  onSelect, 
  onBack 
}: { 
  onSelect: (type: FixedIncomeType) => void; 
  onBack: () => void;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack} type="button">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h3 className="text-lg font-semibold text-card-foreground">Selecione o Tipo</h3>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {fixedIncomeTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
        >
          <Percent className="w-6 h-6 text-primary mb-2" />
          <span className="font-medium text-card-foreground text-sm">{fixedIncomeLabels[type]}</span>
        </button>
      ))}
    </div>
  </div>
));

TypeSelector.displayName = 'TypeSelector';

export function FixedIncomeForm({ category, onSubmit, onBack }: FixedIncomeFormProps) {
  const isSavings = category === 'savings';
  const [step, setStep] = useState<'type' | 'form'>(isSavings ? 'form' : 'type');
  const [selectedType, setSelectedType] = useState<FixedIncomeType | null>(isSavings ? 'pos' : null);
  const [formData, setFormData] = useState({
    name: '',
    investedAmount: '',
    interestRate: '',
    purchaseDate: '',
    maturityDate: '',
    notes: '',
  });

  const { rates, isLoading: ratesLoading } = useEconomicRates();

  const isVariableRate = selectedType === 'pos' || selectedType === 'ipca' || selectedType === 'cdi';
  const rateConfig = selectedType ? rateLabels[selectedType] : rateLabels.pre;

  const handleSelectType = useCallback((type: FixedIncomeType) => {
    setSelectedType(type);
    setStep('form');
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const effectiveRate = useMemo(() => {
    const rate = parseFloat(formData.interestRate) || 0;
    if (selectedType === 'ipca') {
      return rates.ipca + rate;
    } else if (selectedType === 'pos' || selectedType === 'cdi') {
      return (rates.cdi * rate) / 100;
    }
    return rate;
  }, [formData.interestRate, selectedType, rates]);

  const estimatedReturn = useMemo(() => {
    const amount = parseFloat(formData.investedAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const purchaseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
    const maturityDate = formData.maturityDate ? new Date(formData.maturityDate) : null;
    
    if (!maturityDate || amount === 0 || rate === 0) return null;
    
    const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years <= 0) return null;

    let totalRate = rate;
    if (selectedType === 'ipca') {
      totalRate = rates.ipca + rate;
    } else if (selectedType === 'pos' || selectedType === 'cdi') {
      totalRate = (rates.cdi * rate) / 100;
    }
    
    return amount * Math.pow(1 + totalRate / 100, years);
  }, [formData, selectedType, rates]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const investedAmount = parseFloat(formData.investedAmount) || 0;
    const purchaseDate = formData.purchaseDate || new Date().toISOString().split('T')[0];
    const purchaseDateObj = new Date(purchaseDate);
    const now = new Date();
    const yearsElapsed = Math.max(0, (now.getTime() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    const currentValue = yearsElapsed > 0 && effectiveRate > 0 
      ? investedAmount * Math.pow(1 + effectiveRate / 100, yearsElapsed)
      : investedAmount;

    onSubmit({
      name: formData.name.trim() || `${categoryTitles[category]} ${selectedType ? fixedIncomeLabels[selectedType] : ''}`,
      category: category as InvestmentCategory,
      quantity: 1,
      averagePrice: investedAmount,
      currentPrice: currentValue,
      investedAmount,
      fixedIncomeType: selectedType || undefined,
      interestRate: effectiveRate,
      purchaseDate,
      maturityDate: formData.maturityDate || undefined,
      notes: formData.notes.trim() || undefined,
    });
  }, [formData, effectiveRate, category, selectedType, onSubmit]);

  const handleBackClick = useCallback(() => {
    if (isSavings) {
      onBack();
    } else {
      setStep('type');
    }
  }, [isSavings, onBack]);

  if (step === 'type' && !isSavings) {
    return <TypeSelector onSelect={handleSelectType} onBack={onBack} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBackClick}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {categoryTitles[category]}
            {selectedType && !isSavings && (
              <span className="ml-2 text-primary text-sm">({fixedIncomeLabels[selectedType]})</span>
            )}
          </h3>
        </div>
      </div>

      {isVariableRate && (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Taxas Atuais</span>
            {ratesLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">CDI/Selic:</span>
              <span className="ml-2 font-semibold text-card-foreground">{rates.cdi}% a.a.</span>
            </div>
            <div>
              <span className="text-muted-foreground">IPCA 12m:</span>
              <span className="ml-2 font-semibold text-card-foreground">{rates.ipca}% a.a.</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome do Investimento</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={`Ex: ${categoryTitles[category]} Banco X`}
          />
        </div>

        <div>
          <Label htmlFor="investedAmount">Valor Investido (R$) *</Label>
          <Input
            id="investedAmount"
            type="number"
            step="any"
            value={formData.investedAmount}
            onChange={(e) => handleInputChange('investedAmount', e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="interestRate">{rateConfig.label} *</Label>
          <div className="relative">
            <Input
              id="interestRate"
              type="number"
              step="any"
              value={formData.interestRate}
              onChange={(e) => handleInputChange('interestRate', e.target.value)}
              placeholder={rateConfig.placeholder}
              required
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {rateConfig.suffix}
            </span>
          </div>
          {isVariableRate && formData.interestRate && (
            <p className="text-xs text-muted-foreground mt-1">
              Taxa efetiva: <span className="font-medium text-primary">{effectiveRate.toFixed(2)}% a.a.</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="purchaseDate">Data de Aplicação</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="maturityDate">Data de Vencimento</Label>
          <Input
            id="maturityDate"
            type="date"
            value={formData.maturityDate}
            onChange={(e) => handleInputChange('maturityDate', e.target.value)}
          />
        </div>

        {estimatedReturn && (
          <div className="col-span-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Banknote className="w-4 h-4" />
              <span>Rendimento Estimado</span>
            </div>
            <p className="text-xl font-mono font-bold text-primary">
              R$ {estimatedReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {isVariableRate && (
              <p className="text-xs text-muted-foreground mt-1">
                * Estimativa com taxas atuais
              </p>
            )}
          </div>
        )}

        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Notas sobre o investimento..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2">
          <Check className="w-4 h-4" />
          Adicionar
        </Button>
      </div>
    </form>
  );
}
