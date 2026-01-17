import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

type TransactionMode = 'buy' | 'sell';

interface StablecoinFormProps {
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

interface StablecoinAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  description: string;
}

// Lista de stablecoins disponíveis
const stablecoinList: StablecoinAsset[] = [
  { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.00, description: 'USD Stablecoin' },
  { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', price: 1.00, description: 'USD Stablecoin' },
  { id: 'dai', name: 'Dai', symbol: 'DAI', price: 1.00, description: 'Decentralized USD Stablecoin' },
  { id: 'binance-usd', name: 'Binance USD', symbol: 'BUSD', price: 1.00, description: 'USD Stablecoin' },
  { id: 'euro-coin', name: 'Euro Coin', symbol: 'EURC', price: 1.10, description: 'EUR Stablecoin' },
  { id: 'pax-gold', name: 'PAX Gold', symbol: 'PAXG', price: 2050, description: 'Gold-backed Token' },
  { id: 'trueusd', name: 'TrueUSD', symbol: 'TUSD', price: 1.00, description: 'USD Stablecoin' },
  { id: 'frax', name: 'Frax', symbol: 'FRAX', price: 1.00, description: 'Algorithmic USD Stablecoin' },
  { id: 'pax-dollar', name: 'Pax Dollar', symbol: 'USDP', price: 1.00, description: 'USD Stablecoin' },
  { id: 'gemini-dollar', name: 'Gemini Dollar', symbol: 'GUSD', price: 1.00, description: 'USD Stablecoin' },
  { id: 'susd', name: 'sUSD', symbol: 'SUSD', price: 1.00, description: 'Synthetix USD' },
  { id: 'liquity-usd', name: 'Liquity USD', symbol: 'LUSD', price: 1.00, description: 'Decentralized USD Stablecoin' },
  { id: 'usdd', name: 'USDD', symbol: 'USDD', price: 1.00, description: 'TRON USD Stablecoin' },
  { id: 'tether-gold', name: 'Tether Gold', symbol: 'XAUT', price: 2050, description: 'Gold-backed Token' },
  { id: 'magic-internet-money', name: 'Magic Internet Money', symbol: 'MIM', price: 1.00, description: 'USD Stablecoin' },
];

export function StablecoinForm({ onSubmit, onSell, onBack }: StablecoinFormProps) {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [mode, setMode] = useState<TransactionMode>('buy');
  const [selectedCrypto, setSelectedCrypto] = useState<StablecoinAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const { prices, isLoading: isPriceLoading, fetchPrices } = useCryptoPrices();

  const filteredCryptos = useMemo(() => {
    if (!searchQuery) return stablecoinList;
    const q = searchQuery.toLowerCase();
    return stablecoinList.filter(
      c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentLivePrice = selectedCrypto ? prices[selectedCrypto.symbol.toUpperCase()] : null;

  const handleSelectCrypto = (crypto: StablecoinAsset) => {
    setSelectedCrypto(crypto);
    
    const livePrice = prices[crypto.symbol.toUpperCase()];
    const priceToUse = livePrice?.current_price ?? crypto.price;
    
    setFormData(prev => ({
      ...prev,
      averagePrice: priceToUse.toString(),
    }));
    setStep('form');
    
    fetchPrices([crypto.symbol.toUpperCase()]);
  };

  useEffect(() => {
    if (currentLivePrice && selectedCrypto) {
      setFormData(prev => ({
        ...prev,
        averagePrice: currentLivePrice.current_price.toString(),
      }));
    }
  }, [currentLivePrice, selectedCrypto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrypto) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.averagePrice) || selectedCrypto.price;

    if (mode === 'sell' && onSell) {
      onSell({
        name: selectedCrypto.name,
        ticker: selectedCrypto.symbol,
        category: 'crypto',
        quantity,
        price,
        date: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        total: quantity * price,
      });
    } else {
      const investedAmount = quantity * price;
      onSubmit({
        name: selectedCrypto.name,
        category: 'crypto',
        ticker: selectedCrypto.symbol,
        quantity,
        averagePrice: price,
        currentPrice: selectedCrypto.price,
        investedAmount,
        purchaseDate: formData.purchaseDate || undefined,
        notes: formData.notes.trim() || undefined,
      });
    }
  };

  const handleBackFromForm = () => {
    if (step === 'form') {
      setStep('select');
      setSelectedCrypto(null);
      setFormData({
        quantity: '',
        averagePrice: '',
        purchaseDate: '',
        notes: '',
      });
    } else {
      onBack();
    }
  };

  if (step === 'select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" type="button" onClick={handleBackFromForm}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">Selecione a Stablecoin</h3>
        </div>

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar stablecoin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredCryptos.map((crypto) => {
            const livePrice = prices[crypto.symbol.toUpperCase()];
            const displayPrice = livePrice?.current_price ?? crypto.price;
            const changePercent = livePrice?.price_change_percentage_24h;
            
            return (
              <button
                key={crypto.id}
                onClick={() => handleSelectCrypto(crypto)}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
              >
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="font-mono text-primary font-semibold">{crypto.symbol}</span>
                    <span className="ml-3 text-card-foreground">{crypto.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">{crypto.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                  {changePercent !== undefined && (
                    <span className={cn(
                      "text-xs font-mono",
                      changePercent >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBackFromForm}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-card-foreground">
            {selectedCrypto?.name}
            <span className="ml-2 text-primary font-mono text-sm">({selectedCrypto?.symbol})</span>
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isPriceLoading && !currentLivePrice ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Carregando preço...</span>
              </>
            ) : currentLivePrice ? (
              <>
                <span>Preço atual: $ {currentLivePrice.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
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
          onClick={() => selectedCrypto && fetchPrices([selectedCrypto.symbol.toUpperCase()])}
          disabled={isPriceLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isPriceLoading && "animate-spin")} />
        </Button>
      </div>

      {selectedCrypto && (
        <AssetPriceChart
          symbol={selectedCrypto.symbol}
          currentPrice={currentLivePrice?.current_price ?? 0}
          change24h={currentLivePrice?.price_change_24h}
          changePercent24h={currentLivePrice?.price_change_percentage_24h}
          high24h={currentLivePrice?.high_24h}
          low24h={currentLivePrice?.low_24h}
          currency="USD"
          isLoading={isPriceLoading || !currentLivePrice}
        />
      )}

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
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            step="any"
            placeholder="0.00"
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
            placeholder="1.00"
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
        <Button type="button" variant="outline" className="flex-1" onClick={handleBackFromForm}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {mode === 'buy' ? 'Registrar Compra' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}
