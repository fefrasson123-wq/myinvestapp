import { useState } from 'react';
import { Check, ArrowLeft, Percent, Calendar, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment, FixedIncomeType, fixedIncomeLabels, InvestmentCategory } from '@/types/investment';

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

  const handleSelectType = (type: FixedIncomeType) => {
    setSelectedType(type);
    setStep('form');
  };

  const calculateEstimatedReturn = () => {
    const amount = parseFloat(formData.investedAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const purchaseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
    const maturityDate = formData.maturityDate ? new Date(formData.maturityDate) : null;
    
    if (!maturityDate || amount === 0 || rate === 0) return null;
    
    const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const estimatedReturn = amount * Math.pow(1 + rate / 100, years);
    
    return estimatedReturn;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const investedAmount = parseFloat(formData.investedAmount) || 0;
    const estimatedReturn = calculateEstimatedReturn();
    const currentPrice = estimatedReturn ? estimatedReturn / investedAmount : 1;

    onSubmit({
      name: formData.name.trim() || `${categoryTitles[category]} ${selectedType ? fixedIncomeLabels[selectedType] : ''}`,
      category: category as InvestmentCategory,
      quantity: 1,
      averagePrice: investedAmount,
      currentPrice: investedAmount,
      investedAmount,
      fixedIncomeType: selectedType || undefined,
      interestRate: parseFloat(formData.interestRate) || undefined,
      purchaseDate: formData.purchaseDate || undefined,
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
          <Label htmlFor="interestRate">Taxa (% a.a.)</Label>
          <Input
            id="interestRate"
            type="number"
            step="any"
            value={formData.interestRate}
            onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
            placeholder="Ex: 12.5"
          />
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
