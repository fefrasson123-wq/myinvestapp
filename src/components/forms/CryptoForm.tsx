import { useState, useMemo } from 'react';
import { Search, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cryptoList, searchCrypto, CryptoAsset } from '@/data/cryptoList';
import { Investment } from '@/types/investment';

interface CryptoFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

export function CryptoForm({ onSubmit, onBack }: CryptoFormProps) {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const filteredCryptos = useMemo(() => {
    if (!searchQuery) return cryptoList;
    return searchCrypto(searchQuery);
  }, [searchQuery]);

  const handleSelectCrypto = (crypto: CryptoAsset) => {
    setSelectedCrypto(crypto);
    setFormData(prev => ({
      ...prev,
      averagePrice: crypto.price.toString(),
    }));
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrypto) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const averagePrice = parseFloat(formData.averagePrice) || selectedCrypto.price;
    const investedAmount = quantity * averagePrice;

    onSubmit({
      name: selectedCrypto.name,
      category: 'crypto',
      ticker: selectedCrypto.symbol,
      quantity,
      averagePrice,
      currentPrice: selectedCrypto.price,
      investedAmount,
      purchaseDate: formData.purchaseDate || undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  if (step === 'select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">Selecione a Criptomoeda</h3>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criptomoeda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredCryptos.map((crypto) => (
            <button
              key={crypto.id}
              onClick={() => handleSelectCrypto(crypto)}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-primary font-semibold">{crypto.symbol}</span>
                <span className="text-card-foreground">{crypto.name}</span>
              </div>
              <span className="font-mono text-muted-foreground">
                $ {crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={() => setStep('select')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {selectedCrypto?.name}
            <span className="ml-2 text-primary font-mono text-sm">({selectedCrypto?.symbol})</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Preço atual: $ {selectedCrypto?.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input
            id="quantity"
            type="number"
            step="any"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="averagePrice">Preço Médio (USD)</Label>
          <Input
            id="averagePrice"
            type="number"
            step="any"
            value={formData.averagePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, averagePrice: e.target.value }))}
            placeholder="Preço atual"
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
