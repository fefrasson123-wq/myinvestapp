import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, TrendingUp, Calendar, BarChart3, Bitcoin, Globe, Landmark, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Investment, ETFType, etfTypeLabels } from '@/types/investment';
import { etfList, ETFAsset, searchETFs, getETFsByType } from '@/data/etfList';
import { useETFPrices } from '@/hooks/useETFPrices';
import { AssetPriceChart } from '../AssetPriceChart';

interface ETFFormProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onSell?: (data: any) => void;
  onBack: () => void;
}

const etfTypeOptions: { id: ETFType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'etf_acoes_brasil', label: 'ETF de Ações Brasileiras', icon: TrendingUp, color: 'hsl(200, 100%, 50%)' },
  { id: 'etf_acoes_exterior', label: 'ETF de Ações do Exterior', icon: Globe, color: 'hsl(280, 80%, 55%)' },
  { id: 'etf_renda_fixa', label: 'ETF de Renda Fixa', icon: Landmark, color: 'hsl(140, 80%, 45%)' },
  { id: 'etf_indice', label: 'ETF de Índice', icon: Activity, color: 'hsl(30, 100%, 50%)' },
  { id: 'etf_cripto', label: 'ETF de Criptomoedas', icon: Bitcoin, color: 'hsl(45, 100%, 50%)' },
];

export function ETFForm({ onSubmit, onSell, onBack }: ETFFormProps) {
  const [etfType, setEtfType] = useState<ETFType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedETF, setSelectedETF] = useState<ETFAsset | null>(null);
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  const { prices, fetchPrices, getPrice, getPriceChange } = useETFPrices();

  // Filtra ETFs pelo tipo selecionado e busca
  const filteredETFs = useMemo(() => {
    if (!etfType) return [];
    if (!searchQuery.trim()) return getETFsByType(etfType).slice(0, 10);
    return searchETFs(searchQuery, etfType);
  }, [etfType, searchQuery]);

  // Busca preço em tempo real quando seleciona ETF
  const currentLivePrice = selectedETF ? prices[selectedETF.ticker] : null;

  // Auto-seleciona quando o usuário digita um ticker exato
  useEffect(() => {
    if (!etfType) return;

    const raw = searchQuery.trim();
    if (!raw) return;

    const ticker = raw.split(' - ')[0]?.trim().toUpperCase();
    if (!ticker) return;

    if (selectedETF?.ticker.toUpperCase() === ticker) return;

    const exact = etfList.find(e => e.etfType === etfType && e.ticker.toUpperCase() === ticker);
    if (exact) {
      handleSelectETF(exact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etfType, searchQuery]);

  const handleSelectETF = (etf: ETFAsset) => {
    setSelectedETF(etf);
    setSearchQuery(`${etf.ticker} - ${etf.name}`);
    fetchPrices([etf.ticker]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedETF || !quantity || !averagePrice || !etfType) return;

    const qty = parseFloat(quantity);
    const avgPrice = parseFloat(averagePrice);
    const investedAmount = qty * avgPrice;

    onSubmit({
      name: selectedETF.name,
      category: 'etf',
      ticker: selectedETF.ticker,
      quantity: qty,
      averagePrice: avgPrice,
      currentPrice: currentLivePrice?.price || selectedETF.price,
      investedAmount,
      notes: notes || undefined,
      purchaseDate: purchaseDate || undefined,
      etfType,
    });
  };

  const handleBackFromForm = () => {
    // Se tem um ETF selecionado, limpa a seleção mas mantém no tipo
    if (selectedETF) {
      setSelectedETF(null);
      setSearchQuery('');
      setQuantity('');
      setAveragePrice('');
      setPurchaseDate('');
      setNotes('');
    } else if (etfType) {
      // Se não tem ETF selecionado mas tem tipo, volta para seleção de tipo
      setEtfType(null);
    } else {
      onBack();
    }
  };

  // Tela de seleção de tipo de ETF
  if (!etfType) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">Selecione o tipo de ETF</h3>
          <p className="text-sm text-muted-foreground">ETFs replicam índices e sua rentabilidade vem do índice + preço</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {etfTypeOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setEtfType(option.id)}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98] animate-slide-up group"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div 
                  className="p-3 rounded-lg transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${option.color}20` }}
                >
                  <Icon 
                    className="w-5 h-5 transition-transform duration-200" 
                    style={{ color: option.color }}
                  />
                </div>
                <span className="font-medium text-card-foreground text-sm group-hover:text-primary transition-colors">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Formulário de cadastro após seleção do tipo
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBackFromForm}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <span className="text-sm font-medium text-card-foreground">
          {etfTypeLabels[etfType]}
        </span>
      </div>

      {/* Campo de busca */}
      <div className="space-y-2">
        <Label htmlFor="search">Buscar ETF</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.includes(' - ')) {
                setSelectedETF(null);
              }
            }}
            placeholder="Digite o ticker ou nome (ex: BOVA11, IVVB11)"
            className="pl-10"
          />
        </div>

        {/* Lista de sugestões */}
        {searchQuery && !selectedETF && filteredETFs.length > 0 && (
          <div className="bg-secondary/50 rounded-lg border border-border/50 max-h-48 overflow-y-auto">
            {filteredETFs.map((etf) => (
              <button
                key={etf.ticker}
                type="button"
                onClick={() => handleSelectETF(etf)}
                className="w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors text-left"
              >
                <div>
                  <span className="font-medium text-card-foreground">{etf.ticker}</span>
                  <span className="text-muted-foreground text-sm ml-2">{etf.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">R$ {etf.price.toFixed(2)}</div>
                  <div className={`text-xs ${etf.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent.toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico de preço quando ETF selecionado */}
      {selectedETF && (
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-medium text-card-foreground">{selectedETF.ticker}</span>
            <span className="text-muted-foreground text-sm">- {selectedETF.name}</span>
          </div>
          
          <AssetPriceChart
            symbol={selectedETF.ticker}
            currentPrice={currentLivePrice?.price || selectedETF.price}
            change24h={currentLivePrice?.changePercent || selectedETF.changePercent}
            high24h={(currentLivePrice?.price || selectedETF.price) * 1.02}
            low24h={(currentLivePrice?.price || selectedETF.price) * 0.98}
            currency="BRL"
          />
        </div>
      )}

      {/* Campos do formulário */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ex: 100"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="averagePrice">Preço Médio (R$)</Label>
          <Input
            id="averagePrice"
            type="number"
            step="0.01"
            min="0.01"
            value={averagePrice}
            onChange={(e) => setAveragePrice(e.target.value)}
            placeholder="Ex: 125.50"
            required
          />
        </div>

        <div>
          <Label htmlFor="purchaseDate" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Data de Compra
          </Label>
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações sobre o investimento..."
            rows={2}
          />
        </div>
      </div>

      {/* Resumo */}
      {quantity && averagePrice && (
        <div className="bg-primary/10 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor investido:</span>
            <span className="font-medium text-card-foreground">
              R$ {(parseFloat(quantity) * parseFloat(averagePrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {selectedETF && currentLivePrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor atual:</span>
              <span className="font-medium text-card-foreground">
                R$ {(parseFloat(quantity) * currentLivePrice.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedETF || !quantity || !averagePrice}
      >
        Cadastrar ETF
      </Button>
    </form>
  );
}
