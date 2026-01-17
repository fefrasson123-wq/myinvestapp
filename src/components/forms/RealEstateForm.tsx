import { useState } from 'react';
import { Check, ArrowLeft, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface RealEstateFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

export function RealEstateForm({ onSubmit, onBack }: RealEstateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    purchasePrice: '',
    purchaseDate: '',
    annualAppreciation: '7.73',
    paysRent: false,
    monthlyRent: '',
  });

  const calculateCurrentValue = () => {
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
              📌 Observações: Coloque a valorização anual do Imóvel.
            </p>
            <p className="text-sm text-muted-foreground">
              Média Nacional <span className="font-semibold text-primary">7,73% a.a.</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Mas tem regiões que podem superar <span className="font-semibold text-success">10%</span>.
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

      {/* Valorização Anual */}
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

      {/* Paga aluguel? */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="paysRent" className="cursor-pointer">Paga aluguel?</Label>
          <Switch
            id="paysRent"
            checked={formData.paysRent}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paysRent: checked }))}
          />
        </div>
        
        {formData.paysRent && (
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
