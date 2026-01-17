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

  // Auto-seleciona quando o usuário digita um ticker exato (ex: ITUB4)
  useEffect(() => {
    const raw = searchQuery.trim();
    if (!raw) return;

    const ticker = raw.split(' - ')[0]?.trim().toUpperCase();
    if (!ticker) return;

    if (selectedStock?.ticker.toUpperCase() === ticker) return;

    const exact = stocksList.find(s => s.ticker.toUpperCase() === ticker);
    if (exact) {
      handleSelectStock(exact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-card-foreground">
            {mode === 'buy' ? 'Adicionar Ação' : 'Vender Ação'}
          </span>
        </div>
        {/* Toggle Compra/Venda */}
        <div className="flex gap-1 p-0.5 bg-secondary/50 rounded-md">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={cn(
              "flex items-center justify-center gap-1 py-1 px-2 rounded text-xs font-medium transition-all",
              mode === 'buy'
                ? "bg-success text-success-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            <TrendingUp className="w-3 h-3" />
            Compra
          </button>
          <button
            type="button"
            onClick={() => setMode('sell')}
            className={cn(
              "flex items-center justify-center gap-1 py-1 px-2 rounded text-xs font-medium transition-all",
              mode === 'sell'
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            <TrendingDown className="w-3 h-3" />
            Venda
          </button>
        </div>
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
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-secondary/30 border border-primary/30">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-mono text-primary font-semibold text-xs">{selectedStock.ticker}</span>
                <span className="ml-1 text-card-foreground text-xs">{selectedStock.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {isPriceLoading && !currentLivePrice ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : currentLivePrice ? (
                  <>
                    <span className="font-mono text-foreground text-xs">
                      R$ {currentLivePrice.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono",
                      currentLivePrice.changePercent >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {currentLivePrice.changePercent >= 0 ? '+' : ''}{currentLivePrice.changePercent.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Carregando...</span>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de variação 24h - mostra loading até ter o preço real */}
          <AssetPriceChart
            symbol={selectedStock.ticker}
            currentPrice={currentLivePrice?.price ?? selectedStock.price}
            change24h={currentLivePrice?.change ?? selectedStock.change}
            changePercent24h={currentLivePrice?.changePercent ?? selectedStock.changePercent}
            high24h={currentLivePrice?.high24h}
            low24h={currentLivePrice?.low24h}
            currency="BRL"
            isLoading={isPriceLoading && !currentLivePrice}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="quantity" className="text-xs">Quantidade *</Label>
          <Input
            id="quantity"
            type="number"
            step="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="0"
            required
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="averagePrice" className="text-xs">{mode === 'buy' ? 'Preço Médio (R$)' : 'Preço Venda (R$)'} *</Label>
          <Input
            id="averagePrice"
            type="number"
            step="any"
            value={formData.averagePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, averagePrice: e.target.value }))}
            placeholder="0.00"
            required
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="purchaseDate" className="text-xs">{mode === 'buy' ? 'Data Compra' : 'Data Venda'}</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>

        {mode === 'buy' && (
          <div>
            <Label htmlFor="dividends" className="text-xs">Dividendos (R$)</Label>
            <Input
              id="dividends"
              type="number"
              step="any"
              value={formData.dividends}
              onChange={(e) => setFormData(prev => ({ ...prev, dividends: e.target.value }))}
              placeholder="0.00"
              className="h-8 text-sm"
            />
          </div>
        )}

        <div className="col-span-2">
          <Label htmlFor="notes" className="text-xs">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas..."
            rows={1}
            className="text-sm min-h-[32px]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-8 text-sm" onClick={onBack}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className={cn(
            "flex-1 gap-1 h-8 text-sm",
            mode === 'sell' && "bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          )}
          disabled={!selectedStock}
        >
          <Check className="w-3 h-3" />
          {mode === 'buy' ? 'Adicionar' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}
