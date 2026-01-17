import { useState, useMemo, useEffect } from 'react';
import { Search, Check, ArrowLeft, TrendingUp, TrendingDown, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchBDRsByType, BDRAsset, bdrList } from '@/data/bdrList';
import { Investment, BDRType, bdrTypeLabels } from '@/types/investment';
import { cn } from '@/lib/utils';
import { useStockPrices } from '@/hooks/useStockPrices';
import { AssetPriceChart } from '@/components/AssetPriceChart';

type TransactionMode = 'buy' | 'sell';

interface BDRFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onSell?: (data: {
    name: string;
    ticker: string;
    category: 'bdr';
    quantity: number;
    price: number;
    date: Date;
    total: number;
  }) => void;
  onBack: () => void;
}

export function BDRForm({ onSubmit, onSell, onBack }: BDRFormProps) {
  const [bdrType, setBdrType] = useState<BDRType | null>(null);
  const [mode, setMode] = useState<TransactionMode>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBDR, setSelectedBDR] = useState<BDRAsset | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    averagePrice: '',
    purchaseDate: '',
    dividends: '',
    notes: '',
  });

  const { prices, isLoading: isPriceLoading, fetchPrices } = useStockPrices();

  const filteredBDRs = useMemo(() => {
    if (!searchQuery || !bdrType) return [];
    return searchBDRsByType(searchQuery, bdrType).slice(0, 8);
  }, [searchQuery, bdrType]);

  // Busca preço em tempo real quando seleciona BDR
  const currentLivePrice = selectedBDR ? prices[selectedBDR.ticker] : null;

  // Auto-seleciona quando o usuário digita um ticker exato (ex: AAPL34)
  useEffect(() => {
    if (!bdrType) return;

    const raw = searchQuery.trim();
    if (!raw) return;

    const ticker = raw.split(' - ')[0]?.trim().toUpperCase();
    if (!ticker) return;

    if (selectedBDR?.ticker.toUpperCase() === ticker) return;

    const exact = bdrList.find(b => b.type === bdrType && b.ticker.toUpperCase() === ticker);
    if (exact) {
      handleSelectBDR(exact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bdrType, searchQuery]);

  const handleSelectBDR = (bdr: BDRAsset) => {
    setSelectedBDR(bdr);
    setSearchQuery(`${bdr.ticker} - ${bdr.name}`);
    
    // Usa preço em tempo real se disponível
    const livePrice = prices[bdr.ticker];
    const priceToUse = livePrice?.price ?? bdr.price;
    
    setFormData(prev => ({
      ...prev,
      averagePrice: priceToUse.toString(),
    }));
    setShowSuggestions(false);
    
    // Força atualização do preço
    fetchPrices([bdr.ticker]);
  };

  // Atualiza preço médio quando preço em tempo real chega
  useEffect(() => {
    if (currentLivePrice && selectedBDR) {
      setFormData(prev => ({
        ...prev,
        averagePrice: currentLivePrice.price.toString(),
      }));
    }
  }, [currentLivePrice, selectedBDR]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBDR || !bdrType) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.averagePrice) || selectedBDR.price;

    if (mode === 'sell' && onSell) {
      onSell({
        name: selectedBDR.name,
        ticker: selectedBDR.ticker,
        category: 'bdr',
        quantity,
        price,
        date: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        total: quantity * price,
      });
    } else {
      const investedAmount = quantity * price;
      onSubmit({
        name: selectedBDR.name,
        category: 'bdr',
        ticker: selectedBDR.ticker,
        quantity,
        averagePrice: price,
        currentPrice: selectedBDR.price,
        investedAmount,
        purchaseDate: formData.purchaseDate || undefined,
        dividends: formData.dividends ? parseFloat(formData.dividends) : undefined,
        notes: formData.notes.trim() || undefined,
        bdrType: bdrType,
      });
    }
  };

  // Se ainda não selecionou o tipo de BDR, mostra seleção
  if (!bdrType) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" type="button" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">
            Tipo de BDR
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">
          BDRs são títulos que representam ações de empresas estrangeiras negociadas na B3 em reais.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {(['stock', 'etf'] as BDRType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setBdrType(type)}
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 active:scale-95 group"
            >
              <div className="p-3 rounded-lg mb-3 transition-transform duration-200 group-hover:scale-110 bg-cyan-500/20">
                {type === 'stock' ? (
                  <TrendingUp className="w-6 h-6 text-cyan-500" />
                ) : (
                  <DollarSign className="w-6 h-6 text-cyan-500" />
                )}
              </div>
              <span className="font-medium text-card-foreground text-sm text-center group-hover:text-primary transition-colors">
                {bdrTypeLabels[type]}
              </span>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">📌 Observações:</span>
            <br />• Negociado em reais (BRL)
            <br />• Exposto à variação do dólar
            <br />• Pode pagar dividendos
          </p>
        </div>
      </div>
    );
  }

  const handleBackFromForm = () => {
    // Limpa a seleção e volta para seleção de tipo de BDR
    setSelectedBDR(null);
    setSearchQuery('');
    setFormData({
      quantity: '',
      averagePrice: '',
      purchaseDate: '',
      dividends: '',
      notes: '',
    });
    
    if (bdrType) {
      setBdrType(null);
    } else {
      onBack();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={handleBackFromForm}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-card-foreground">
          {mode === 'buy' ? 'Adicionar' : 'Vender'} {bdrTypeLabels[bdrType]}
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
        <Label htmlFor="bdr-search">Buscar {bdrTypeLabels[bdrType]} *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="bdr-search"
            placeholder={`Digite o código do BDR (ex: ${bdrType === 'stock' ? 'AAPL34, MSFT34' : 'BIVB39, BQQQ39'})...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value) setSelectedBDR(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10"
          />
        </div>

        {showSuggestions && filteredBDRs.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredBDRs.map((bdr) => (
              <button
                key={bdr.ticker}
                type="button"
                onClick={() => handleSelectBDR(bdr)}
                className="w-full flex items-center p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0"
              >
                <span className="font-mono text-primary font-semibold">{bdr.ticker}</span>
                <span className="ml-2 text-card-foreground">{bdr.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{bdr.underlyingTicker}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBDR && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/30 border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-primary font-semibold">{selectedBDR.ticker}</span>
                <span className="ml-2 text-card-foreground">{selectedBDR.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">({selectedBDR.underlyingTicker})</span>
              </div>
              <div className="flex items-center gap-2">
                {isPriceLoading && !currentLivePrice ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : currentLivePrice ? (
                  <>
                    <span className="font-mono text-foreground">
                      R$ {currentLivePrice.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(
                      "text-xs font-mono",
                      currentLivePrice.changePercent >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {currentLivePrice.changePercent >= 0 ? '+' : ''}{currentLivePrice.changePercent.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de variação 24h */}
          <AssetPriceChart
            symbol={selectedBDR.ticker}
            currentPrice={currentLivePrice?.price ?? selectedBDR.price}
            change24h={currentLivePrice?.change ?? selectedBDR.change}
            changePercent24h={currentLivePrice?.changePercent ?? selectedBDR.changePercent}
            high24h={currentLivePrice?.high24h}
            low24h={currentLivePrice?.low24h}
            currency="BRL"
            isLoading={isPriceLoading && !currentLivePrice}
          />

          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-xs text-cyan-600 dark:text-cyan-400">
              💱 BDR exposto à variação do dólar • Pode pagar dividendos
            </p>
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
        <Button type="button" variant="outline" className="flex-1" onClick={handleBackFromForm}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className={cn(
            "flex-1 gap-2",
            mode === 'sell' && "bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          )}
          disabled={!selectedBDR}
        >
          <Check className="w-4 h-4" />
          {mode === 'buy' ? 'Adicionar' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}
