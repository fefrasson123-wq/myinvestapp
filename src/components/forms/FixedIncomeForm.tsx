import { useState } from 'react';
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

// Labels específicos para cada tipo
const rateLabels: Record<FixedIncomeType, { label: string; placeholder: string; suffix: string }> = {
  pos: { label: '% do CDI', placeholder: 'Ex: 110', suffix: '% do CDI' },
  pre: { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' },
  ipca: { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 5.5', suffix: '% a.a.' },
  cdi: { label: '% do CDI', placeholder: 'Ex: 100', suffix: '% do CDI' },
};

export function FixedIncomeForm({ category, onSubmit, onBack }: FixedIncomeFormProps) {
  const [step, setStep] = useState<'type' | 'form'>(category === 'savings' ? 'form' : 'type');
  const [selectedType, setSelectedType] = useState<FixedIncomeType | null>(category === 'savings' ? 'pos' : null);
  const [formData, setFormData] = useState({
    name: '',
    investedAmount: '',
    interestRate: '',
    purchaseDate: '',
    maturityDate: '',
    notes: '',
  });

  const { rates, isLoading: ratesLoading, calculateVariableReturn } = useEconomicRates();

  const handleSelectType = (type: FixedIncomeType) => {
    setSelectedType(type);
    setStep('form');
  };

  const isVariableRate = selectedType === 'pos' || selectedType === 'ipca' || selectedType === 'cdi';

  const calculateCurrentValue = (purchaseDateStr: string, rate: number, amount: number) => {
    const purchaseDate = new Date(purchaseDateStr);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsElapsed <= 0 || rate === 0) return amount;

    if (selectedType === 'ipca') {
      // IPCA + taxa adicional
      const totalRate = rates.ipca + rate;
      return amount * Math.pow(1 + totalRate / 100, yearsElapsed);
    } else if (selectedType === 'pos' || selectedType === 'cdi') {
      // % do CDI
      const effectiveRate = (rates.cdi * rate) / 100;
      return amount * Math.pow(1 + effectiveRate / 100, yearsElapsed);
    }
    
    // Pré-fixado
    return amount * Math.pow(1 + rate / 100, yearsElapsed);
  };

  const calculateEstimatedReturn = () => {
    const amount = parseFloat(formData.investedAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const purchaseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
    const maturityDate = formData.maturityDate ? new Date(formData.maturityDate) : null;
    
    if (!maturityDate || amount === 0 || rate === 0) return null;
    
    const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (selectedType === 'ipca') {
      const totalRate = rates.ipca + rate;
      return amount * Math.pow(1 + totalRate / 100, years);
    } else if (selectedType === 'pos' || selectedType === 'cdi') {
      const effectiveRate = (rates.cdi * rate) / 100;
      return amount * Math.pow(1 + effectiveRate / 100, years);
    }
    
    return amount * Math.pow(1 + rate / 100, years);
  };

  const getEffectiveRate = () => {
    const rate = parseFloat(formData.interestRate) || 0;
    if (selectedType === 'ipca') {
      return rates.ipca + rate;
    } else if (selectedType === 'pos' || selectedType === 'cdi') {
      return (rates.cdi * rate) / 100;
    }
    return rate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const investedAmount = parseFloat(formData.investedAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const purchaseDate = formData.purchaseDate || new Date().toISOString().split('T')[0];
    
    // Calculate current value based on elapsed time
    const currentValue = calculateCurrentValue(purchaseDate, rate, investedAmount);

    // Para taxas variáveis, armazenamos a taxa efetiva calculada
    const effectiveRate = getEffectiveRate();

    onSubmit({
      name: formData.name.trim() || `${categoryTitles[category]} ${selectedType ? fixedIncomeLabels[selectedType] : ''}`,
      category: category as InvestmentCategory,
      quantity: 1,
      averagePrice: investedAmount,
      currentPrice: currentValue,
      investedAmount,
      fixedIncomeType: selectedType || undefined,
      interestRate: effectiveRate, // Taxa efetiva anual
      purchaseDate: purchaseDate,
      maturityDate: formData.maturityDate || undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  const estimatedReturn = calculateEstimatedReturn();

  if (step === 'type' && category !== 'savings') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">Tipo de {categoryTitles[category]}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fixedIncomeTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleSelectType(type)}
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all"
            >
              <Percent className="w-6 h-6 text-primary mb-2" />
              <span className="font-medium text-card-foreground">{fixedIncomeLabels[type]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const rateConfig = selectedType ? rateLabels[selectedType] : rateLabels.pre;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={() => category === 'savings' ? onBack() : setStep('type')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {categoryTitles[category]}
            {selectedType && category !== 'savings' && (
              <span className="ml-2 text-primary text-sm">({fixedIncomeLabels[selectedType]})</span>
            )}
          </h3>
        </div>
      </div>

      {/* Exibir taxas atuais para tipos variáveis */}
      {isVariableRate && (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Taxas Atuais (atualizadas automaticamente)</span>
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
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, investedAmount: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="interestRate">
            {rateConfig.label} *
          </Label>
          <div className="relative">
            <Input
              id="interestRate"
              type="number"
              step="any"
              value={formData.interestRate}
              onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
              placeholder={rateConfig.placeholder}
              required
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {rateConfig.suffix}
            </span>
          </div>
          {isVariableRate && formData.interestRate && (
            <p className="text-xs text-muted-foreground mt-1">
              Taxa efetiva: <span className="font-medium text-primary">{getEffectiveRate().toFixed(2)}% a.a.</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="purchaseDate">Data de Aplicação</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="maturityDate">Data de Vencimento</Label>
          <Input
            id="maturityDate"
            type="date"
            value={formData.maturityDate}
            onChange={(e) => setFormData(prev => ({ ...prev, maturityDate: e.target.value }))}
          />
        </div>

        {estimatedReturn && (
          <div className="col-span-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Banknote className="w-4 h-4" />
              <span>Rendimento Estimado no Vencimento</span>
            </div>
            <p className="text-xl font-mono font-bold text-primary">
              R$ {estimatedReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {isVariableRate && (
              <p className="text-xs text-muted-foreground mt-1">
                * Estimativa com taxas atuais. Valores podem variar conforme índices econômicos.
              </p>
            )}
          </div>
        )}

        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
