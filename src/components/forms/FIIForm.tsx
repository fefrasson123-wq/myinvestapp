import { useState, useMemo, useEffect } from 'react';
import { Search, Check, ArrowLeft, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchFiis, StockAsset, fiiList } from '@/data/stocksList';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useFIIPrices } from '@/hooks/useFIIPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

type TransactionMode = 'buy' | 'sell';

interface FIIFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onSell?: (data: {
    name: string;
    ticker: string;
    category: 'fii';
    quantity: number;
    price: number;
    date: Date;
    total: number;
  }) => void;
  onBack: () => void;
}

export function FIIForm({ onSubmit, onSell, onBack }: FIIFormProps) {
  const [mode, setMode] = useState<TransactionMode>('buy');
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

  const { prices, isLoading: isPriceLoading, fetchPrices } = useFIIPrices();

  const filteredFIIs = useMemo(() => {
    if (!searchQuery) return [];
    return searchFiis(searchQuery).slice(0, 8);
  }, [searchQuery]);

  // Busca preço em tempo real
  const currentLivePrice = selectedFII ? prices[selectedFII.ticker] : null;

  const handleSelectFII = (fii: StockAsset) => {
    setSelectedFII(fii);
    setSearchQuery(`${fii.ticker} - ${fii.name}`);
    
    // Usa preço em tempo real se disponível
    const livePrice = prices[fii.ticker];
    const priceToUse = livePrice?.price ?? fii.price;
    
    setFormData(prev => ({
      ...prev,
      averagePrice: priceToUse.toString(),
    }));
    setShowSuggestions(false);
    
    // Força atualização do preço
    fetchPrices([fii.ticker]);
  };

  // Atualiza preço médio quando preço em tempo real chega
  useEffect(() => {
    if (currentLivePrice && selectedFII) {
      setFormData(prev => ({
        ...prev,
        averagePrice: currentLivePrice.price.toString(),
      }));
    }
  }, [currentLivePrice, selectedFII]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFII) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.averagePrice) || currentLivePrice?.price || selectedFII.price;

    if (mode === 'sell' && onSell) {
      onSell({
        name: selectedFII.name,
        ticker: selectedFII.ticker,
        category: 'fii',
        quantity,
        price,
        date: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        total: quantity * price,
      });
    } else {
      const investedAmount = quantity * price;
      onSubmit({
        name: selectedFII.name,
        category: 'fii',
        ticker: selectedFII.ticker,
        quantity,
        averagePrice: price,
        currentPrice: currentLivePrice?.price || selectedFII.price,
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
          {mode === 'buy' ? 'Adicionar Fundo Imobiliário' : 'Vender Fundo Imobiliário'}
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
                className="w-full flex items-center p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0"
              >
                <span className="font-mono text-primary font-semibold">{fii.ticker}</span>
                <span className="ml-2 text-card-foreground">{fii.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFII && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/30 border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-primary font-semibold">{selectedFII.ticker}</span>
                <span className="ml-2 text-card-foreground">{selectedFII.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {isPriceLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <span className="font-mono text-foreground">
                  R$ {(currentLivePrice?.price ?? selectedFII.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            {currentLivePrice?.dividendYield && (
              <div className="mt-2 text-xs text-muted-foreground">
                Dividend Yield: <span className="text-success font-mono">{currentLivePrice.dividendYield.toFixed(1)}% a.a.</span>
              </div>
            )}
          </div>

          {/* Gráfico de variação 24h */}
          {currentLivePrice && (
            <AssetPriceChart
              symbol={selectedFII.ticker}
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
