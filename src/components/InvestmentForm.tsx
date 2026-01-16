import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Investment, InvestmentCategory, categoryLabels } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface InvestmentFormProps {
  investment?: Investment | null;
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onClose: () => void;
}

const categories: InvestmentCategory[] = [
  'crypto', 'stocks', 'fii', 'cdb', 'cdi', 'lcilca', 'treasury', 'savings', 'other'
];

export function InvestmentForm({ investment, onSubmit, onClose }: InvestmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'stocks' as InvestmentCategory,
    ticker: '',
    quantity: '',
    averagePrice: '',
    currentPrice: '',
    investedAmount: '',
    notes: '',
  });

  useEffect(() => {
    if (investment) {
      setFormData({
        name: investment.name,
        category: investment.category,
        ticker: investment.ticker || '',
        quantity: investment.quantity.toString(),
        averagePrice: investment.averagePrice.toString(),
        currentPrice: investment.currentPrice.toString(),
        investedAmount: investment.investedAmount.toString(),
        notes: investment.notes || '',
      });
    }
  }, [investment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity) || 0;
    const averagePrice = parseFloat(formData.averagePrice) || 0;
    const currentPrice = parseFloat(formData.currentPrice) || 0;
    const investedAmount = parseFloat(formData.investedAmount) || (quantity * averagePrice);

    onSubmit({
      name: formData.name.trim(),
      category: formData.category,
      ticker: formData.ticker.trim() || undefined,
      quantity,
      averagePrice,
      currentPrice,
      investedAmount,
      notes: formData.notes.trim() || undefined,
    });
  };

  const handleQuantityOrPriceChange = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const averagePrice = parseFloat(formData.averagePrice) || 0;
    if (quantity > 0 && averagePrice > 0) {
      setFormData(prev => ({
        ...prev,
        investedAmount: (quantity * averagePrice).toString(),
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-lg shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-card-foreground">
            {investment ? 'Editar Investimento' : 'Novo Investimento'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Ativo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Bitcoin, PETR4, KNRI11"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: InvestmentCategory) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ticker">Ticker / Código</Label>
              <Input
                id="ticker"
                value={formData.ticker}
                onChange={(e) => setFormData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                placeholder="Ex: BTC, PETR4"
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, quantity: e.target.value }));
                }}
                onBlur={handleQuantityOrPriceChange}
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
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, averagePrice: e.target.value }));
                }}
                onBlur={handleQuantityOrPriceChange}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="currentPrice">Preço Atual (R$) *</Label>
              <Input
                id="currentPrice"
                type="number"
                step="any"
                value={formData.currentPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="investedAmount">Valor Investido (R$)</Label>
              <Input
                id="investedAmount"
                type="number"
                step="any"
                value={formData.investedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, investedAmount: e.target.value }))}
                placeholder="Calculado automaticamente"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o investimento..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {investment ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
