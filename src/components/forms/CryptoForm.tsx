import { useState, useMemo, useEffect } from 'react';
import { Search, Check, ArrowLeft, TrendingUp, TrendingDown, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cryptoList, searchCrypto, CryptoAsset } from '@/data/cryptoList';
import { Investment } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useCryptoPrices, searchCryptoOnYahoo } from '@/hooks/useCryptoPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';
import { toast } from 'sonner';

type TransactionMode = 'buy' | 'sell';

interface CryptoFormProps {
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

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
}

export function CryptoForm({ onSubmit, onSell, onBack }: CryptoFormProps) {
  const [step, setStep] = useState<'select' | 'form' | 'custom'>('select');
  const [mode, setMode] = useState<TransactionMode>('buy');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const { prices, isLoading: isPriceLoading, fetchPrices } = useCryptoPrices();

  // Busca cripto personalizada via Yahoo Finance
  const searchCustomCrypto = async (query: string) => {
    if (!query.trim()) {
      toast.error('Digite o nome ou símbolo da criptomoeda');
      return;
    }

    setIsSearchingCustom(true);
    setSearchResults([]);
    
    try {
      const results = await searchCryptoOnYahoo(query.trim());
      
      if (results.length === 0) {
        toast.error(`Nenhuma criptomoeda encontrada para "${query}"`);
        setIsSearchingCustom(false);
        return;
      }

      setSearchResults(results);
      toast.success(`${results.length} criptomoeda(s) encontrada(s)`);
    } catch (error) {
      console.error('Erro ao buscar cripto:', error);
      toast.error('Erro ao buscar criptomoeda. Tente novamente.');
    } finally {
      setIsSearchingCustom(false);
    }
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const cryptoAsset: CryptoAsset = {
      id: result.symbol.toLowerCase(),
      name: result.name,
      symbol: result.symbol,
      price: result.price,
    };
    
    setSelectedCrypto(cryptoAsset);
    setFormData(prev => ({
      ...prev,
      averagePrice: result.price.toString(),
    }));
    
    // Store the full result for the chart
    prices[result.symbol.toUpperCase()] = {
      symbol: result.symbol.toUpperCase(),
      current_price: result.price,
      price_change_24h: result.change,
      price_change_percentage_24h: result.changePercent,
      high_24h: result.high24h,
      low_24h: result.low24h,
      last_updated: new Date().toISOString(),
    };
    
    setStep('form');
    setSearchResults([]);
    setCustomSearchQuery('');
  };

  const filteredCryptos = useMemo(() => {
    if (!searchQuery) return cryptoList;
    return searchCrypto(searchQuery);
  }, [searchQuery]);

  // Busca preço em tempo real pelo símbolo
  const currentLivePrice = selectedCrypto ? prices[selectedCrypto.symbol.toUpperCase()] : null;

  const handleSelectCrypto = (crypto: CryptoAsset) => {
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

  // Atualiza preço médio quando preço em tempo real chega
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
    } else {
      onBack();
    }
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criptomoeda..."
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
                <div className="flex items-center">
                  <span className="font-mono text-primary font-semibold">{crypto.symbol}</span>
                  <span className="ml-3 text-card-foreground">{crypto.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
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

          {/* Opção "Outras" no final */}
          <button
            onClick={() => setStep('custom')}
            className="flex items-center p-3 rounded-lg border border-dashed border-primary/50 bg-primary/10 hover:border-primary hover:bg-primary/20 transition-all text-left"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="ml-3 text-primary font-medium">Outras - Buscar Criptomoedas</span>
          </button>
        </div>
      </div>
    );
  }

  // Tela de busca de cripto personalizada via Yahoo Finance
  if (step === 'custom') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep('select'); setSearchResults([]); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">Buscar Outra Criptomoeda</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Busque entre milhares de criptomoedas disponíveis no Yahoo Finance. 
          Digite o nome ou símbolo e clique em Buscar.
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                placeholder="Ex: Pepe, BONK, MEME, Shiba..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchCustomCrypto(customSearchQuery);
                  }
                }}
              />
            </div>
            <Button 
              type="button" 
              onClick={() => searchCustomCrypto(customSearchQuery)}
              disabled={isSearchingCustom || !customSearchQuery.trim()}
              className="gap-2"
            >
              {isSearchingCustom ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </Button>
          </div>

          {/* Lista de resultados da busca */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                Resultados ({searchResults.length}):
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectSearchResult(result)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
                  >
                    <div className="flex items-center">
                      <span className="font-mono text-primary font-semibold">{result.symbol}</span>
                      <span className="ml-3 text-card-foreground">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        ${(result.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                      <span className={cn(
                        "text-xs font-mono",
                        (result.changePercent ?? 0) >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {(result.changePercent ?? 0) >= 0 ? '+' : ''}{(result.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearchingCustom && (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Buscando criptomoedas no Yahoo Finance...</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => { setStep('select'); setSearchResults([]); }}
            >
              Voltar
            </Button>
          </div>
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
            {isPriceLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>Preço atual: $ {(currentLivePrice?.current_price ?? selectedCrypto?.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            {currentLivePrice && (
              <span className={cn(
                "font-mono",
                currentLivePrice.price_change_percentage_24h >= 0 ? "text-success" : "text-destructive"
              )}>
                {currentLivePrice.price_change_percentage_24h >= 0 ? '+' : ''}{currentLivePrice.price_change_percentage_24h.toFixed(2)}%
              </span>
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

      {/* Gráfico de variação 24h */}
      {currentLivePrice && selectedCrypto && (
        <AssetPriceChart
          symbol={selectedCrypto.symbol}
          currentPrice={currentLivePrice.current_price}
          change24h={currentLivePrice.price_change_24h}
          changePercent24h={currentLivePrice.price_change_percentage_24h}
          high24h={currentLivePrice.high_24h}
          low24h={currentLivePrice.low_24h}
          currency="USD"
        />
      )}

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
          <Label htmlFor="averagePrice">{mode === 'buy' ? 'Preço Médio (USD)' : 'Preço de Venda (USD)'}</Label>
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
          <Label htmlFor="purchaseDate">{mode === 'buy' ? 'Data da Compra' : 'Data da Venda'}</Label>
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
        <Button 
          type="submit" 
          className={cn(
            "flex-1 gap-2",
            mode === 'sell' && "bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          )}
        >
          <Check className="w-4 h-4" />
          {mode === 'buy' ? 'Adicionar' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}