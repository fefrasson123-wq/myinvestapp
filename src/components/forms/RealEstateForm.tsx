import { useState } from 'react';
import { Check, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';

interface RealEstateFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

export function RealEstateForm({ onSubmit, onBack }: RealEstateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    purchasePrice: '',
    currentValue: '',
    purchaseDate: '',
    knowsAppreciation: null as boolean | null,
    annualAppreciation: '7.73',
    paysRent: null as boolean | null,
    monthlyRent: '',
  });

  const calculateCurrentValue = () => {
    // If user provided a current value, use it
    if (formData.currentValue && parseFloat(formData.currentValue) > 0) {
      return parseFloat(formData.currentValue);
    }

    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const annualRate = parseFloat(formData.annualAppreciation) || 7.73;
    const purchaseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : null;
    
    if (!purchaseDate || purchasePrice === 0) {
      return purchasePrice;
    }

    const now = new Date();
    const yearsHeld = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (yearsHeld <= 0) {
      return purchasePrice;
    }

    // Compound appreciation
    const currentValue = purchasePrice * Math.pow(1 + annualRate / 100, yearsHeld);
    return currentValue;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const currentValue = calculateCurrentValue();
    
    // Build notes with rent info if applicable
    let notes = `Valorização anual: ${formData.annualAppreciation}% a.a.`;
    if (formData.paysRent && formData.monthlyRent) {
      notes += ` | Aluguel mensal: R$ ${parseFloat(formData.monthlyRent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    
    onSubmit({
      name: formData.name,
      category: 'realestate',
      quantity: 1,
      averagePrice: purchasePrice,
      currentPrice: currentValue,
      investedAmount: purchasePrice,
      purchaseDate: formData.purchaseDate || undefined,
      interestRate: parseFloat(formData.annualAppreciation) || 7.73,
      dividends: formData.paysRent ? parseFloat(formData.monthlyRent) || 0 : undefined,
      notes: notes,
    });
  };

  const currentValue = calculateCurrentValue();
  const profitLoss = currentValue - (parseFloat(formData.purchasePrice) || 0);
  const profitLossPercent = parseFloat(formData.purchasePrice) > 0 
    ? (profitLoss / parseFloat(formData.purchasePrice)) * 100 
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">
          Adicionar Imóvel
        </h3>
      </div>

      {/* Observações sobre valorização */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              📌 Informe a valorização anual do imóvel ou o valor atual do imóvel para calcularmos o seu ganho.
            </p>
            <p className="text-sm text-muted-foreground">
              Média Nacional <span className="font-semibold text-primary">7,73% a.a.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Nome */}
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Casa na Praia, Apartamento Centro..."
          required
        />
      </div>

      {/* Valor de Compra */}
      <div>
        <Label htmlFor="purchasePrice">Valor de Compra (R$) *</Label>
        <Input
          id="purchasePrice"
          type="number"
          step="0.01"
          value={formData.purchasePrice}
          onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
          placeholder="500000.00"
          required
        />
      </div>

      {/* Data de Compra */}
      <div>
        <Label htmlFor="purchaseDate">Data de Compra</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
        />
      </div>

      {/* Sabe a Valorização Anual? */}
      <div className="space-y-3">
        <div>
          <Label>Sabe a Valorização Anual? (% a.a.)</Label>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, knowsAppreciation: true, currentValue: '' }))}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border",
                formData.knowsAppreciation === true
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, knowsAppreciation: false, annualAppreciation: '' }))}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border",
                formData.knowsAppreciation === false
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              Não
            </button>
          </div>
        </div>
        
        {formData.knowsAppreciation === true && (
          <div>
            <Label htmlFor="annualAppreciation">Valorização Anual (% a.a.) *</Label>
            <Input
              id="annualAppreciation"
              type="number"
              step="0.01"
              value={formData.annualAppreciation}
              onChange={(e) => setFormData(prev => ({ ...prev, annualAppreciation: e.target.value }))}
              placeholder="7.73"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Padrão: 7,73% a.a. (média nacional)
            </p>
          </div>
        )}

        {formData.knowsAppreciation === false && (
          <div>
            <Label htmlFor="currentValue">Valor Atual do Imóvel (R$) *</Label>
            <Input
              id="currentValue"
              type="number"
              step="0.01"
              value={formData.currentValue}
              onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
              placeholder="550000.00"
              required
            />
          </div>
        )}
      </div>

      {/* Paga aluguel? */}
      <div className="space-y-3">
        <div>
          <Label>Paga aluguel?</Label>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paysRent: true }))}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border",
                formData.paysRent === true
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paysRent: false, monthlyRent: '' }))}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border",
                formData.paysRent === false
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              Não
            </button>
          </div>
        </div>
        
        {formData.paysRent === true && (
          <div>
            <Label htmlFor="monthlyRent">Aluguel Mensal (R$)</Label>
            <Input
              id="monthlyRent"
              type="number"
              step="0.01"
              value={formData.monthlyRent}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
              placeholder="2500.00"
            />
          </div>
        )}
      </div>

      {/* Preview de valorização */}
      {formData.purchasePrice && parseFloat(formData.purchasePrice) > 0 && formData.purchaseDate && (
        <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Valor Estimado Atual</p>
          <p className="text-2xl font-bold text-primary">
            R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={cn(
            "text-sm font-medium",
            profitLoss >= 0 ? "text-success" : "text-destructive"
          )}>
            {profitLoss >= 0 ? '+' : ''}R$ {profitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
          </p>
          <p className="text-xs text-muted-foreground">
            Baseado em {formData.annualAppreciation}% a.a. desde a data de compra
          </p>
        </div>
      )}

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
