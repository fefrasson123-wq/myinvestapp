import { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Investment } from '@/types/investment';
import { Card, CardContent } from '@/components/ui/card';

interface USAStockFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

// Lista de ações americanas populares
const popularUSAStocks = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'META', name: 'Meta Platforms Inc.' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.' },
  { ticker: 'V', name: 'Visa Inc.' },
  { ticker: 'JNJ', name: 'Johnson & Johnson' },
  { ticker: 'WMT', name: 'Walmart Inc.' },
  { ticker: 'PG', name: 'Procter & Gamble' },
  { ticker: 'MA', name: 'Mastercard Inc.' },
  { ticker: 'UNH', name: 'UnitedHealth Group' },
  { ticker: 'HD', name: 'The Home Depot' },
  { ticker: 'DIS', name: 'The Walt Disney Company' },
  { ticker: 'NFLX', name: 'Netflix Inc.' },
  { ticker: 'ADBE', name: 'Adobe Inc.' },
  { ticker: 'CRM', name: 'Salesforce Inc.' },
];

export function USAStockForm({ onSubmit, onBack }: USAStockFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<{ ticker: string; name: string } | null>(null);
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  const filteredStocks = popularUSAStocks.filter(
    stock =>
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStock = (stock: { ticker: string; name: string }) => {
    setSelectedStock(stock);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStock) return;

    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(averagePrice) || 0;
    const investedAmount = qty * price;

    onSubmit({
      name: selectedStock.name,
      category: 'usastocks',
      ticker: selectedStock.ticker,
      quantity: qty,
      averagePrice: price,
      currentPrice: price,
      investedAmount,
      notes: notes || undefined,
      purchaseDate: purchaseDate || undefined,
    });
  };

  if (!selectedStock) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Ações Americanas (NYSE/NASDAQ)</h3>
          </div>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-3 flex gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p>• Cotações em dólares (USD)</p>
                <p>• Bolsas: NYSE e NASDAQ</p>
                <p>• Tributação: 15% sobre ganho de capital</p>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ticker ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStocks.map((stock) => (
              <button
                key={stock.ticker}
                type="button"
                onClick={() => handleSelectStock(stock)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-card-foreground">{stock.ticker}</p>
                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                  </div>
                </div>
                <DollarSign className="w-4 h-4 text-green-400" />
              </button>
            ))}
          </div>

          {searchQuery && filteredStocks.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">Nenhuma ação encontrada</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => handleSelectStock({ ticker: searchQuery.toUpperCase(), name: searchQuery.toUpperCase() })}
              >
                Adicionar "{searchQuery.toUpperCase()}" manualmente
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setSelectedStock(null)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="font-bold text-card-foreground">{selectedStock.ticker}</p>
          <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            step="0.000001"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="averagePrice">Preço Médio (USD)</Label>
          <Input
            id="averagePrice"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={averagePrice}
            onChange={(e) => setAveragePrice(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaseDate">Data da Compra</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input
          id="notes"
          placeholder="Anotações sobre o investimento..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {quantity && averagePrice && (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
          <p className="text-sm text-muted-foreground">Total Investido</p>
          <p className="text-lg font-bold text-primary">
            ${(parseFloat(quantity) * parseFloat(averagePrice)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full">
        Adicionar Ação Americana
      </Button>
    </form>
  );
}
