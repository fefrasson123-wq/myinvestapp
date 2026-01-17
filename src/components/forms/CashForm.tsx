import { useState } from 'react';
import { Check, ArrowLeft, Banknote, Building2, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Investment } from '@/types/investment';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';
import { useEurBrlRate } from '@/hooks/useEurBrlRate';

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
    cdiPercent: '',
  });

  const { rate: usdRate } = useUsdBrlRate();
  const { rate: eurRate } = useEurBrlRate();

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

        {cashType === 'banco' && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isYielding" className="text-base">Está Rendendo?</Label>
                <p className="text-xs text-muted-foreground">Ativar se seu dinheiro rende</p>
              </div>
              <Switch
                id="isYielding"
                checked={formData.isYielding}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isYielding: checked }))}
              />
            </div>

            {formData.isYielding && (
              <div>
                <Label htmlFor="cdiPercent">
                  {currency === 'BRL' ? 'Percentual do CDI (%)' : 'Percentual de Rendimento ao ano (%)'}
                </Label>
                <Input
                  id="cdiPercent"
                  type="number"
                  step="0.01"
                  value={formData.cdiPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, cdiPercent: e.target.value }))}
                  placeholder={currency === 'BRL' ? 'Ex: 100% CDI a.a.' : 'Ex: 14% a.a.'}
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
