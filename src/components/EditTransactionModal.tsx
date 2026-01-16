import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Transaction, transactionLabels } from '@/types/investment';
import { cn } from '@/lib/utils';

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (id: string, data: Partial<Transaction>) => void;
  onClose: () => void;
}

export function EditTransactionModal({ transaction, onSave, onClose }: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    quantity: transaction.quantity.toString(),
    price: transaction.price.toString(),
    date: transaction.date.toISOString().split('T')[0],
  });

  const isCrypto = transaction.category === 'crypto';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity) || transaction.quantity;
    const price = parseFloat(formData.price) || transaction.price;
    const total = quantity * price;

    onSave(transaction.id, {
      quantity,
      price,
      total,
      date: new Date(formData.date),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative investment-card w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-card-foreground">
              Editar Transação
            </h3>
            <p className="text-sm text-muted-foreground">
              {transactionLabels[transaction.type]} - {transaction.investmentName}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Preço ({isCrypto ? 'USD' : 'BRL'})</Label>
              <Input
                id="price"
                type="number"
                step="any"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground">Novo total:</p>
            <p className={cn(
              "text-lg font-mono font-medium",
              transaction.type === 'buy' ? "text-success" : "text-primary"
            )}>
              R$ {((parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
