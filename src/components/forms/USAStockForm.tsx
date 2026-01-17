import { useState, useEffect } from 'react';
import { ArrowLeft, Search, TrendingUp, DollarSign, Info, RefreshCw, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Investment } from '@/types/investment';
import { Card, CardContent } from '@/components/ui/card';
import { useUSAStockPrices } from '@/hooks/useUSAStockPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

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

  const { prices, isLoading, fetchPrices, getPrice, getPriceChange, lastUpdate } = useUSAStockPrices();

  // Fetch prices for popular stocks on mount
  useEffect(() => {
    const tickers = popularUSAStocks.map(s => s.ticker);
    fetchPrices(tickers);
  }, []);

  // Fetch selected stock price
  useEffect(() => {
    if (selectedStock) {
      fetchPrices([selectedStock.ticker]);
    }
  }, [selectedStock]);

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
    const currentPrice = getPrice(selectedStock.ticker) || price;

    onSubmit({
      name: selectedStock.name,
      category: 'usastocks',
      ticker: selectedStock.ticker,
      quantity: qty,
      averagePrice: price,
      currentPrice,
      investedAmount,
      notes: notes || undefined,
      purchaseDate: purchaseDate || undefined,
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '—';
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderPriceChange = (ticker: string) => {
    const change = getPriceChange(ticker);
    if (!change) return null;
    
    const isPositive = change.percent >= 0;
    return (
      <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{change.percent.toFixed(2)}%
      </span>
    );
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">Ações Americanas (NYSE/NASDAQ)</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchPrices(popularUSAStocks.map(s => s.ticker))}
              disabled={isLoading}
              className="gap-1 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-3 flex gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p>• Cotações em tempo real (USD)</p>
                <p>• Bolsas: NYSE e NASDAQ</p>
                {lastUpdate && (
                  <p className="text-xs text-blue-300/70 mt-1">
                    Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
                  </p>
                )}
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
            {filteredStocks.map((stock) => {
              const price = getPrice(stock.ticker);
              const change = getPriceChange(stock.ticker);
              const isPositive = change ? change.percent >= 0 : true;
              
              return (
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
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">
                      {formatPrice(price)}
                    </p>
                    {renderPriceChange(stock.ticker)}
                  </div>
                </button>
              );
            })}
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

  const handleBackFromSelected = () => {
    // Quando um ativo está aberto, o usuário espera voltar para a categoria anterior (Bolsa Americana)
    setSelectedStock(null);
    onBack();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleBackFromSelected}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-card-foreground">{selectedStock.ticker}</p>
              <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {formatPrice(getPrice(selectedStock.ticker))}
            </p>
            {renderPriceChange(selectedStock.ticker)}
            {isLoading && (
              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground inline ml-1" />
            )}
          </div>
        </div>

        {/* Gráfico de variação 24h com máxima, mínima e atual */}
        {prices[selectedStock.ticker] && (
          <AssetPriceChart
            symbol={selectedStock.ticker}
            currentPrice={prices[selectedStock.ticker].price}
            change24h={prices[selectedStock.ticker].change}
            changePercent24h={prices[selectedStock.ticker].changePercent}
            high24h={prices[selectedStock.ticker].high24h}
            low24h={prices[selectedStock.ticker].low24h}
            currency="USD"
          />
        )}
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

        <div>
          <Label htmlFor="purchaseDate">Data da Compra</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Input
            id="notes"
            placeholder="Anotações sobre o investimento..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
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
