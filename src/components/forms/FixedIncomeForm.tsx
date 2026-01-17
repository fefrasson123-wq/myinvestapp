import { useState, useMemo, useCallback, memo } from 'react';
import { Check, ArrowLeft, Percent, Banknote, TrendingUp, RefreshCw, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment, FixedIncomeType, fixedIncomeLabels, InvestmentCategory } from '@/types/investment';
import { useEconomicRates } from '@/hooks/useEconomicRates';

interface FixedIncomeFormProps {
  category: 'cdb' | 'lci' | 'lca' | 'lcilca' | 'treasury' | 'savings' | 'debentures' | 'cricra' | 'fixedincomefund';
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

// Tipos para categorias gerais de renda fixa
const fixedIncomeTypes: FixedIncomeType[] = ['pos', 'pre', 'ipca', 'cdi'];

// Tipos específicos para Tesouro Direto
type TreasuryType = 'selic' | 'prefixado' | 'ipca';

const treasuryTypeLabels: Record<TreasuryType, string> = {
  selic: 'Tesouro Selic',
  prefixado: 'Tesouro Prefixado',
  ipca: 'Tesouro IPCA+',
};

const categoryTitles: Record<string, string> = {
  cdb: 'CDB',
  lci: 'LCI',
  lca: 'LCA',
  lcilca: 'LCI/LCA',
  treasury: 'Tesouro Direto',
  savings: 'Poupança',
  debentures: 'Debêntures',
  cricra: 'CRI / CRA',
  fixedincomefund: 'Fundo de Renda Fixa',
};

const rateLabels: Record<FixedIncomeType, { label: string; placeholder: string; suffix: string }> = {
  pos: { label: '% do CDI', placeholder: 'Ex: 110', suffix: '% do CDI' },
  pre: { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' },
  ipca: { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 5.5', suffix: '% a.a.' },
  cdi: { label: '% do CDI', placeholder: 'Ex: 100', suffix: '% do CDI' },
};

// Seletor de tipo para categorias gerais
const TypeSelector = memo(({ 
  onSelect, 
  onBack,
  types,
  labels,
}: { 
  onSelect: (type: FixedIncomeType) => void; 
  onBack: () => void;
  types: FixedIncomeType[];
  labels: Record<string, string>;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack} type="button">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h3 className="text-lg font-semibold text-card-foreground">Selecione o Tipo</h3>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
        >
          <Percent className="w-6 h-6 text-primary mb-2" />
          <span className="font-medium text-card-foreground text-sm">{labels[type]}</span>
        </button>
      ))}
    </div>
  </div>
));

TypeSelector.displayName = 'TypeSelector';

