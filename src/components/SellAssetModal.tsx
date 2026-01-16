import { useState } from 'react';
import { X, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { Investment } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SellAssetModalProps {
  investment: Investment;
  onSell: (data: {
    quantity: number;
    price: number;
    date: Date;
    profitLoss: number;
    profitLossPercent: number;
  }) => void;
  onClose: () => void;
}

function formatCurrency(value: number): string {
  // Todos os valores agora em BRL
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SellAssetModal({ investment, onSell, onClose }: SellAssetModalProps) {
  const [quantity, setQuantity] = useState(investment.quantity);
  const [sellPrice, setSellPrice] = useState(investment.currentPrice);
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);

  const isCrypto = investment.category === 'crypto';

  const totalSellValue = quantity * sellPrice;
  const costBasis = quantity * investment.averagePrice;
  const profitLoss = totalSellValue - costBasis;
  const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
  const isPositive = profitLoss >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0 || quantity > investment.quantity) {
      return;
    }

    onSell({
      quantity,
      price: sellPrice,
      date: new Date(sellDate),
      profitLoss,
      profitLossPercent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Registrar Venda
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="font-medium text-card-foreground">
              {investment.name}
              {investment.ticker && (
                <span className="ml-2 text-primary text-sm">({investment.ticker})</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Quantidade disponível: {investment.quantity.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Quantidade a vender</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                max={investment.quantity}
                min={0.00000001}
                step="any"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Preço de venda (R$)</Label>
              <Input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                min={0}
                step="any"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Data da venda</Label>
              <Input
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor total da venda</span>
              <span className="font-mono text-card-foreground">
                {formatCurrency(totalSellValue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo de aquisição</span>
              <span className="font-mono text-card-foreground">
                {formatCurrency(costBasis)}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-medium text-card-foreground flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                Resultado
              </span>
              <div className="text-right">
                <p className={cn(
                  "font-mono font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? '+' : ''}{formatCurrency(profitLoss)}
                </p>
                <p className={cn(
                  "text-xs font-mono",
                  isPositive ? "text-success/70" : "text-destructive/70"
                )}>
                  ({isPositive ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              disabled={quantity <= 0 || quantity > investment.quantity}
            >
              Confirmar Venda
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
