import { useState, useEffect } from 'react';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useGoldPrice } from '@/hooks/useGoldPrice';

interface GoldFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

const goldPurities = [
  { value: 24, label: '24K (99.9% puro)' },
  { value: 22, label: '22K (91.6%)' },
  { value: 18, label: '18K (75%)' },
  { value: 14, label: '14K (58.5%)' },
  { value: 10, label: '10K (41.7%)' },
];

export function GoldForm({ onSubmit, onBack }: GoldFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    weightGrams: '',
    purity: 18,
    purchasePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const { pricePerGram, isLoading, lastUpdate, fetchPrice } = useGoldPrice();
  const [currentValue, setCurrentValue] = useState<number | null>(null);

  // Calcula o valor atual baseado no peso e pureza
  useEffect(() => {
    if (pricePerGram && formData.weightGrams) {
      const weight = parseFloat(formData.weightGrams) || 0;
      const purityMultiplier = formData.purity / 24; // 24K = 100%
      const value = weight * pricePerGram * purityMultiplier;
      setCurrentValue(value);
    } else {
      setCurrentValue(null);
    }
  }, [pricePerGram, formData.weightGrams, formData.purity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weight = parseFloat(formData.weightGrams) || 0;
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const purityMultiplier = formData.purity / 24;
    const calculatedCurrentValue = pricePerGram ? weight * pricePerGram * purityMultiplier : purchasePrice;
    
    onSubmit({
      name: formData.name || `Ouro ${formData.purity}K - ${weight}g`,
      category: 'gold',
      ticker: 'GOLD',
      quantity: weight,
      averagePrice: purchasePrice / weight || 0,
      currentPrice: pricePerGram ? pricePerGram * purityMultiplier : purchasePrice / weight,
      investedAmount: purchasePrice,
      weightGrams: weight,
      purity: formData.purity,
      purchaseDate: formData.purchaseDate || undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">
          Adicionar Ouro
        </h3>
      </div>

      {/* Preço do Ouro em Tempo Real */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Preço do Ouro (24K)</div>
            <div className="text-xl font-bold text-amber-500">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : pricePerGram ? (
                `R$ ${pricePerGram.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g`
              ) : (
                'Carregando...'
              )}
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={fetchPrice} disabled={isLoading}>
            Atualizar
          </Button>
        </div>
        {lastUpdate && (
          <div className="text-xs text-muted-foreground mt-1">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="name">Descrição</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Colar, Anel, Barra de ouro..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weightGrams">Peso (gramas) *</Label>
          <Input
            id="weightGrams"
            type="number"
            step="0.01"
            value={formData.weightGrams}
            onChange={(e) => setFormData(prev => ({ ...prev, weightGrams: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="purity">Pureza *</Label>
          <select
            id="purity"
            value={formData.purity}
            onChange={(e) => setFormData(prev => ({ ...prev, purity: parseInt(e.target.value) }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {goldPurities.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Valor Atual Calculado */}
      {currentValue && currentValue > 0 && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="text-sm text-muted-foreground mb-1">Valor Atual Estimado</div>
          <div className="text-2xl font-bold text-success">
            R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formData.weightGrams}g × R$ {((pricePerGram || 0) * (formData.purity / 24)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g ({formData.purity}K)
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchasePrice">Preço de Compra Total (R$) *</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="purchaseDate">Data da Compra</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Detalhes sobre a peça, onde está guardada..."
          rows={2}
        />
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
