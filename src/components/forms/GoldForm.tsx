import { useState, useEffect } from 'react';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface GoldFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

type GoldType = 'physical' | 'digital';
type Step = 'select' | 'form';

const goldPurities = [
  { value: 24, label: '24K (99.9% puro)' },
  { value: 22, label: '22K (91.6%)' },
  { value: 18, label: '18K (75%)' },
  { value: 14, label: '14K (58.5%)' },
  { value: 10, label: '10K (41.7%)' },
];

export function GoldForm({ onSubmit, onBack }: GoldFormProps) {
  const [step, setStep] = useState<Step>('select');
  const [goldType, setGoldType] = useState<GoldType>('physical');
  
  // Physical gold form data
  const [physicalFormData, setPhysicalFormData] = useState({
    name: '',
    weightGrams: '',
    purity: 18,
    purchasePrice: '',
    purchaseDate: '',
    notes: '',
  });

  // Digital gold (PAXG) form data
  const [digitalFormData, setDigitalFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const { pricePerGram, isLoading: isLoadingGoldPrice, lastUpdate: goldLastUpdate, fetchPrice } = useGoldPrice();
  const { prices: cryptoPrices, isLoading: isLoadingCrypto, fetchPrices: fetchCryptoPrices, getPrice, getPriceChange } = useCryptoPrices();
  
  const [currentPhysicalValue, setCurrentPhysicalValue] = useState<number | null>(null);

  // Fetch PAXG price on mount
  useEffect(() => {
    if (goldType === 'digital') {
      fetchCryptoPrices(['PAXG']);
    }
  }, [goldType, fetchCryptoPrices]);

  // Calculate physical gold current value
  useEffect(() => {
    if (pricePerGram && physicalFormData.weightGrams) {
      const weight = parseFloat(physicalFormData.weightGrams) || 0;
      const purityMultiplier = physicalFormData.purity / 24;
      const value = weight * pricePerGram * purityMultiplier;
      setCurrentPhysicalValue(value);
    } else {
      setCurrentPhysicalValue(null);
    }
  }, [pricePerGram, physicalFormData.weightGrams, physicalFormData.purity]);

  // Update digital gold price in form when fetched
  useEffect(() => {
    const paxgPrice = getPrice('PAXG');
    if (paxgPrice && !digitalFormData.averagePrice) {
      setDigitalFormData(prev => ({ ...prev, averagePrice: paxgPrice.toFixed(2) }));
    }
  }, [cryptoPrices, getPrice, digitalFormData.averagePrice]);

  const handleSelectGoldType = (type: GoldType) => {
    setGoldType(type);
    setStep('form');
  };

  const handlePhysicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weight = parseFloat(physicalFormData.weightGrams) || 0;
    const purchasePrice = parseFloat(physicalFormData.purchasePrice) || 0;
    const purityMultiplier = physicalFormData.purity / 24;
    
    onSubmit({
      name: physicalFormData.name || `Ouro ${physicalFormData.purity}K - ${weight}g`,
      category: 'gold',
      ticker: 'GOLD',
      quantity: weight,
      averagePrice: purchasePrice / weight || 0,
      currentPrice: pricePerGram ? pricePerGram * purityMultiplier : purchasePrice / weight,
      investedAmount: purchasePrice,
      goldType: 'physical',
      goldPurity: `${physicalFormData.purity}K`,
      purchaseDate: physicalFormData.purchaseDate || undefined,
      notes: physicalFormData.notes.trim() || undefined,
    });
  };

  const handleDigitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(digitalFormData.quantity) || 0;
    const averagePrice = parseFloat(digitalFormData.averagePrice) || 0;
    const currentPaxgPrice = getPrice('PAXG') || averagePrice;
    
    onSubmit({
      name: `PAX Gold (PAXG) - ${quantity} unidades`,
      category: 'gold',
      ticker: 'PAXG',
      quantity: quantity,
      averagePrice: averagePrice,
      currentPrice: currentPaxgPrice,
      investedAmount: quantity * averagePrice,
      goldType: 'digital',
      goldPurity: '24K',
      currency: 'USD',
      purchaseDate: digitalFormData.purchaseDate || undefined,
      notes: digitalFormData.notes.trim() || undefined,
    });
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('select');
    } else {
      onBack();
    }
  };

  // Gold type selection screen
  if (step === 'select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" type="button" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">
            Adicionar Ouro
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Escolha o tipo de ouro que deseja adicionar ao seu portfólio:
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            type="button"
            onClick={() => handleSelectGoldType('physical')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
          >
            <svg className="w-12 h-12 text-amber-500" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 44L16 20H48L56 44H8Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M8 44L16 52H48L56 44H8Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M16 20L24 12H40L48 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M24 12V20M40 12V20" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16 20H48" stroke="currentColor" strokeWidth="1.5"/>
              <text x="32" y="40" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold">AU</text>
            </svg>
            <div className="text-center">
              <h4 className="font-semibold text-card-foreground">Ouro Físico</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Barras, joias, moedas
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectGoldType('digital')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
          >
            <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="24" fill="#F7931A" fillOpacity="0.2" stroke="#F7931A" strokeWidth="2"/>
              <circle cx="32" cy="32" r="18" fill="#FFD700" fillOpacity="0.3" stroke="#FFD700" strokeWidth="1.5"/>
              <text x="32" y="28" textAnchor="middle" fill="#F7931A" fontSize="8" fontWeight="bold">PAX</text>
              <text x="32" y="40" textAnchor="middle" fill="#FFD700" fontSize="10" fontWeight="bold">GOLD</text>
            </svg>
            <div className="text-center">
              <h4 className="font-semibold text-card-foreground">Ouro Digital</h4>
              <p className="text-xs text-muted-foreground mt-1">
                PAX Gold (PAXG)
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Physical gold form
  if (goldType === 'physical') {
    return (
      <form onSubmit={handlePhysicalSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" type="button" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 44L16 20H48L56 44H8Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M8 44L16 52H48L56 44H8Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-lg font-semibold text-card-foreground">
              Ouro Físico
            </h3>
          </div>
        </div>

        {/* Preço do Ouro em Tempo Real */}
        <div className="p-3 rounded-lg bg-accent/20 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Preço do Ouro ({physicalFormData.purity}K)</div>
              <div className="text-xl font-bold text-foreground">
                {isLoadingGoldPrice ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : pricePerGram ? (
                  `R$ ${(pricePerGram * (physicalFormData.purity / 24)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g`
                ) : (
                  'Carregando...'
                )}
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={fetchPrice} disabled={isLoadingGoldPrice}>
              Atualizar
            </Button>
          </div>
          {goldLastUpdate && (
            <div className="text-xs text-muted-foreground mt-1">
              Atualizado: {goldLastUpdate.toLocaleTimeString('pt-BR')}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="name">Descrição</Label>
          <Input
            id="name"
            value={physicalFormData.name}
            onChange={(e) => setPhysicalFormData(prev => ({ ...prev, name: e.target.value }))}
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
              value={physicalFormData.weightGrams}
              onChange={(e) => setPhysicalFormData(prev => ({ ...prev, weightGrams: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="purity">Pureza *</Label>
            <select
              id="purity"
              value={physicalFormData.purity}
              onChange={(e) => setPhysicalFormData(prev => ({ ...prev, purity: parseInt(e.target.value) }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {goldPurities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Valor Atual Calculado */}
        {currentPhysicalValue && currentPhysicalValue > 0 && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="text-sm text-muted-foreground mb-1">Valor Atual Estimado</div>
            <div className="text-2xl font-bold text-success">
              R$ {currentPhysicalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {physicalFormData.weightGrams}g × R$ {((pricePerGram || 0) * (physicalFormData.purity / 24)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g ({physicalFormData.purity}K)
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
              value={physicalFormData.purchasePrice}
              onChange={(e) => setPhysicalFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="purchaseDate">Data da Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={physicalFormData.purchaseDate}
              onChange={(e) => setPhysicalFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={physicalFormData.notes}
            onChange={(e) => setPhysicalFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Detalhes sobre a peça, onde está guardada..."
            rows={2}
          />
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

  // Digital gold (PAXG) form
  const paxgPrice = getPrice('PAXG');
  const paxgChange = getPriceChange('PAXG');
  const digitalQuantity = parseFloat(digitalFormData.quantity) || 0;
  const digitalAvgPrice = parseFloat(digitalFormData.averagePrice) || 0;
  const digitalCurrentValue = digitalQuantity * (paxgPrice || digitalAvgPrice);
  const digitalInvestedValue = digitalQuantity * digitalAvgPrice;

  return (
    <form onSubmit={handleDigitalSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="24" fill="#F7931A" fillOpacity="0.2" stroke="#F7931A" strokeWidth="2"/>
            <circle cx="32" cy="32" r="18" fill="#FFD700" fillOpacity="0.3" stroke="#FFD700" strokeWidth="1.5"/>
          </svg>
          <h3 className="text-lg font-semibold text-card-foreground">
            Ouro Digital - PAX Gold
          </h3>
        </div>
      </div>

      {/* PAXG Info Card */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="24" fill="#F7931A" fillOpacity="0.2" stroke="#F7931A" strokeWidth="2"/>
            <circle cx="32" cy="32" r="18" fill="#FFD700" fillOpacity="0.3" stroke="#FFD700" strokeWidth="1.5"/>
            <text x="32" y="28" textAnchor="middle" fill="#F7931A" fontSize="8" fontWeight="bold">PAX</text>
            <text x="32" y="40" textAnchor="middle" fill="#FFD700" fontSize="10" fontWeight="bold">GOLD</text>
          </svg>
          <div>
            <div className="font-semibold text-card-foreground">PAX Gold (PAXG)</div>
            <div className="text-xs text-muted-foreground">1 PAXG = 1 onça troy de ouro físico</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Preço Atual</div>
            <div className="text-xl font-bold text-foreground">
              {isLoadingCrypto ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : paxgPrice ? (
                `$${paxgPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              ) : (
                'Carregando...'
              )}
            </div>
          </div>
          {paxgChange && (
            <div className={cn(
              "text-sm font-medium px-2 py-1 rounded",
              paxgChange.percent >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            )}>
              {paxgChange.percent >= 0 ? '+' : ''}{paxgChange.percent.toFixed(2)}%
            </div>
          )}
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantidade (PAXG) *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.0001"
            value={digitalFormData.quantity}
            onChange={(e) => setDigitalFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="0.0000"
            required
          />
        </div>

        <div>
          <Label htmlFor="averagePrice">Preço Médio (USD) *</Label>
          <Input
            id="averagePrice"
            type="number"
            step="0.01"
            value={digitalFormData.averagePrice}
            onChange={(e) => setDigitalFormData(prev => ({ ...prev, averagePrice: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Calculated values */}
      {digitalQuantity > 0 && digitalAvgPrice > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="text-xs text-muted-foreground">Valor Investido</div>
            <div className="text-lg font-bold text-card-foreground">
              ${digitalInvestedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          
          {paxgPrice && (
            <div className={cn(
              "p-3 rounded-lg border",
              digitalCurrentValue >= digitalInvestedValue 
                ? "bg-success/10 border-success/30" 
                : "bg-destructive/10 border-destructive/30"
            )}>
              <div className="text-xs text-muted-foreground">Valor Atual</div>
              <div className={cn(
                "text-lg font-bold",
                digitalCurrentValue >= digitalInvestedValue ? "text-success" : "text-destructive"
              )}>
                ${digitalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="digitalPurchaseDate">Data da Compra</Label>
        <Input
          id="digitalPurchaseDate"
          type="date"
          value={digitalFormData.purchaseDate}
          onChange={(e) => setDigitalFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="digitalNotes">Observações</Label>
        <Textarea
          id="digitalNotes"
          value={digitalFormData.notes}
          onChange={(e) => setDigitalFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Exchange onde comprou, wallet onde está guardado..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700">
          <Check className="w-4 h-4" />
          Adicionar PAXG
        </Button>
      </div>
    </form>
  );
}
