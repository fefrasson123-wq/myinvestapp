import { useState, useMemo, useEffect } from 'react';
import { Search, Check, ArrowLeft, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchStocks, StockAsset, stocksList } from '@/data/stocksList';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useStockPrices } from '@/hooks/useStockPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

type TransactionMode = 'buy' | 'sell';

interface StockFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onSell?: (data: {
    name: string;
    ticker: string;
    category: 'stocks';
    quantity: number;
    price: number;
    date: Date;
    total: number;
  }) => void;
  onBack: () => void;
}

export function StockForm({ onSubmit, onSell, onBack }: StockFormProps) {
  const [mode, setMode] = useState<TransactionMode>('buy');
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

  const { prices, isLoading: isPriceLoading, fetchPrices } = useStockPrices();

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return [];
    return searchStocks(searchQuery).slice(0, 8);
  }, [searchQuery]);

  // Busca preço em tempo real quando seleciona ação
  const currentLivePrice = selectedStock ? prices[selectedStock.ticker] : null;

  const handleSelectStock = (stock: StockAsset) => {
    setSelectedStock(stock);
    setSearchQuery(`${stock.ticker} - ${stock.name}`);
    
    // Usa preço em tempo real se disponível
    const livePrice = prices[stock.ticker];
    const priceToUse = livePrice?.price ?? stock.price;
    
    setFormData(prev => ({
      ...prev,
      averagePrice: priceToUse.toString(),
    }));
    setShowSuggestions(false);
    
    // Força atualização do preço
    fetchPrices([stock.ticker]);
  };

  // Atualiza preço médio quando preço em tempo real chega
  useEffect(() => {
    if (currentLivePrice && selectedStock) {
      setFormData(prev => ({
        ...prev,
        averagePrice: currentLivePrice.price.toString(),
      }));
    }
  }, [currentLivePrice, selectedStock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.averagePrice) || selectedStock.price;

    if (mode === 'sell' && onSell) {
      onSell({
        name: selectedStock.name,
        ticker: selectedStock.ticker,
        category: 'stocks',
        quantity,
        price,
        date: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        total: quantity * price,
      });
    } else {
      const investedAmount = quantity * price;
      onSubmit({
        name: selectedStock.name,
        category: 'stocks',
        ticker: selectedStock.ticker,
        quantity,
        averagePrice: price,
        currentPrice: selectedStock.price,
        investedAmount,
        purchaseDate: formData.purchaseDate || undefined,
        dividends: formData.dividends ? parseFloat(formData.dividends) : undefined,
        notes: formData.notes.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">
          {mode === 'buy' ? 'Adicionar Ação' : 'Vender Ação'}
        </h3>
      </div>

      {/* Toggle Compra/Venda */}
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('buy')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-all",
            mode === 'buy'
              ? "bg-success text-success-foreground shadow-sm"
              : "text-muted-foreground hover:text-card-foreground"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Compra
        </button>
        <button
          type="button"
          onClick={() => setMode('sell')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-all",
            mode === 'sell'
              ? "bg-destructive text-destructive-foreground shadow-sm"
              : "text-muted-foreground hover:text-card-foreground"
          )}
        >
          <TrendingDown className="w-4 h-4" />
          Venda
        </button>
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
                className="w-full flex items-center p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0"
              >
                <span className="font-mono text-primary font-semibold">{stock.ticker}</span>
                <span className="ml-2 text-card-foreground">{stock.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStock && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/30 border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-primary font-semibold">{selectedStock.ticker}</span>
                <span className="ml-2 text-card-foreground">{selectedStock.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {isPriceLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <span className="font-mono text-foreground">
                  R$ {(currentLivePrice?.price ?? selectedStock.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {currentLivePrice && (
                  <span className={cn(
                    "text-xs font-mono",
                    currentLivePrice.changePercent >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {currentLivePrice.changePercent >= 0 ? '+' : ''}{currentLivePrice.changePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de variação 24h */}
          {currentLivePrice && (
            <AssetPriceChart
              symbol={selectedStock.ticker}
              currentPrice={currentLivePrice.price}
              change24h={currentLivePrice.change}
              changePercent24h={currentLivePrice.changePercent}
              high24h={currentLivePrice.high24h}
              low24h={currentLivePrice.low24h}
              currency="BRL"
            />
          )}
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
          <Label htmlFor="averagePrice">{mode === 'buy' ? 'Preço Médio (R$)' : 'Preço de Venda (R$)'} *</Label>
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
          <Label htmlFor="purchaseDate">{mode === 'buy' ? 'Data da Compra' : 'Data da Venda'}</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
          />
        </div>

        {mode === 'buy' && (
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
        )}

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
        <Button 
          type="submit" 
          className={cn(
            "flex-1 gap-2",
            mode === 'sell' && "bg-destructive hover:bg-destructive/90"
          )}
          disabled={!selectedStock}
        >
          <Check className="w-4 h-4" />
          {mode === 'buy' ? 'Adicionar' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}