// Seletor específico para Tesouro Direto
const TreasuryTypeSelector = memo(({ 
  onSelect, 
  onBack,
}: { 
  onSelect: (type: TreasuryType) => void; 
  onBack: () => void;
}) => {
  const treasuryTypes: TreasuryType[] = ['selic', 'prefixado', 'ipca'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} type="button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">Tipo de Título</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {treasuryTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <Landmark className="w-6 h-6 text-primary" />
            <div className="text-left">
              <span className="font-medium text-card-foreground">{treasuryTypeLabels[type]}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {type === 'selic' && 'Rendimento atrelado à taxa Selic'}
                {type === 'prefixado' && 'Taxa fixa definida na compra'}
                {type === 'ipca' && 'IPCA + taxa adicional'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

TreasuryTypeSelector.displayName = 'TreasuryTypeSelector';

export function FixedIncomeForm({ category, onSubmit, onBack }: FixedIncomeFormProps) {
  const isSavings = category === 'savings';
  const isTreasury = category === 'treasury';
  
  const [step, setStep] = useState<'type' | 'form'>(isSavings ? 'form' : 'type');
  const [selectedType, setSelectedType] = useState<FixedIncomeType | null>(isSavings ? 'pos' : null);
  const [treasuryType, setTreasuryType] = useState<TreasuryType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    investedAmount: '',
    interestRate: '',
    purchaseDate: '',
    maturityDate: '',
    notes: '',
  });

  const { rates, isLoading: ratesLoading } = useEconomicRates();

  // Para Tesouro, mapeia o tipo do tesouro para o tipo de renda fixa
  const getEffectiveSelectedType = (): FixedIncomeType | null => {
    if (isTreasury && treasuryType) {
      if (treasuryType === 'selic') return 'pos'; // Selic = 100% da Selic
      if (treasuryType === 'prefixado') return 'pre';
      if (treasuryType === 'ipca') return 'ipca';
    }
    return selectedType;
  };

  const effectiveSelectedType = getEffectiveSelectedType();
  
  // Selic não precisa de taxa (é 100% Selic automático)
  const needsRateInput = isTreasury 
    ? treasuryType === 'prefixado' || treasuryType === 'ipca'
    : true;

  const isVariableRate = effectiveSelectedType === 'pos' || effectiveSelectedType === 'ipca' || effectiveSelectedType === 'cdi';
  
  const getRateConfig = () => {
    if (isTreasury && treasuryType === 'prefixado') {
      return { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' };
    }
    if (isTreasury && treasuryType === 'ipca') {
      return { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 5.5', suffix: '% a.a.' };
    }
    return effectiveSelectedType ? rateLabels[effectiveSelectedType] : rateLabels.pre;
  };
  
  const rateConfig = getRateConfig();

  const handleSelectType = useCallback((type: FixedIncomeType) => {
    setSelectedType(type);
    setStep('form');
  }, []);

  const handleSelectTreasuryType = useCallback((type: TreasuryType) => {
    setTreasuryType(type);
    setStep('form');
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const effectiveRate = useMemo(() => {
    // Para Tesouro Selic, usa 100% da Selic automaticamente
    if (isTreasury && treasuryType === 'selic') {
      return rates.cdi; // Selic ≈ CDI
    }
    
    const rate = parseFloat(formData.interestRate) || 0;
    if (effectiveSelectedType === 'ipca') {
      return rates.ipca + rate;
    } else if (effectiveSelectedType === 'pos' || effectiveSelectedType === 'cdi') {
      return (rates.cdi * rate) / 100;
    }
    return rate;
  }, [formData.interestRate, effectiveSelectedType, rates, isTreasury, treasuryType]);

  const estimatedReturn = useMemo(() => {
    const amount = parseFloat(formData.investedAmount) || 0;
    const purchaseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
    const maturityDate = formData.maturityDate ? new Date(formData.maturityDate) : null;
    
    if (!maturityDate || amount === 0) return null;
    
    // Para Selic, não precisa de taxa informada
    if (isTreasury && treasuryType === 'selic') {
      const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years <= 0) return null;
      return amount * Math.pow(1 + rates.cdi / 100, years);
    }
    
    const rate = parseFloat(formData.interestRate) || 0;
    if (rate === 0) return null;
    
    const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years <= 0) return null;

    let totalRate = rate;
    if (effectiveSelectedType === 'ipca') {
      totalRate = rates.ipca + rate;
    } else if (effectiveSelectedType === 'pos' || effectiveSelectedType === 'cdi') {
      totalRate = (rates.cdi * rate) / 100;
    }
    
    return amount * Math.pow(1 + totalRate / 100, years);
  }, [formData, effectiveSelectedType, rates, isTreasury, treasuryType]);

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

    // Nome baseado no tipo
    let defaultName = categoryTitles[category];
    if (isTreasury && treasuryType) {
      defaultName = treasuryTypeLabels[treasuryType];
    } else if (effectiveSelectedType) {
      defaultName = `${categoryTitles[category]} ${fixedIncomeLabels[effectiveSelectedType]}`;
    }

    onSubmit({
      name: formData.name.trim() || defaultName,
      category: category as InvestmentCategory,
      quantity: 1,
      averagePrice: investedAmount,
      currentPrice: currentValue,
      investedAmount,
      fixedIncomeType: effectiveSelectedType || undefined,
      interestRate: effectiveRate,
      purchaseDate,
      maturityDate: formData.maturityDate || undefined,
      notes: formData.notes.trim() || undefined,
    });
  }, [formData, effectiveRate, category, effectiveSelectedType, onSubmit, isTreasury, treasuryType]);

  const handleBackClick = useCallback(() => {
    if (isSavings) {
      onBack();
    } else {
      setStep('type');
      if (isTreasury) {
        setTreasuryType(null);
      }
    }
  }, [isSavings, isTreasury, onBack]);

  // Tela de seleção de tipo
  if (step === 'type' && !isSavings) {
    if (isTreasury) {
      return <TreasuryTypeSelector onSelect={handleSelectTreasuryType} onBack={onBack} />;
    }
    return <TypeSelector onSelect={handleSelectType} onBack={onBack} types={fixedIncomeTypes} labels={fixedIncomeLabels} />;
  }

  // Título do formulário
  const getFormTitle = () => {
    if (isTreasury && treasuryType) {
      return treasuryTypeLabels[treasuryType];
    }
    return categoryTitles[category];
  };

  const getFormSubtitle = () => {
    if (isTreasury && treasuryType === 'selic') {
      return '100% Selic';
    }
    if (isTreasury && treasuryType === 'ipca') {
      return 'IPCA +';
    }
    if (effectiveSelectedType && !isSavings && !isTreasury) {
      return fixedIncomeLabels[effectiveSelectedType];
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBackClick}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {getFormTitle()}
            {getFormSubtitle() && (
              <span className="ml-2 text-primary text-sm">({getFormSubtitle()})</span>
            )}
          </h3>
        </div>
      </div>

      {/* Mostrar taxas atuais para tipos variáveis ou Selic */}
      {(isVariableRate || (isTreasury && treasuryType === 'selic')) && (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Taxas Atuais</span>
            {ratesLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Selic/CDI:</span>
              <span className="ml-2 font-semibold text-card-foreground">{rates.cdi}% a.a.</span>
            </div>
            {(effectiveSelectedType === 'ipca' || treasuryType === 'ipca') && (
              <div>
                <span className="text-muted-foreground">IPCA 12m:</span>
                <span className="ml-2 font-semibold text-card-foreground">{rates.ipca}% a.a.</span>
              </div>
            )}
          </div>
          {isTreasury && treasuryType === 'selic' && (
            <p className="text-xs text-muted-foreground mt-2">
              O Tesouro Selic rende automaticamente 100% da taxa Selic
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome do Investimento</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={`Ex: ${getFormTitle()} 2029`}
          />
        </div>

        <div className={needsRateInput ? '' : 'col-span-2'}>
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

        {needsRateInput && (
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
            {effectiveSelectedType === 'ipca' && formData.interestRate && (
              <p className="text-xs text-muted-foreground mt-1">
                Taxa efetiva: <span className="font-medium text-primary">{effectiveRate.toFixed(2)}% a.a.</span>
              </p>
            )}
          </div>
        )}

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
              <span>Rendimento Estimado no Vencimento</span>
            </div>
            <p className="text-xl font-mono font-bold text-primary">
              R$ {estimatedReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {(isVariableRate || (isTreasury && treasuryType === 'selic')) && (
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
