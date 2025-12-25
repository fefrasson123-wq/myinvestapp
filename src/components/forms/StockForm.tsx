import { useState, useMemo } from 'react';
import { Search, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchStocks, StockAsset, stocksList } from '@/data/stocksList';
import { Investment } from '@/types/investment';

interface StockFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

export function StockForm({ onSubmit, onBack }: StockFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockAsset | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    dividends: '',
    notes: '',
  });

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return [];
    return searchStocks(searchQuery).slice(0, 8);
  }, [searchQuery]);

  const handleSelectStock = (stock: StockAsset) => {
    setSelectedStock(stock);
    setSearchQuery(`${stock.ticker} - ${stock.name}`);
    setFormData(prev => ({
      ...prev,
      averagePrice: stock.price.toString(),
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const averagePrice = parseFloat(formData.averagePrice) || selectedStock.price;
    const investedAmount = quantity * averagePrice;

    onSubmit({
      name: selectedStock.name,
      category: 'stocks',
      ticker: selectedStock.ticker,
      quantity,
      averagePrice,
      currentPrice: selectedStock.price,
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
        <h3 className="text-lg font-semibold text-card-foreground">Adicionar Ação</h3>
      </div>

      <div className="relative">
        <Label htmlFor="stock-search">Buscar Ação *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="stock-search"
            placeholder="Digite o código ou nome da ação..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value) setSelectedStock(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10"
          />
        </div>

        {showSuggestions && filteredStocks.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredStocks.map((stock) => (
              <button
                key={stock.ticker}
                type="button"
                onClick={() => handleSelectStock(stock)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0"
              >
                <div>
                  <span className="font-mono text-primary font-semibold">{stock.ticker}</span>
                  <span className="ml-2 text-card-foreground">{stock.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">
                  R$ {stock.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStock && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-primary font-semibold">{selectedStock.ticker}</span>
              <span className="ml-2 text-card-foreground">{selectedStock.name}</span>
            </div>
            <span className="font-mono text-foreground">
              R$ {selectedStock.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantidade *</Label>
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
          <Label htmlFor="dividends">Dividendos Recebidos (R$)</Label>
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
        <Button type="submit" className="flex-1 gap-2" disabled={!selectedStock}>
          <Check className="w-4 h-4" />
          Adicionar
        </Button>
      </div>
    </form>
  );
}
