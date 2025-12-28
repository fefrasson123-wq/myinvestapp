import { useState } from 'react';
import { Check, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment, RealEstateType, realEstateLabels } from '@/types/investment';
import { cn } from '@/lib/utils';

interface RealEstateFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

// Preço médio por m² por estado (estimativa 2025)
const pricePerM2ByState: Record<string, number> = {
  'SP': 10500,
  'RJ': 9800,
  'DF': 9200,
  'SC': 8500,
  'RS': 7200,
  'PR': 7800,
  'MG': 6500,
  'BA': 5800,
  'PE': 5500,
  'CE': 5200,
  'GO': 6000,
  'ES': 6800,
  'MT': 5500,
  'MS': 5000,
  'PA': 4500,
  'AM': 4800,
  'MA': 4200,
  'RN': 4800,
  'PB': 4500,
  'PI': 4000,
  'AL': 4500,
  'SE': 4800,
  'TO': 4200,
  'RO': 4000,
  'AC': 3800,
  'AP': 3500,
  'RR': 3500,
};

// Multiplicadores por tipo de imóvel
const typeMultipliers: Record<RealEstateType, number> = {
  apartment: 1.2,
  house: 1.0,
  commercial: 0.9,
  lot: 0.5,
  land: 0.3,
};

const realEstateTypes: { id: RealEstateType; label: string }[] = [
  { id: 'house', label: 'Casa' },
  { id: 'apartment', label: 'Apartamento' },
  { id: 'lot', label: 'Lote' },
  { id: 'land', label: 'Terreno' },
  { id: 'commercial', label: 'Comercial' },
];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function RealEstateForm({ onSubmit, onBack }: RealEstateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'house' as RealEstateType,
    address: '',
    city: '',
    state: 'SP',
    areaM2: '',
    purchasePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);

  // Calcula valor estimado baseado em área e localização
  const calculateEstimatedValue = () => {
    const area = parseFloat(formData.areaM2) || 0;
    const basePrice = pricePerM2ByState[formData.state] || 5000;
    const multiplier = typeMultipliers[formData.type];
    
    const estimated = area * basePrice * multiplier;
    setEstimatedValue(estimated);
    return estimated;
  };

  const handleAreaChange = (value: string) => {
    setFormData(prev => ({ ...prev, areaM2: value }));
    if (value && parseFloat(value) > 0) {
      setTimeout(calculateEstimatedValue, 100);
    } else {
      setEstimatedValue(null);
    }
  };

  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value }));
    setTimeout(calculateEstimatedValue, 100);
  };

  const handleTypeChange = (type: RealEstateType) => {
    setFormData(prev => ({ ...prev, type }));
    setTimeout(calculateEstimatedValue, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const area = parseFloat(formData.areaM2) || 0;
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const currentValue = estimatedValue || purchasePrice;
    
    onSubmit({
      name: formData.name || `${realEstateLabels[formData.type]} - ${formData.city}`,
      category: 'realestate',
      quantity: 1,
      averagePrice: purchasePrice,
      currentPrice: currentValue,
      investedAmount: purchasePrice,
      realEstateType: formData.type,
      address: formData.address || undefined,
      areaM2: area || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
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
          Adicionar Imóvel
        </h3>
      </div>

      {/* Tipo de Imóvel */}
      <div>
        <Label>Tipo de Imóvel *</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
          {realEstateTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTypeChange(type.id)}
              className={cn(
                "py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                formData.type === type.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nome/Descrição</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Casa na Praia, Apartamento Centro..."
        />
      </div>

      <div>
        <Label htmlFor="address">Endereço</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Rua, número, bairro..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="São Paulo"
          />
        </div>

        <div>
          <Label htmlFor="state">Estado *</Label>
          <select
            id="state"
            value={formData.state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {brazilianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="areaM2">Área (m²) *</Label>
          <Input
            id="areaM2"
            type="number"
            step="0.01"
            value={formData.areaM2}
            onChange={(e) => handleAreaChange(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="purchasePrice">Preço de Compra (R$)</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Valor Estimado */}
      {estimatedValue && estimatedValue > 0 && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="text-sm text-muted-foreground mb-1">Valor Estimado Atual</div>
          <div className="text-2xl font-bold text-success">
            R$ {estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Baseado em R$ {(pricePerM2ByState[formData.state] * typeMultipliers[formData.type]).toLocaleString('pt-BR')}/m² para {realEstateLabels[formData.type].toLowerCase()} em {formData.state}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="purchaseDate">Data da Compra</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Detalhes adicionais sobre o imóvel..."
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
