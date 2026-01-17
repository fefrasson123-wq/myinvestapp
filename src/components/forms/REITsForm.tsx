import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Building2, DollarSign, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Investment } from '@/types/investment';
import { Card, CardContent } from '@/components/ui/card';
import { useUSAStockPrices } from '@/hooks/useUSAStockPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

interface REITsFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onBack: () => void;
}

// Lista de REITs populares
const popularREITs = [
  { ticker: 'O', name: 'Realty Income Corporation' },
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF' },
  { ticker: 'SPG', name: 'Simon Property Group' },
  { ticker: 'AMT', name: 'American Tower Corporation' },
  { ticker: 'PLD', name: 'Prologis Inc.' },
  { ticker: 'CCI', name: 'Crown Castle Inc.' },
  { ticker: 'EQIX', name: 'Equinix Inc.' },
  { ticker: 'PSA', name: 'Public Storage' },
  { ticker: 'DLR', name: 'Digital Realty Trust' },
  { ticker: 'WELL', name: 'Welltower Inc.' },
  { ticker: 'AVB', name: 'AvalonBay Communities' },
  { ticker: 'EQR', name: 'Equity Residential' },
  { ticker: 'VICI', name: 'VICI Properties Inc.' },
  { ticker: 'IRM', name: 'Iron Mountain Inc.' },
  { ticker: 'SBAC', name: 'SBA Communications' },
  { ticker: 'WPC', name: 'W. P. Carey Inc.' },
  { ticker: 'ARE', name: 'Alexandria Real Estate' },
  { ticker: 'MAA', name: 'Mid-America Apartment' },
  { ticker: 'ESS', name: 'Essex Property Trust' },
  { ticker: 'UDR', name: 'UDR Inc.' },
];

export function REITsForm({ onSubmit, onBack }: REITsFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedREIT, setSelectedREIT] = useState<{ ticker: string; name: string } | null>(null);
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  const { prices, isLoading, fetchPrices, getPrice, getPriceChange, lastUpdate } = useUSAStockPrices();

  // Fetch prices for popular REITs on mount
  useEffect(() => {
    const tickers = popularREITs.map(r => r.ticker);
    fetchPrices(tickers);
  }, []);

  // Fetch selected REIT price
  useEffect(() => {
    if (selectedREIT) {
      fetchPrices([selectedREIT.ticker]);
    }
  }, [selectedREIT]);

  const filteredREITs = popularREITs.filter(
    reit =>
      reit.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectREIT = (reit: { ticker: string; name: string }) => {
    setSelectedREIT(reit);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedREIT) return;

    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(averagePrice) || 0;
    const investedAmount = qty * price;
    const currentPrice = getPrice(selectedREIT.ticker) || price;

    onSubmit({
      name: selectedREIT.name,
      category: 'reits',
      ticker: selectedREIT.ticker,
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

  if (!selectedREIT) {
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
              <Building2 className="w-5 h-5" />
              <h3 className="font-semibold">REITs (Real Estate Investment Trusts)</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchPrices(popularREITs.map(r => r.ticker))}
              disabled={isLoading}
              className="gap-1 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-3 flex gap-2">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-sm text-purple-200">
                <p>• Cotações em tempo real (USD)</p>
                <p>• Fundos imobiliários americanos</p>
                <p>• Dividendos mensais ou trimestrais</p>
                {lastUpdate && (
                  <p className="text-xs text-purple-300/70 mt-1">
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
            {filteredREITs.map((reit) => {
              const price = getPrice(reit.ticker);
              const change = getPriceChange(reit.ticker);
              const isPositive = change ? change.percent >= 0 : true;
              
              return (
                <button
                  key={reit.ticker}
                  type="button"
                  onClick={() => handleSelectREIT(reit)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-card-foreground">{reit.ticker}</p>
                      <p className="text-xs text-muted-foreground">{reit.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">
                      {formatPrice(price)}
                    </p>
                    {renderPriceChange(reit.ticker)}
                  </div>
                </button>
              );
            })}
          </div>

          {searchQuery && filteredREITs.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">Nenhum REIT encontrado</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => handleSelectREIT({ ticker: searchQuery.toUpperCase(), name: searchQuery.toUpperCase() })}
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
    // Limpa a seleção e volta para a lista
    setSelectedREIT(null);
    setQuantity('');
    setAveragePrice('');
    setPurchaseDate('');
    setNotes('');
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="font-bold text-card-foreground">{selectedREIT.ticker}</p>
              <p className="text-sm text-muted-foreground">{selectedREIT.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {formatPrice(getPrice(selectedREIT.ticker))}
            </p>
            {renderPriceChange(selectedREIT.ticker)}
            {isLoading && (
              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground inline ml-1" />
            )}
          </div>
        </div>

        {/* Gráfico de variação 24h com máxima, mínima e atual */}
        {prices[selectedREIT.ticker] && (
          <AssetPriceChart
            symbol={selectedREIT.ticker}
            currentPrice={prices[selectedREIT.ticker].price}
            change24h={prices[selectedREIT.ticker].change}
            changePercent24h={prices[selectedREIT.ticker].changePercent}
            high24h={prices[selectedREIT.ticker].high24h}
            low24h={prices[selectedREIT.ticker].low24h}
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
        Adicionar REIT
      </Button>
    </form>
  );
}
