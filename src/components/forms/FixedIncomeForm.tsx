import { useState, useMemo, useCallback, memo } from 'react';
import { Check, ArrowLeft, Percent, Banknote, TrendingUp, RefreshCw, Landmark, Building2 } from 'lucide-react';
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

// Tipos de rentabilidade para CDB/LCI/LCA
type RentabilidadeType = 'prefixado' | 'posfixado' | 'ipca';

// Tipos de indexador para Pós-fixado
type IndexadorType = 'cdi' | 'selic';

// Tipos específicos para Tesouro Direto
type TreasuryType = 'selic' | 'prefixado' | 'ipca';

// Tipos de Fundo de Renda Fixa
type FundoRFType = 'fundo_di' | 'fundo_selic' | 'fundo_ipca' | 'fundo_prefixado' | 'fundo_multi';

const rentabilidadeLabels: Record<RentabilidadeType, string> = {
  prefixado: 'Prefixado',
  posfixado: 'Pós-fixado',
  ipca: 'IPCA+',
};

const indexadorLabels: Record<IndexadorType, string> = {
  cdi: 'CDI',
  selic: 'Selic',
};

const treasuryTypeLabels: Record<TreasuryType, string> = {
  selic: 'Tesouro Selic',
  prefixado: 'Tesouro Prefixado',
  ipca: 'Tesouro IPCA+',
};

const fundoRFLabels: Record<FundoRFType, string> = {
  fundo_di: 'Fundo DI (CDI)',
  fundo_selic: 'Fundo Selic',
  fundo_ipca: 'Fundo IPCA',
  fundo_prefixado: 'Fundo Prefixado',
  fundo_multi: 'Fundo Multiestratégia RF',
};

const fundoRFDescriptions: Record<FundoRFType, string> = {
  fundo_di: 'Indexado ao CDI, alta liquidez',
  fundo_selic: 'Indexado à taxa Selic',
  fundo_ipca: 'Protege contra inflação (IPCA)',
  fundo_prefixado: 'Taxa definida no momento da aplicação',
  fundo_multi: 'Diversas estratégias de renda fixa',
};

