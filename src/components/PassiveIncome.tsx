import { useState } from 'react';
import { Wallet, TrendingUp, Calendar, Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIncomePayments, IncomeType, incomeTypeLabels } from '@/hooks/useIncomePayments';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { useInvestments } from '@/hooks/useInvestments';
import { cn } from '@/lib/utils';
import { AddIncomeModal } from '@/components/AddIncomeModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type FilterType = 'all' | IncomeType;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'dividend', label: 'Dividendos' },
  { value: 'rent', label: 'Aluguéis' },
  { value: 'interest', label: 'Juros' },
  { value: 'jcp', label: 'JCP' },
];

const typeColors: Record<IncomeType, string> = {
  dividend: 'hsl(var(--primary))',
  rent: 'hsl(280, 100%, 60%)',
  interest: 'hsl(140, 100%, 50%)',
  jcp: 'hsl(45, 100%, 50%)',
};

export function PassiveIncome() {
  const { payments, isLoading, stats, deletePayment } = useIncomePayments();
  const { investments } = useInvestments();
  const { formatCurrencyValue, showValues } = useValuesVisibility();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.type === filter);

  const filteredStats = filter === 'all'
    ? stats
    : {
        ...stats,
        totalReceived: payments
          .filter(p => p.type === filter)
          .filter(p => {
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            return p.paymentDate >= oneYearAgo;
          })
          .reduce((sum, p) => sum + p.amount, 0),
        monthlyAverage: payments
          .filter(p => p.type === filter)
          .filter(p => {
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            return p.paymentDate >= oneYearAgo;
          })
          .reduce((sum, p) => sum + p.amount, 0) / 12,
      };

  const chartData = stats.last12Months.map(item => {
    if (filter === 'all') {
      return item;
    }
    // Calculate filtered amount for this month
    const monthPayments = payments.filter(p => {
      const monthName = p.paymentDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return monthName === item.month && p.type === filter;
    });
    return {
      month: item.month,
      amount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  });

  const handleDeletePayment = async (id: string) => {
    await deletePayment(id);
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-20 bg-muted rounded mb-4" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Renda Passiva
        </h3>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
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
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Média Mensal
          </p>
          <p className="text-xl font-bold text-primary">
            {showValues ? formatCurrencyValue(filteredStats.monthlyAverage) : '•••••'}
          </p>
        </div>
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Projeção Anual
          </p>
          <p className="text-xl font-bold text-success">
            {showValues ? formatCurrencyValue(filteredStats.monthlyAverage * 12) : '•••••'}
          </p>
        </div>
      </div>

      {/* Distribution by Type (only when filter is 'all') */}
      {filter === 'all' && stats.totalReceived > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Distribuição por tipo</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(stats.byType) as [IncomeType, number][])
              .filter(([_, amount]) => amount > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, amount]) => (
                <div
                  key={type}
                  className="flex items-center justify-between bg-background/30 rounded-lg p-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-6 rounded-full"
                      style={{ backgroundColor: typeColors[type] }}
                    />
                    <span className="text-xs font-medium">{incomeTypeLabels[type]}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {showValues ? formatCurrencyValue(amount) : '•••'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.some(d => d.amount > 0) && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                        <p className="text-xs font-medium">
                          {showValues ? formatCurrencyValue(payload[0].value as number) : '•••••'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={filter === 'all' ? 'hsl(var(--primary))' : typeColors[filter as IncomeType]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Payments List */}
      {filteredPayments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Últimos recebimentos</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredPayments.slice(0, 10).map(payment => (
              <div
                key={payment.id}
                className="flex items-center justify-between bg-background/30 rounded-lg p-2 group"
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-success">
                    {showValues ? `+${formatCurrencyValue(payment.amount)}` : '•••••'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeletePayment(payment.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum recebimento registrado</p>
          <p className="text-xs">Clique em "Adicionar" para registrar sua renda passiva</p>
        </div>
      )}

      {/* Total Last 12 Months */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total últimos 12 meses</p>
          <p className="text-lg font-bold text-primary">
            {showValues ? formatCurrencyValue(filteredStats.totalReceived) : '•••••'}
          </p>
        </div>
      </div>

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        investments={investments}
      />
    </div>
  );
}
