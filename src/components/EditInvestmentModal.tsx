import { useState, useMemo } from 'react';
import { X, Check, Calendar, Landmark, Building2, Percent } from 'lucide-react';
import { Investment, categoryLabels } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEconomicRates } from '@/hooks/useEconomicRates';
import { cn } from '@/lib/utils';

interface EditInvestmentModalProps {
  investment: Investment;
  onSave: (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onClose: () => void;
}

function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Categorias com ativos de mercado (têm ticker, quantidade, preço)
const marketCategories = ['stocks', 'fii', 'usastocks', 'reits', 'bdr', 'etf', 'crypto', 'gold'];

// Categorias de renda fixa
const fixedIncomeCategories = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'];

// Categorias que usam % do CDI como taxa
const cdiPercentageCategories = ['cash', 'savings'];

// Categorias de imóveis
const realEstateCategories = ['realestate'];

// Categorias de dinheiro
const cashCategories = ['cash'];

export function EditInvestmentModal({ investment, onSave, onClose }: EditInvestmentModalProps) {
  const { rates } = useEconomicRates();
  
  const isMarketAsset = marketCategories.includes(investment.category);
  const isFixedIncome = fixedIncomeCategories.includes(investment.category);
  const isRealEstate = realEstateCategories.includes(investment.category);
  const isCash = cashCategories.includes(investment.category);
  const isCdiPercentage = cdiPercentageCategories.includes(investment.category);
  
  const isCrypto = investment.category === 'crypto';
  const isUsaAsset = investment.category === 'usastocks' || investment.category === 'reits';
  const isUsdAsset = isCrypto || isUsaAsset;
  const currency = isUsdAsset ? 'USD' : 'BRL';
  const currencySymbol = isUsdAsset ? '$' : 'R$';

  const [formData, setFormData] = useState({
    // Campos comuns
    quantity: investment.quantity.toString(),
    averagePrice: investment.averagePrice.toString(),
    currentPrice: investment.currentPrice.toString(),
    purchaseDate: formatDateForInput(investment.purchaseDate),
    notes: investment.notes || '',
    
    // Campos de renda fixa
    investedAmount: investment.investedAmount.toString(),
    interestRate: investment.interestRate?.toString() || '',
    maturityDate: formatDateForInput(investment.maturityDate),
    bank: investment.bank || '',
    
    // Campos de imóveis
    dividends: investment.dividends?.toString() || '', // aluguel mensal
    address: investment.address || '',
    areaM2: investment.areaM2?.toString() || '',
  });

  // Calcula taxa efetiva para exibição
  const effectiveRate = useMemo(() => {
    const rate = parseFloat(formData.interestRate) || 0;
    if (isCdiPercentage) {
      return (rates.cdi * rate) / 100;
    }
    return rate;
  }, [formData.interestRate, rates.cdi, isCdiPercentage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>> = {
      purchaseDate: formData.purchaseDate || undefined,
      notes: formData.notes.trim() || undefined,
    };

    if (isMarketAsset) {
      const quantity = parseFloat(formData.quantity) || investment.quantity;
      const averagePrice = parseFloat(formData.averagePrice) || investment.averagePrice;
      const currentPrice = parseFloat(formData.currentPrice) || investment.currentPrice;
      const investedAmount = quantity * averagePrice;
      
      updates.quantity = quantity;
      updates.averagePrice = averagePrice;
      updates.currentPrice = currentPrice;
      updates.investedAmount = investedAmount;
    } else if (isFixedIncome || isCash) {
      const investedAmount = parseFloat(formData.investedAmount) || investment.investedAmount;
      const interestRate = parseFloat(formData.interestRate) || undefined;
      
      updates.investedAmount = investedAmount;
      updates.averagePrice = investedAmount;
      updates.currentPrice = investedAmount;
      updates.interestRate = interestRate;
      updates.maturityDate = formData.maturityDate || undefined;
      updates.bank = formData.bank.trim() || undefined;
    } else if (isRealEstate) {
      const investedAmount = parseFloat(formData.investedAmount) || investment.investedAmount;
      const currentPrice = parseFloat(formData.currentPrice) || investment.currentPrice;
      const dividends = parseFloat(formData.dividends) || undefined;
      const interestRate = parseFloat(formData.interestRate) || undefined;
      
      updates.investedAmount = investedAmount;
      updates.averagePrice = investedAmount;
      updates.currentPrice = currentPrice;
      updates.dividends = dividends;
      updates.interestRate = interestRate;
      updates.address = formData.address.trim() || undefined;
      updates.areaM2 = parseFloat(formData.areaM2) || undefined;
    }

    onSave(investment.id, updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold text-card-foreground">
            Editar Investimento
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Header com info do investimento */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="font-medium text-card-foreground">
              {investment.name}
              {investment.ticker && (
                <span className="ml-2 text-primary text-sm">({investment.ticker})</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {categoryLabels[investment.category]}
              {isUsdAsset && <span className="ml-2 font-mono">• USD</span>}
            </p>
          </div>

          {/* CAMPOS PARA ATIVOS DE MERCADO */}
          {isMarketAsset && (
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

              <div>
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

              <div>
                <Label htmlFor="purchaseDate" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Data de Compra
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* CAMPOS PARA RENDA FIXA */}
          {(isFixedIncome || isCash) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="investedAmount">Valor Investido (R$)</Label>
                  <Input
                    id="investedAmount"
                    type="number"
                    step="0.01"
                    value={formData.investedAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, investedAmount: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                {!cdiPercentageCategories.includes(investment.category) ? (
                  <div>
                    <Label htmlFor="interestRate" className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Taxa (% a.a.)
                    </Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                      placeholder="Ex: 12.5"
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="interestRate" className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      % do CDI
                    </Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                      placeholder="Ex: 100"
                      className="mt-1"
                    />
                    {formData.interestRate && (
                      <p className="text-xs text-success mt-1">
                        ≈ {effectiveRate.toFixed(2)}% a.a. (CDI: {rates.cdi.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="purchaseDate" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data Aplicação
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                {!isCash && (
                  <div>
                    <Label htmlFor="maturityDate" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Data Vencimento
                    </Label>
                    <Input
                      id="maturityDate"
                      type="date"
                      value={formData.maturityDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, maturityDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                )}

                {isCash && (
                  <div>
                    <Label htmlFor="bank" className="flex items-center gap-1">
                      <Landmark className="w-3 h-3" />
                      Banco/Instituição
                    </Label>
                    <Input
                      id="bank"
                      type="text"
                      value={formData.bank}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                      placeholder="Ex: Nubank, Itaú..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAMPOS PARA IMÓVEIS */}
          {isRealEstate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="investedAmount">Valor de Compra (R$)</Label>
                  <Input
                    id="investedAmount"
                    type="number"
                    step="0.01"
                    value={formData.investedAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, investedAmount: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="currentPrice">Valor Atual (R$)</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="interestRate" className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Valorização (% a.a.)
                  </Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                    placeholder="7.73"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dividends" className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Aluguel Mensal (R$)
                  </Label>
                  <Input
                    id="dividends"
                    type="number"
                    step="0.01"
                    value={formData.dividends}
                    onChange={(e) => setFormData(prev => ({ ...prev, dividends: e.target.value }))}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDate" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data de Compra
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Ex: Rua das Flores, 123"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="areaM2">Área (m²)</Label>
                  <Input
                    id="areaM2"
                    type="number"
                    step="0.01"
                    value={formData.areaM2}
                    onChange={(e) => setFormData(prev => ({ ...prev, areaM2: e.target.value }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observações - comum a todos */}
          <div>
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