const fundoRFIndexadores: Record<FundoRFType, string> = {
  fundo_di: 'CDI',
  fundo_selic: 'Selic',
  fundo_ipca: 'IPCA',
  fundo_prefixado: 'Taxa Prefixada',
  fundo_multi: 'Múltiplos',
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

// Categorias que usam o fluxo de Rentabilidade -> Indexador
const categoriesWithRentabilidade = ['cdb', 'lci', 'lca', 'lcilca', 'debentures', 'cricra'];

// Seletor de Tipo de Rentabilidade para CDB/LCI/LCA
const RentabilidadeSelector = memo(({ 
  onSelect, 
  onBack,
  categoryTitle,
}: { 
  onSelect: (type: RentabilidadeType) => void; 
  onBack: () => void;
  categoryTitle: string;
}) => {
  const rentabilidadeTypes: RentabilidadeType[] = ['prefixado', 'posfixado', 'ipca'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} type="button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">{categoryTitle}</h3>
          <p className="text-sm text-muted-foreground">Tipo de Rentabilidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rentabilidadeTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <Percent className="w-6 h-6 text-primary" />
            <div className="text-left">
              <span className="font-medium text-card-foreground">{rentabilidadeLabels[type]}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {type === 'prefixado' && 'Taxa fixa definida na aplicação'}
                {type === 'posfixado' && 'Rendimento atrelado a CDI ou Selic'}
                {type === 'ipca' && 'Inflação + taxa adicional'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

RentabilidadeSelector.displayName = 'RentabilidadeSelector';

// Seletor de Indexador para Pós-fixado
const IndexadorSelector = memo(({ 
  onSelect, 
  onBack,
  categoryTitle,
  availableIndexadores,
}: { 
  onSelect: (type: IndexadorType) => void; 
  onBack: () => void;
  categoryTitle: string;
  availableIndexadores: IndexadorType[];
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} type="button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">{categoryTitle}</h3>
          <p className="text-sm text-muted-foreground">Pós-fixado - Indexador</p>
        </div>
      </div>

      <div className={`grid gap-3 ${availableIndexadores.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {availableIndexadores.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-primary mb-2" />
            <span className="font-medium text-card-foreground">{indexadorLabels[type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

IndexadorSelector.displayName = 'IndexadorSelector';

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

// Seletor de Tipo de Fundo de Renda Fixa
const FundoRFTypeSelector = memo(({ 
  onSelect, 
  onBack,
}: { 
  onSelect: (type: FundoRFType) => void; 
  onBack: () => void;
}) => {
  const fundoTypes: FundoRFType[] = ['fundo_di', 'fundo_selic', 'fundo_ipca', 'fundo_prefixado', 'fundo_multi'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} type="button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Fundo de Renda Fixa</h3>
          <p className="text-sm text-muted-foreground">Selecione o tipo de fundo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {fundoTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <Building2 className="w-6 h-6 text-primary" />
            <div className="text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-card-foreground">{fundoRFLabels[type]}</span>
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {fundoRFIndexadores[type]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fundoRFDescriptions[type]}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

FundoRFTypeSelector.displayName = 'FundoRFTypeSelector';

// Seletor genérico para outras categorias
const GenericTypeSelector = memo(({ 
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

GenericTypeSelector.displayName = 'GenericTypeSelector';

export function FixedIncomeForm({ category, onSubmit, onBack }: FixedIncomeFormProps) {
  const isSavings = category === 'savings';
  const isTreasury = category === 'treasury';
  const isFundoRF = category === 'fixedincomefund';
  const usesRentabilidade = categoriesWithRentabilidade.includes(category);
  
  // Estados de navegação
  type StepType = 'rentabilidade' | 'indexador' | 'type' | 'fundotype' | 'form';
  const getInitialStep = (): StepType => {
    if (isSavings) return 'form';
    if (usesRentabilidade) return 'rentabilidade';
    if (isTreasury) return 'type';
    if (isFundoRF) return 'fundotype';
    return 'type';
  };
  
  const [step, setStep] = useState<StepType>(getInitialStep());
  
  // Estados para cada fluxo
  const [rentabilidade, setRentabilidade] = useState<RentabilidadeType | null>(null);
  const [indexador, setIndexador] = useState<IndexadorType | null>(null);
  const [treasuryType, setTreasuryType] = useState<TreasuryType | null>(null);
  const [fundoRFType, setFundoRFType] = useState<FundoRFType | null>(null);
  const [selectedType, setSelectedType] = useState<FixedIncomeType | null>(isSavings ? 'pos' : null);
  
  const [formData, setFormData] = useState({
    name: '',
    investedAmount: '',
    interestRate: '',
    purchaseDate: '',
    maturityDate: '',
    notes: '',
    // Campos específicos para Fundos de RF
    gestora: '',
    taxaAdministracao: '',
  });

  const { rates, isLoading: ratesLoading } = useEconomicRates();

  // Determina o tipo efetivo baseado no fluxo
  const getEffectiveType = (): FixedIncomeType | null => {
    if (usesRentabilidade && rentabilidade) {
      if (rentabilidade === 'prefixado') return 'pre';
      if (rentabilidade === 'posfixado') return indexador === 'selic' ? 'pos' : 'cdi';
      if (rentabilidade === 'ipca') return 'ipca';
    }
    if (isTreasury && treasuryType) {
      if (treasuryType === 'selic') return 'pos';
      if (treasuryType === 'prefixado') return 'pre';
      if (treasuryType === 'ipca') return 'ipca';
    }
    return selectedType;
  };

  const effectiveType = getEffectiveType();
  
  // Configuração do campo de taxa
  const getRateConfig = () => {
    // CDB/LCI/LCA
    if (usesRentabilidade && rentabilidade) {
      if (rentabilidade === 'prefixado') {
        return { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' };
      }
      if (rentabilidade === 'posfixado') {
        return { 
          label: `% do ${indexador === 'selic' ? 'Selic' : 'CDI'}`, 
          placeholder: 'Ex: 110', 
          suffix: `% do ${indexador === 'selic' ? 'Selic' : 'CDI'}` 
        };
      }
      if (rentabilidade === 'ipca') {
        return { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 6', suffix: '% a.a.' };
      }
    }
    // Tesouro
    if (isTreasury && treasuryType) {
      if (treasuryType === 'prefixado') {
        return { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' };
      }
      if (treasuryType === 'ipca') {
        return { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 5.5', suffix: '% a.a.' };
      }
    }
    // Fundo RF Prefixado
    if (isFundoRF && fundoRFType === 'fundo_prefixado') {
      return { label: 'Taxa Prefixada (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' };
    }
    // Genérico
    if (effectiveType === 'pre') {
      return { label: 'Taxa (% a.a.)', placeholder: 'Ex: 12.5', suffix: '% a.a.' };
    }
    if (effectiveType === 'ipca') {
      return { label: 'Taxa adicional (IPCA +)', placeholder: 'Ex: 5.5', suffix: '% a.a.' };
    }
    return { label: '% do CDI', placeholder: 'Ex: 110', suffix: '% do CDI' };
  };
  
  const rateConfig = getRateConfig();
  
  // Determina se precisa de input de taxa
  const needsRateInput = () => {
    if (isSavings) return false; // Poupança tem regras próprias automáticas
    if (isTreasury && treasuryType === 'selic') return false;
    // Fundo Prefixado precisa de input de taxa (a taxa do ativo comprado)
    if (isFundoRF && fundoRFType === 'fundo_prefixado') return true;
    if (isFundoRF) return false; // Outros fundos não usam taxa manual
    return true;
  };

  // Determina se é taxa variável
  const isVariableRate = effectiveType === 'pos' || effectiveType === 'ipca' || effectiveType === 'cdi';

  // Handlers de seleção
  const handleSelectRentabilidade = useCallback((type: RentabilidadeType) => {
    setRentabilidade(type);
    if (type === 'posfixado') {
      setStep('indexador');
    } else {
      setStep('form');
    }
  }, []);

  const handleSelectIndexador = useCallback((type: IndexadorType) => {
    setIndexador(type);
    setStep('form');
  }, []);

  const handleSelectTreasuryType = useCallback((type: TreasuryType) => {
    setTreasuryType(type);
    setStep('form');
  }, []);

  const handleSelectFundoRFType = useCallback((type: FundoRFType) => {
    setFundoRFType(type);
    setStep('form');
  }, []);

  const handleSelectGenericType = useCallback((type: FixedIncomeType) => {
    setSelectedType(type);
    setStep('form');
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Calcula taxa efetiva da Poupança
  // Regras: Selic > 8.5% → 0.5% ao mês + TR (aproximadamente 6.17% a.a.)
  //         Selic ≤ 8.5% → 70% da Selic + TR
  const savingsAnnualRate = useMemo(() => {
    const TR = 0.1; // Taxa Referencial aproximada (atualmente muito baixa)
    if (rates.cdi > 8.5) {
      // 0.5% ao mês = (1.005^12 - 1) * 100 ≈ 6.17% ao ano + TR
      const monthlyRate = 0.5;
      const annualRate = (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100;
      return annualRate + TR;
    } else {
      // 70% da Selic + TR
      return (rates.cdi * 0.7) + TR;
    }
  }, [rates.cdi]);

  // Calcula taxa efetiva
  const effectiveRate = useMemo(() => {
    // Poupança tem regras próprias
    if (isSavings) {
      return savingsAnnualRate;
    }
    
    if (isTreasury && treasuryType === 'selic') {
      return rates.cdi;
    }
    
    const rate = parseFloat(formData.interestRate) || 0;
    
    if (effectiveType === 'ipca') {
      return rates.ipca + rate;
    } else if (effectiveType === 'pos' || effectiveType === 'cdi') {
      return (rates.cdi * rate) / 100;
    }
    return rate;
  }, [formData.interestRate, effectiveType, rates, isTreasury, treasuryType, isSavings, savingsAnnualRate]);

  // Calcula rendimento estimado
  const estimatedReturn = useMemo(() => {
    const amount = parseFloat(formData.investedAmount) || 0;
    const purchaseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
    const maturityDate = formData.maturityDate ? new Date(formData.maturityDate) : null;
    
    if (!maturityDate || amount === 0) return null;
    
    // Poupança
    if (isSavings) {
      const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years <= 0) return null;
      return amount * Math.pow(1 + savingsAnnualRate / 100, years);
    }
    
    if (isTreasury && treasuryType === 'selic') {
      const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years <= 0) return null;
      return amount * Math.pow(1 + rates.cdi / 100, years);
    }
    
    const rate = parseFloat(formData.interestRate) || 0;
    if (rate === 0 && needsRateInput()) return null;
    
    const years = (maturityDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years <= 0) return null;

    let totalRate = rate;
    if (effectiveType === 'ipca') {
      totalRate = rates.ipca + rate;
    } else if (effectiveType === 'pos' || effectiveType === 'cdi') {
      totalRate = (rates.cdi * rate) / 100;
    }
    
    return amount * Math.pow(1 + totalRate / 100, years);
  }, [formData, effectiveType, rates, isTreasury, treasuryType, isSavings, savingsAnnualRate]);

  // Handler de submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const investedAmount = parseFloat(formData.investedAmount) || 0;
    const purchaseDate = formData.purchaseDate || new Date().toISOString().split('T')[0];
    const purchaseDateObj = new Date(purchaseDate);
    const now = new Date();
    const yearsElapsed = Math.max(0, (now.getTime() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    // Para fundos RF, usamos taxa implícita baseada no tipo
    let fundoEffectiveRate = 0;
    if (isFundoRF && fundoRFType) {
      const taxaAdmin = parseFloat(formData.taxaAdministracao) || 0;
      if (fundoRFType === 'fundo_di' || fundoRFType === 'fundo_selic') {
        fundoEffectiveRate = rates.cdi - taxaAdmin;
      } else if (fundoRFType === 'fundo_ipca') {
        fundoEffectiveRate = rates.ipca - taxaAdmin;
      } else if (fundoRFType === 'fundo_prefixado') {
        // Prefixado: usa a taxa informada pelo usuário
        const userRate = parseFloat(formData.interestRate) || 0;
        fundoEffectiveRate = userRate - taxaAdmin;
      } else {
        fundoEffectiveRate = rates.cdi - taxaAdmin;
      }
    }
    
    const rateToUse = isFundoRF ? fundoEffectiveRate : effectiveRate;
    
    const currentValue = yearsElapsed > 0 && rateToUse > 0 
      ? investedAmount * Math.pow(1 + rateToUse / 100, yearsElapsed)
      : investedAmount;

    // Gera nome padrão
    let defaultName = categoryTitles[category];
    if (usesRentabilidade && rentabilidade) {
      const rentLabel = rentabilidadeLabels[rentabilidade];
      if (rentabilidade === 'posfixado' && indexador) {
        defaultName = `${categoryTitles[category]} ${indexadorLabels[indexador]}`;
      } else {
        defaultName = `${categoryTitles[category]} ${rentLabel}`;
      }
    } else if (isTreasury && treasuryType) {
      defaultName = treasuryTypeLabels[treasuryType];
    } else if (isFundoRF && fundoRFType) {
      defaultName = fundoRFLabels[fundoRFType];
    } else if (effectiveType) {
      defaultName = `${categoryTitles[category]} ${fixedIncomeLabels[effectiveType]}`;
    }

    // Monta notas adicionais para fundos
    let notesWithFundInfo = formData.notes.trim();
    if (isFundoRF) {
      const fundInfo: string[] = [];
      if (formData.gestora.trim()) fundInfo.push(`Gestora: ${formData.gestora.trim()}`);
      if (formData.taxaAdministracao.trim()) fundInfo.push(`Taxa Admin: ${formData.taxaAdministracao.trim()}% a.a.`);
      if (fundoRFType) fundInfo.push(`Tipo: ${fundoRFLabels[fundoRFType]}`);
      if (fundInfo.length > 0) {
        notesWithFundInfo = fundInfo.join(' | ') + (notesWithFundInfo ? ` | ${notesWithFundInfo}` : '');
      }
    }

    onSubmit({
      name: formData.name.trim() || defaultName,
      category: category as InvestmentCategory,
      quantity: 1,
      averagePrice: investedAmount,
      currentPrice: currentValue,
      investedAmount,
      fixedIncomeType: effectiveType || undefined,
      interestRate: rateToUse,
      purchaseDate,
      maturityDate: formData.maturityDate || undefined,
      notes: notesWithFundInfo || undefined,
    });
  }, [formData, effectiveRate, category, effectiveType, onSubmit, usesRentabilidade, rentabilidade, indexador, isTreasury, treasuryType, isFundoRF, fundoRFType, rates]);

  // Handler de voltar
  const handleBack = useCallback(() => {
    if (step === 'form') {
      if (usesRentabilidade) {
        if (rentabilidade === 'posfixado') {
          // Para categorias com apenas CDI como indexador (debentures, cricra),
          // voltar direto para rentabilidade já que o indexador é selecionado automaticamente
          if (category === 'debentures' || category === 'cricra') {
            setStep('rentabilidade');
            setRentabilidade(null);
            setIndexador(null);
          } else {
            setStep('indexador');
          }
        } else {
          setStep('rentabilidade');
          setRentabilidade(null);
        }
      } else if (isTreasury) {
        setStep('type');
        setTreasuryType(null);
      } else if (isFundoRF) {
        setStep('fundotype');
        setFundoRFType(null);
      } else if (!isSavings) {
        setStep('type');
      } else {
        onBack();
      }
    } else if (step === 'indexador') {
      setStep('rentabilidade');
      setRentabilidade(null);
      setIndexador(null);
    } else if (step === 'fundotype') {
      onBack();
    } else {
      onBack();
    }
  }, [step, usesRentabilidade, rentabilidade, isTreasury, isFundoRF, isSavings, onBack, category]);

  // Renderiza tela de seleção de rentabilidade
  if (step === 'rentabilidade') {
    return (
      <RentabilidadeSelector 
        onSelect={handleSelectRentabilidade} 
        onBack={onBack}
        categoryTitle={categoryTitles[category]}
      />
    );
  }

  // Renderiza tela de seleção de indexador
  // Debêntures e CRI/CRA só usam CDI como indexador
  const getAvailableIndexadores = (): IndexadorType[] => {
    if (category === 'debentures' || category === 'cricra') {
      return ['cdi'];
    }
    return ['cdi', 'selic'];
  };

  if (step === 'indexador') {
    const availableIndexadores = getAvailableIndexadores();
    
    // Se só tem um indexador, seleciona automaticamente
    if (availableIndexadores.length === 1) {
      handleSelectIndexador(availableIndexadores[0]);
      return null;
    }
    
    return (
      <IndexadorSelector 
        onSelect={handleSelectIndexador} 
        onBack={() => {
          setStep('rentabilidade');
          setRentabilidade(null);
        }}
        categoryTitle={categoryTitles[category]}
        availableIndexadores={availableIndexadores}
      />
    );
  }

  // Renderiza tela de seleção de tipo do Tesouro
  if (step === 'type' && isTreasury) {
    return <TreasuryTypeSelector onSelect={handleSelectTreasuryType} onBack={onBack} />;
  }

  // Renderiza seletor de tipo de Fundo de Renda Fixa
  if (step === 'fundotype') {
    return <FundoRFTypeSelector onSelect={handleSelectFundoRFType} onBack={onBack} />;
  }

  // Renderiza seletor genérico para outras categorias
  if (step === 'type' && !isSavings) {
    const genericTypes: FixedIncomeType[] = ['pos', 'pre', 'ipca', 'cdi'];
    return (
      <GenericTypeSelector 
        onSelect={handleSelectGenericType} 
        onBack={onBack} 
        types={genericTypes}
        labels={fixedIncomeLabels}
      />
    );
  }

  // Gera título e subtítulo do formulário
  const getFormTitle = () => {
    if (isTreasury && treasuryType) {
      return treasuryTypeLabels[treasuryType];
    }
    if (isFundoRF && fundoRFType) {
      return fundoRFLabels[fundoRFType];
    }
    return categoryTitles[category];
  };

  const getFormSubtitle = () => {
    if (usesRentabilidade && rentabilidade) {
      if (rentabilidade === 'posfixado' && indexador) {
        return `Pós-fixado (${indexadorLabels[indexador]})`;
      }
      if (rentabilidade === 'ipca') {
        return 'IPCA+';
      }
      return rentabilidadeLabels[rentabilidade];
    }
    if (isTreasury && treasuryType === 'selic') {
      return '100% Selic';
    }
    if (isTreasury && treasuryType === 'ipca') {
      return 'IPCA+';
    }
    if (isFundoRF && fundoRFType) {
      return `Indexador: ${fundoRFIndexadores[fundoRFType]}`;
    }
    if (effectiveType && !isSavings && !usesRentabilidade && !isTreasury) {
      return fixedIncomeLabels[effectiveType];
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBack}>
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

      {/* Mostrar informações de rendimento da Poupança */}
      {isSavings && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 text-sm text-primary mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Rendimento Calculado Automaticamente</span>
            {ratesLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selic atual:</span>
              <span className="font-semibold text-card-foreground">{rates.cdi}% a.a.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rendimento da Poupança:</span>
              <span className="font-semibold text-primary">{savingsAnnualRate.toFixed(2)}% a.a.</span>
            </div>
          </div>
          <div className="mt-3 p-2 rounded bg-secondary/50 text-xs text-muted-foreground">
            {rates.cdi > 8.5 ? (
              <p>
                <strong>Regra atual:</strong> Como a Selic está acima de 8,5% a.a., 
                a poupança rende <strong>0,5% ao mês + TR</strong> (≈{savingsAnnualRate.toFixed(2)}% ao ano)
              </p>
            ) : (
              <p>
                <strong>Regra atual:</strong> Como a Selic está igual ou abaixo de 8,5% a.a., 
                a poupança rende <strong>70% da Selic + TR</strong> (≈{savingsAnnualRate.toFixed(2)}% ao ano)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mostrar taxas atuais para tipos variáveis */}
      {!isSavings && (isVariableRate || (isTreasury && treasuryType === 'selic')) && (
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
            {(effectiveType === 'ipca' || (usesRentabilidade && rentabilidade === 'ipca') || treasuryType === 'ipca') && (
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

      {/* Aviso sobre Debêntures - sem FGC */}
      {category === 'debentures' && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2 text-sm">
            <Banknote className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">Atenção: Debêntures</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <li>• <strong>Emissor:</strong> Empresas privadas</li>
                <li>• <strong>Garantia FGC:</strong> Não possui</li>
                <li>• Avalie o risco de crédito da empresa emissora</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Aviso sobre CRI/CRA - isentos de IR, sem FGC */}
      {category === 'cricra' && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-start gap-2 text-sm">
            <Banknote className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">Informações: CRI / CRA</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <li>• <strong>Isenção de IR:</strong> Rendimentos isentos para pessoa física</li>
                <li>• <strong>Emissor:</strong> Securitizadoras</li>
                <li>• <strong>Garantia FGC:</strong> Não possui</li>
                <li>• CRI: lastro em recebíveis imobiliários</li>
                <li>• CRA: lastro em recebíveis do agronegócio</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Informações sobre Fundo de Renda Fixa */}
      {isFundoRF && fundoRFType && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-blue-600 dark:text-blue-400">Fundo de Renda Fixa</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Indexador:</span>
                  <span className="ml-1 font-semibold text-card-foreground">{fundoRFIndexadores[fundoRFType]}</span>
                </div>
                {fundoRFType !== 'fundo_prefixado' && (
                  <div>
                    <span className="text-muted-foreground">Taxa atual:</span>
                    <span className="ml-1 font-semibold text-card-foreground">
                      {fundoRFType === 'fundo_ipca' ? `${rates.ipca}%` : `${rates.cdi}%`} a.a.
                    </span>
                    {ratesLoading && <RefreshCw className="w-3 h-3 inline ml-1 animate-spin" />}
                  </div>
                )}
              </div>
              <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                <li>• <strong>Garantia FGC:</strong> Não possui</li>
                <li>• <strong>Come-cotas:</strong> Pode haver incidência semestral</li>
                <li>• Rentabilidade segue o índice do tipo de fundo</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome do {isFundoRF ? 'Fundo' : 'Investimento'}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={isFundoRF ? 'Ex: XP Referenciado DI FI' : `Ex: ${getFormTitle()} 2029`}
          />
        </div>

        {/* Campos específicos para Fundos de RF */}
        {isFundoRF && (
          <>
            <div>
              <Label htmlFor="gestora">Gestora</Label>
              <Input
                id="gestora"
                value={formData.gestora}
                onChange={(e) => handleInputChange('gestora', e.target.value)}
                placeholder="Ex: XP Asset Management"
              />
            </div>
            <div>
              <Label htmlFor="taxaAdministracao">Taxa de Administração</Label>
              <div className="relative">
                <Input
                  id="taxaAdministracao"
                  type="number"
                  step="any"
                  value={formData.taxaAdministracao}
                  onChange={(e) => handleInputChange('taxaAdministracao', e.target.value)}
                  placeholder="Ex: 0.5"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  % a.a.
                </span>
              </div>
            </div>
          </>
        )}

        <div className={needsRateInput() || isFundoRF ? '' : 'col-span-2'}>
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

        {needsRateInput() && (
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
                className="pr-20"
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