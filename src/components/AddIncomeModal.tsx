import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncomePayments, IncomeType, incomeTypeLabels } from '@/hooks/useIncomePayments';
import { useToast } from '@/hooks/use-toast';
import { Investment, categoryLabels } from '@/types/investment';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
}

// Categories that typically pay income
const incomeCategories = ['stocks', 'fii', 'usastocks', 'reits', 'bdr', 'etf', 'realestate', 'cdb', 'lci', 'lca', 'treasury', 'debentures', 'cricra', 'fixedincomefund', 'savings'];

export function AddIncomeModal({ isOpen, onClose, investments }: AddIncomeModalProps) {
  const { addPayment } = useIncomePayments();
  const { toast } = useToast();
  
  const [selectedInvestment, setSelectedInvestment] = useState<string>('');
  const [type, setType] = useState<IncomeType>('dividend');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [exDate, setExDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter investments that can pay income
  const eligibleInvestments = investments.filter(inv => 
    incomeCategories.includes(inv.category)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvestment || !amount || !paymentDate) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    const investment = investments.find(i => i.id === selectedInvestment);
    if (!investment) return;

    setIsSubmitting(true);

    try {
      const { error } = await addPayment({
        investmentId: investment.id,
        investmentName: investment.name,
        category: investment.category,
        type,
        amount: parseFloat(amount.replace(',', '.')),
        paymentDate: new Date(paymentDate),
        exDate: exDate ? new Date(exDate) : undefined,
        notes: notes || undefined,
      });

      if (error) throw error;

      toast({
        title: 'Recebimento registrado',
        description: `${incomeTypeLabels[type]} de ${investment.name} adicionado com sucesso.`,
      });

      // Reset form
      setSelectedInvestment('');
      setType('dividend');
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setExDate('');
      setNotes('');
      onClose();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar',
        description: err.message || 'Não foi possível registrar o recebimento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedInvestmentData = investments.find(i => i.id === selectedInvestment);

  // Determine available income types based on selected investment category
  const getAvailableTypes = (): IncomeType[] => {
    if (!selectedInvestmentData) return ['dividend', 'rent', 'interest'];
    
    const cat = selectedInvestmentData.category;
    
    if (cat === 'realestate') return ['rent'];
    if (['fii', 'reits'].includes(cat)) return ['dividend', 'rent'];
    if (['cdb', 'lci', 'lca', 'treasury', 'debentures', 'cricra', 'fixedincomefund', 'savings'].includes(cat)) return ['interest'];
    if (['stocks', 'bdr'].includes(cat)) return ['dividend'];
    
    return ['dividend', 'rent', 'interest'];
  };

  const availableTypes = getAvailableTypes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Registrar Recebimento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Investment Select */}
          <div className="space-y-2">
            <Label>Ativo *</Label>
            <Select value={selectedInvestment} onValueChange={setSelectedInvestment}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ativo" />
              </SelectTrigger>
              <SelectContent>
                {eligibleInvestments.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum ativo elegível encontrado
                  </SelectItem>
                ) : (
                  eligibleInvestments.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      <div className="flex items-center gap-2">
                        <span>{inv.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({categoryLabels[inv.category]})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Type Select */}
          <div className="space-y-2">
            <Label>Tipo de Recebimento *</Label>
            <Select value={type} onValueChange={(v) => setType(v as IncomeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(t => (
                  <SelectItem key={t} value={t}>
                    {incomeTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Recebido *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data do Pagamento *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Ex Date (optional) */}
          <div className="space-y-2">
            <Label htmlFor="exDate">Data Ex (opcional)</Label>
            <Input
              id="exDate"
              type="date"
              value={exDate}
              onChange={(e) => setExDate(e.target.value)}
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Ex: Dividendo trimestral"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
