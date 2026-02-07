import { useState, useMemo, useEffect } from 'react';
import { Wallet, TrendingUp, Calendar, Building2, Landmark, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIncomePayments, IncomeType, incomeTypeLabels } from '@/hooks/useIncomePayments';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useInvestments } from '@/hooks/useInvestments';
import { useDividendSync } from '@/hooks/useDividendSync';
import { cn } from '@/lib/utils';
import { Investment, categoryLabels } from '@/types/investment';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type FilterType = 'all' | 'dividend' | 'rent' | 'interest';

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Todos', icon: <Wallet className="w-3 h-3" /> },
  { value: 'dividend', label: 'Dividendos', icon: <BarChart3 className="w-3 h-3" /> },
  { value: 'rent', label: 'Aluguéis', icon: <Building2 className="w-3 h-3" /> },
  { value: 'interest', label: 'Juros', icon: <Landmark className="w-3 h-3" /> },
];

const typeColors: Record<IncomeType, string> = {
  dividend: 'hsl(var(--primary))',
  rent: 'hsl(280, 100%, 60%)',
  interest: 'hsl(140, 100%, 50%)',
};

// Categories that pay dividends
const dividendCategories = ['stocks', 'fii', 'usastocks', 'reits', 'bdr', 'etf'];

// Categories that are real estate (rent)
const rentCategories = ['realestate'];

// Categories that pay interest (fixed income)
const interestCategories = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'debentures', 'cricra', 'fixedincomefund', 'savings', 'cash'];

interface ProjectedIncome {
  investmentId: string;
  investmentName: string;
  category: string;
  type: IncomeType;
  monthlyAmount: number;
  yearlyAmount: number;
}

