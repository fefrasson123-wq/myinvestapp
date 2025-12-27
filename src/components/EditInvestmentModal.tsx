import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Investment, categoryLabels } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditInvestmentModalProps {
  investment: Investment;
  onSave: (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onClose: () => void;
}

function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

export function EditInvestmentModal({ investment, onSave, onClose }: EditInvestmentModalProps) {
  const [formData, setFormData] = useState({
    quantity: investment.quantity.toString(),
    averagePrice: investment.averagePrice.toString(),
    currentPrice: investment.currentPrice.toString(),
    notes: investment.notes || '',
  });

  const isCrypto = investment.category === 'crypto';
  const currency = isCrypto ? 'USD' : 'BRL';
  const currencySymbol = isCrypto ? '$' : 'R$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity) || investment.quantity;
    const averagePrice = parseFloat(formData.averagePrice) || investment.averagePrice;
    const currentPrice = parseFloat(formData.currentPrice) || investment.currentPrice;
    const investedAmount = quantity * averagePrice;

    onSave(investment.id, {
      quantity,
      averagePrice,
      currentPrice,
      investedAmount,
      notes: formData.notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            Editar Investimento
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
              {categoryLabels[investment.category]}
              {isCrypto && <span className="ml-2 font-mono">• USD</span>}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="averagePrice">Preço Médio ({currency})</Label>
              <Input
                id="averagePrice"
                type="number"
                step="any"
                value={formData.averagePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, averagePrice: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="currentPrice">Preço Atual ({currency})</Label>
              <Input
                id="currentPrice"
                type="number"
                step="any"
                value={formData.currentPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                className="mt-1"
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
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Check className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
