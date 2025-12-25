import { useState, useMemo } from 'react';
import { Search, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchFiis, StockAsset, fiiList } from '@/data/stocksList';
import { Investment } from '@/types/investment';

interface FIIFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

export function FIIForm({ onSubmit, onBack }: FIIFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFII, setSelectedFII] = useState<StockAsset | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    dividends: '',
    notes: '',
  });

  const filteredFIIs = useMemo(() => {
    if (!searchQuery) return [];
    return searchFiis(searchQuery).slice(0, 8);
  }, [searchQuery]);

  const handleSelectFII = (fii: StockAsset) => {
    setSelectedFII(fii);
    setSearchQuery(`${fii.ticker} - ${fii.name}`);
    setFormData(prev => ({
      ...prev,
      averagePrice: fii.price.toString(),
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFII) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const averagePrice = parseFloat(formData.averagePrice) || selectedFII.price;
    const investedAmount = quantity * averagePrice;

    onSubmit({
      name: selectedFII.name,
      category: 'fii',
      ticker: selectedFII.ticker,
      quantity,
      averagePrice,
      currentPrice: selectedFII.price,
      investedAmount,
      purchaseDate: formData.purchaseDate || undefined,
      dividends: formData.dividends ? parseFloat(formData.dividends) : undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">Adicionar Fundo Imobiliário</h3>
      </div>

      <div className="relative">
        <Label htmlFor="fii-search">Buscar FII *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="fii-search"
            placeholder="Digite o código ou nome do FII..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value) setSelectedFII(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10"
          />
        </div>

        {showSuggestions && filteredFIIs.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredFIIs.map((fii) => (
              <button
                key={fii.ticker}
                type="button"
                onClick={() => handleSelectFII(fii)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0"
              >
                <div>
                  <span className="font-mono text-primary font-semibold">{fii.ticker}</span>
                  <span className="ml-2 text-card-foreground">{fii.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">
                  R$ {fii.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFII && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-primary font-semibold">{selectedFII.ticker}</span>
              <span className="ml-2 text-card-foreground">{selectedFII.name}</span>
            </div>
            <span className="font-mono text-foreground">
              R$ {selectedFII.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantidade de Cotas *</Label>
          <Input
            id="quantity"
            type="number"
            step="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="0"
            required
          />
        </div>

        <div>
          <Label htmlFor="averagePrice">Preço Médio (R$) *</Label>
          <Input
            id="averagePrice"
            type="number"
            step="any"
            value={formData.averagePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, averagePrice: e.target.value }))}
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

        <div>
          <Label htmlFor="dividends">Rendimentos Mensais (R$)</Label>
          <Input
            id="dividends"
            type="number"
            step="any"
            value={formData.dividends}
            onChange={(e) => setFormData(prev => ({ ...prev, dividends: e.target.value }))}
            placeholder="0.00"
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
        <Button type="submit" className="flex-1 gap-2" disabled={!selectedFII}>
          <Check className="w-4 h-4" />
          Adicionar
        </Button>
      </div>
    </form>
  );
}
