import { useState, useMemo } from 'react';
import { Check, ArrowLeft, Banknote, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Investment } from '@/types/investment';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';
import { useEurBrlRate } from '@/hooks/useEurBrlRate';
import { useEconomicRates } from '@/hooks/useEconomicRates';

interface CashFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

type CashType = 'menu' | 'fisico' | 'banco';
type CurrencyType = 'BRL' | 'USD' | 'EUR';

const currencyOptions = [
  { id: 'BRL', name: 'Real (R$)', icon: '🇧🇷', symbol: 'R$' },
  { id: 'USD', name: 'Dólar (US$)', icon: '🇺🇸', symbol: 'US$' },
  { id: 'EUR', name: 'Euro (€)', icon: '🇪🇺', symbol: '€' },
];

export function CashForm({ onSubmit, onBack }: CashFormProps) {
  const [cashType, setCashType] = useState<CashType>('menu');
  const [currency, setCurrency] = useState<CurrencyType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    notes: '',
    isYielding: false,
    yieldType: '' as '' | 'cdi' | 'prefixado',
    cdiPercent: '',
  });

  const { rate: usdRate } = useUsdBrlRate();
  const { rate: eurRate } = useEurBrlRate();
  const { rates, isLoading: ratesLoading } = useEconomicRates();

  // Calcula taxa efetiva do CDI
  const effectiveRate = useMemo(() => {
    if (formData.yieldType === 'cdi' && formData.cdiPercent) {
      const percent = parseFloat(formData.cdiPercent) || 0;
      return (rates.cdi * percent) / 100;
    }
    return null;
  }, [formData.yieldType, formData.cdiPercent, rates.cdi]);

  const getExchangeRate = (curr: CurrencyType): number => {
    switch (curr) {
      case 'USD': return usdRate;
      case 'EUR': return eurRate;
      default: return 1;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount) || 0;
    const exchangeRate = currency ? getExchangeRate(currency) : 1;
    const amountInBrl = amount * exchangeRate;
    
    const categoryName = cashType === 'fisico' ? 'Dinheiro Físico' : 'Dinheiro em Banco';
    const currencyLabel = currencyOptions.find(c => c.id === currency)?.name || 'Real';
    const defaultName = `${categoryName} - ${currencyLabel}`;
    
    onSubmit({
      name: formData.name || defaultName,
      category: 'cash',
      quantity: 1,
      averagePrice: amountInBrl,
      currentPrice: amountInBrl,
      investedAmount: amountInBrl,
      currency: currency || 'BRL',
      interestRate: cashType === 'banco' && formData.isYielding ? parseFloat(formData.cdiPercent) || 0 : undefined,
      notes: formData.notes.trim() || undefined,
      bank: cashType === 'banco' ? 'sim' : undefined,
    });
  };

  const handleBack = () => {
    if (currency) {
      setCurrency(null);
      setFormData({
        name: '',
        amount: '',
        notes: '',
        isYielding: false,
        yieldType: '',
        cdiPercent: '',
      });
    } else if (cashType !== 'menu') {
      setCashType('menu');
    } else {
      onBack();
    }
  };

  const getTitle = () => {
    if (currency) {
      const currLabel = currencyOptions.find(c => c.id === currency)?.name;
      return cashType === 'fisico' ? `Dinheiro Físico - ${currLabel}` : `Dinheiro em Banco - ${currLabel}`;
    }
    if (cashType === 'fisico') return 'Dinheiro Físico';
    if (cashType === 'banco') return 'Dinheiro em Banco';
    return 'Dinheiro em Espécie';
  };

  const currencySymbol = currency ? currencyOptions.find(c => c.id === currency)?.symbol : 'R$';

  // Main menu - Físico or Banco
  if (cashType === 'menu') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" type="button" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">
            Dinheiro em Espécie
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCashType('fisico')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="p-4 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <Banknote className="w-8 h-8 text-green-500" />
            </div>
            <span className="font-medium text-card-foreground">Físico</span>
            <span className="text-xs text-muted-foreground text-center">
              Dinheiro em espécie guardado
            </span>
          </button>

          <button
            onClick={() => setCashType('banco')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <span className="font-medium text-card-foreground">Banco</span>
            <span className="text-xs text-muted-foreground text-center">
              Conta corrente ou poupança
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Currency selection menu
  if (!currency) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" type="button" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">
            {getTitle()} - Selecione a Moeda
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {currencyOptions.map((curr) => (
            <button
              key={curr.id}
              onClick={() => setCurrency(curr.id as CurrencyType)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <span className="text-3xl">{curr.icon}</span>
              <span className="font-medium text-card-foreground text-sm">{curr.id}</span>
              <span className="text-xs text-muted-foreground text-center">
                {curr.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Form for entering details
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">
          {getTitle()}
        </h3>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Descrição</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={cashType === 'fisico' 
              ? "Ex: Cofre, Carteira, Reserva..." 
              : "Ex: Nubank, Itaú, Bradesco..."
            }
          />
        </div>

        <div>
          <Label htmlFor="amount">Valor Total ({currencySymbol}) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            required
          />
          {currency !== 'BRL' && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ R$ {((parseFloat(formData.amount) || 0) * getExchangeRate(currency)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {cashType === 'banco' && currency === 'BRL' && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-primary ${ratesLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-primary">
                CDI Atual: {rates.cdi.toFixed(2)}% a.a.
              </span>
            </div>
          </div>
        )}

        {cashType === 'banco' && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div>
              <Label className="text-base">Está Rendendo?</Label>
              <p className="text-xs text-muted-foreground mb-3">Seu dinheiro está rendendo juros?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isYielding: true }))}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border-2 transition-all duration-200 text-sm ${
                    formData.isYielding 
                      ? 'border-green-500 bg-green-500/10 text-green-600' 
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${formData.isYielding ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Sim</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isYielding: false, yieldType: '', cdiPercent: '' }))}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border-2 transition-all duration-200 text-sm ${
                    !formData.isYielding 
                      ? 'border-red-500 bg-red-500/10 text-red-600' 
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="font-medium">Não</span>
                </button>
              </div>
            </div>

            {formData.isYielding && currency === 'BRL' && (
              <div>
                <Label className="text-base">Tipo de Rendimento</Label>
                <p className="text-xs text-muted-foreground mb-3">Selecione como seu dinheiro está rendendo</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, yieldType: 'cdi', cdiPercent: '' }))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border-2 transition-all duration-200 text-sm ${
                      formData.yieldType === 'cdi'
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="font-medium">CDI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, yieldType: 'prefixado', cdiPercent: '' }))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border-2 transition-all duration-200 text-sm ${
                      formData.yieldType === 'prefixado'
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="font-medium">Prefixado</span>
                  </button>
                </div>
              </div>
            )}

            {formData.isYielding && formData.yieldType === 'cdi' && currency === 'BRL' && (
              <div>
                <Label htmlFor="cdiPercent">Percentual do CDI (%)</Label>
                <Input
                  id="cdiPercent"
                  type="number"
                  step="0.01"
                  value={formData.cdiPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, cdiPercent: e.target.value }))}
                  placeholder="Ex: 100"
                />
                {formData.cdiPercent && effectiveRate !== null && (
                  <p className="text-xs text-primary mt-1 font-medium">
                    ≈ {effectiveRate.toFixed(2)}% a.a. ({formData.cdiPercent}% de {rates.cdi.toFixed(2)}%)
                  </p>
                )}
              </div>
            )}

            {formData.isYielding && (formData.yieldType === 'prefixado' || currency !== 'BRL') && (
              <div>
                <Label htmlFor="cdiPercent">Percentual de Rendimento ao ano (%)</Label>
                <Input
                  id="cdiPercent"
                  type="number"
                  step="0.01"
                  value={formData.cdiPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, cdiPercent: e.target.value }))}
                  placeholder="Ex: 14% a.a."
                />
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Anotações adicionais..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
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
