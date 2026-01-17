import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

type TransactionMode = 'buy' | 'sell';

interface BitcoinFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onSell?: (data: {
    name: string;
    ticker: string;
    category: 'crypto';
    quantity: number;
    price: number;
    date: Date;
    total: number;
  }) => void;
  onBack: () => void;
}

export function BitcoinForm({ onSubmit, onSell, onBack }: BitcoinFormProps) {
  const [mode, setMode] = useState<TransactionMode>('buy');
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const { prices, isLoading: isPriceLoading, fetchPrices } = useCryptoPrices();
  const currentLivePrice = prices['BTC'];

  useEffect(() => {
    fetchPrices(['BTC']);
  }, []);

  useEffect(() => {
    if (currentLivePrice) {
      setFormData(prev => ({
        ...prev,
        averagePrice: currentLivePrice.current_price.toString(),
      }));
    }
  }, [currentLivePrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.averagePrice) || currentLivePrice?.current_price || 0;

    if (mode === 'sell' && onSell) {
      onSell({
        name: 'Bitcoin',
        ticker: 'BTC',
        category: 'crypto',
        quantity,
        price,
        date: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        total: quantity * price,
      });
    } else {
      const investedAmount = quantity * price;
      onSubmit({
        name: 'Bitcoin',
        category: 'crypto',
        ticker: 'BTC',
        quantity,
        averagePrice: price,
        currentPrice: currentLivePrice?.current_price || price,
        investedAmount,
        purchaseDate: formData.purchaseDate || undefined,
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
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-card-foreground">
            Bitcoin
            <span className="ml-2 text-primary font-mono text-sm">(BTC)</span>
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isPriceLoading && !currentLivePrice ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Carregando preço...</span>
              </>
            ) : currentLivePrice ? (
              <>
                <span>Preço atual: $ {currentLivePrice.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={cn(
                  "font-mono",
                  currentLivePrice.price_change_percentage_24h >= 0 ? "text-success" : "text-destructive"
                )}>
                  {currentLivePrice.price_change_percentage_24h >= 0 ? '+' : ''}{currentLivePrice.price_change_percentage_24h.toFixed(2)}% (24h)
                </span>
              </>
            ) : (
              <span>Carregando preço...</span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fetchPrices(['BTC'])}
          disabled={isPriceLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isPriceLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Gráfico de variação 24h */}
      <AssetPriceChart
        symbol="BTC"
        currentPrice={currentLivePrice?.current_price ?? 0}
        change24h={currentLivePrice?.price_change_24h}
        changePercent24h={currentLivePrice?.price_change_percentage_24h}
        high24h={currentLivePrice?.high_24h}
        low24h={currentLivePrice?.low_24h}
        currency="USD"
        isLoading={isPriceLoading || !currentLivePrice}
      />

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

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade (BTC)</Label>
          <Input
            id="quantity"
            type="number"
            step="any"
            placeholder="0.00000000"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="averagePrice">
            {mode === 'buy' ? 'Preço de Compra (USD)' : 'Preço de Venda (USD)'}
          </Label>
          <Input
            id="averagePrice"
            type="number"
            step="any"
            placeholder="0.00"
            value={formData.averagePrice}
            onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Data da {mode === 'buy' ? 'Compra' : 'Venda'}</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Anotações sobre este investimento..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="min-h-[60px]"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {mode === 'buy' ? 'Registrar Compra' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}