export function PassiveIncome() {
  const { payments, isLoading, stats, deletePayment, refetch } = useIncomePayments();
  const { investments, isLoading: investmentsLoading } = useInvestments();
  const { formatCurrencyValue, showValues } = useValuesVisibility();
  const { isSyncing, syncDividends, lastSync } = useDividendSync(investments);
  const [filter, setFilter] = useState<FilterType>('all');

  // Refetch payments after sync completes
  useEffect(() => {
    if (!isSyncing && lastSync) {
      refetch();
    }
  }, [isSyncing, lastSync, refetch]);

  // Calculate projected income from existing investments
  const projectedIncome = useMemo(() => {
    const projections: ProjectedIncome[] = [];

    investments.forEach((inv: Investment) => {
      // Real Estate with rent
      if (rentCategories.includes(inv.category) && inv.dividends && inv.dividends > 0) {
        projections.push({
          investmentId: inv.id,
          investmentName: inv.name,
          category: inv.category,
          type: 'rent',
          monthlyAmount: inv.dividends,
          yearlyAmount: inv.dividends * 12,
        });
      }

      // Fixed Income - calculate monthly interest
      if (interestCategories.includes(inv.category) && inv.interestRate && inv.interestRate > 0) {
        // Annual rate to monthly income
        const annualRate = inv.interestRate / 100;
        const yearlyInterest = inv.currentValue * annualRate;
        const monthlyInterest = yearlyInterest / 12;
        
        projections.push({
          investmentId: inv.id,
          investmentName: inv.name,
          category: inv.category,
          type: 'interest',
          monthlyAmount: monthlyInterest,
          yearlyAmount: yearlyInterest,
        });
      }

      // Stocks/FIIs/REITs - These need manual entries since dividend amounts vary
      // We'll show them as eligible for adding dividend payments
    });

    return projections;
  }, [investments]);

  // Calculate totals by type
  const totals = useMemo(() => {
    const result = {
      dividend: { monthly: 0, yearly: 0 },
      rent: { monthly: 0, yearly: 0 },
      interest: { monthly: 0, yearly: 0 },
    };

    // From projections (rent from investments with dividends field and interest)
    projectedIncome.forEach(p => {
      result[p.type].monthly += p.monthlyAmount;
      result[p.type].yearly += p.yearlyAmount;
    });

    // From historical payments (ALL types - last 12 months)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    payments
      .filter(p => p.paymentDate >= oneYearAgo)
      .forEach(p => {
        result[p.type].yearly += p.amount;
      });

    // Calculate monthly average from yearly for dividends and rent payments
    result.dividend.monthly = result.dividend.yearly / 12;
    
    // For rent: add monthly average from payments to projected rent
    const rentPaymentsYearly = payments
      .filter(p => p.paymentDate >= oneYearAgo && p.type === 'rent')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Only add payment-based rent if there's no projection for the same investment
    const projectedRentInvestmentIds = projectedIncome
      .filter(p => p.type === 'rent')
      .map(p => p.investmentId);
    
    const manualRentPayments = payments
      .filter(p => 
        p.paymentDate >= oneYearAgo && 
        p.type === 'rent' && 
        !projectedRentInvestmentIds.includes(p.investmentId || '')
      )
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Add manual rent payments average to monthly
    result.rent.monthly += manualRentPayments / 12;

    return result;
  }, [projectedIncome, payments]);

  // Total income
  const totalMonthly = totals.dividend.monthly + totals.rent.monthly + totals.interest.monthly;
  const totalYearly = totals.dividend.yearly + totals.rent.yearly + totals.interest.yearly;

  // Filtered totals
  const filteredMonthly = filter === 'all' ? totalMonthly : totals[filter as IncomeType]?.monthly || 0;
  const filteredYearly = filter === 'all' ? totalYearly : totals[filter as IncomeType]?.yearly || 0;

  // Filter projections by type
  const filteredProjections = filter === 'all' 
    ? projectedIncome 
    : projectedIncome.filter(p => p.type === filter);

  // Filter payments by type
  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.type === filter);

  // Get dividend-paying investments that don't have projections
  const dividendInvestments = investments.filter(inv => 
    dividendCategories.includes(inv.category)
  );


  if (isLoading || investmentsLoading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-20 bg-muted rounded mb-4" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Renda Passiva
          {isSyncing && (
            <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </h3>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => syncDividends(true)} 
          disabled={isSyncing}
          title="Sincronizar dividendos"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap">
        {filterOptions.map(option => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option.value)}
            className="text-xs gap-1"
          >
            {option.icon}
            {option.label}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Projeção Mensal
          </p>
          <p className="text-xl font-bold text-primary">
            {showValues ? formatCurrencyValue(filteredMonthly) : '•••••'}
          </p>
        </div>
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Projeção Anual
          </p>
          <p className="text-xl font-bold text-success">
            {showValues ? formatCurrencyValue(filteredYearly) : '•••••'}
          </p>
        </div>
      </div>

      {/* Distribution by Type (only when filter is 'all') */}
      {filter === 'all' && totalYearly > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Distribuição por tipo</p>
          <div className="grid grid-cols-2 gap-2">
            {([['dividend', 'Dividendos'], ['rent', 'Aluguéis'], ['interest', 'Juros']] as [IncomeType, string][])
              .filter(([type]) => totals[type].yearly > 0)
              .sort(([a], [b]) => totals[b].yearly - totals[a].yearly)
              .map(([type, label]) => (
                <div
                  key={type}
                  className="flex items-center justify-between bg-background/30 rounded-lg p-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-6 rounded-full"
                      style={{ backgroundColor: typeColors[type] }}
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground ml-2">
                    {showValues ? formatCurrencyValue(totals[type].monthly) : '•••'}/mês
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Projected Income from Investments */}
      {filteredProjections.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {filter === 'rent' ? 'Aluguéis de Imóveis' : filter === 'interest' ? 'Rendimentos de Renda Fixa' : 'Renda Projetada'}
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filteredProjections.map(projection => (
              <div
                key={projection.investmentId}
                className="flex items-center justify-between bg-background/30 rounded-lg p-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-1.5 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typeColors[projection.type] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{projection.investmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[projection.category as keyof typeof categoryLabels]} • {incomeTypeLabels[projection.type]}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-mono text-success">
                    {showValues ? `+${formatCurrencyValue(projection.monthlyAmount)}` : '•••••'}
                  </span>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dividend-paying investments (need manual entries) */}
      {(filter === 'all' || filter === 'dividend') && dividendInvestments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Ativos que pagam dividendos</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {dividendInvestments.map(inv => {
              // Check if there are recent payments for this investment
              const recentPayment = payments.find(p => p.investmentId === inv.id);
              
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-background/20 rounded-lg p-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-1.5 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: typeColors.dividend }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{inv.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {categoryLabels[inv.category as keyof typeof categoryLabels]}
                      </p>
                    </div>
                  </div>
                  {recentPayment ? (
                    <span className="text-xs text-muted-foreground">
                      Último: {recentPayment.paymentDate.toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">
                      Sem registro
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Dividend Payments */}
      {filteredPayments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Dividendos Recebidos</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filteredPayments.slice(0, 8).map(payment => (
              <div
                key={payment.id}
                className="flex items-center justify-between bg-background/30 rounded-lg p-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-1.5 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typeColors[payment.type] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{payment.investmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.paymentDate.toLocaleDateString('pt-BR')} • {incomeTypeLabels[payment.type]}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-mono text-success">
                  {showValues ? `+${formatCurrencyValue(payment.amount)}` : '•••••'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalYearly === 0 && filteredPayments.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma renda passiva encontrada</p>
          <p className="text-xs">Adicione imóveis com aluguel, renda fixa ou registre dividendos</p>
        </div>
      )}

      {/* Total Summary */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-card-foreground">Total Projetado</p>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {showValues ? formatCurrencyValue(filteredMonthly) : '•••••'}<span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {showValues ? formatCurrencyValue(filteredYearly) : '•••••'}/ano
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
