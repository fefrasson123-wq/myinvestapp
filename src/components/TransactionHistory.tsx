import { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calendar, Trash2, Edit, Filter, ChevronDown, Check } from 'lucide-react';
import { Transaction, transactionLabels, categoryLabels, categoryColors } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

type FilterType = 'all' | 'buy' | 'sell';

function formatCurrency(value: number, isCrypto: boolean = false): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: isCrypto ? 6 : 2,
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Retorna lista de meses disponíveis nas transações
function getAvailableMonths(transactions: Transaction[]): { key: string; label: string }[] {
  const monthsSet = new Map<string, string>();
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    monthsSet.set(key, label);
  });
  
  return Array.from(monthsSet.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, label]) => ({ key, label }));
}

export function TransactionHistory({ transactions, onDelete, onEdit }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [monthPopoverOpen, setMonthPopoverOpen] = useState(false);
  
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    // Filter by type
    if (filter !== 'all') {
      result = result.filter(tx => tx.type === filter);
    }
    
    // Filter by month
    if (selectedMonth !== 'all') {
      result = result.filter(tx => {
        const date = new Date(tx.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, selectedMonth]);
  
  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Todos os meses';
    return availableMonths.find(m => m.key === selectedMonth)?.label || 'Todos os meses';
  }, [selectedMonth, availableMonths]);
  
  // Estatísticas baseadas no mês selecionado
  const stats = useMemo(() => {
    // Filtra apenas por mês, não por tipo
    let monthFiltered = transactions;
    if (selectedMonth !== 'all') {
      monthFiltered = transactions.filter(tx => {
        const date = new Date(tx.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }
    
    const buys = monthFiltered.filter(tx => tx.type === 'buy');
    const sells = monthFiltered.filter(tx => tx.type === 'sell');
    
    const totalInvested = buys.reduce((sum, tx) => sum + tx.total, 0);
    const totalSold = sells.reduce((sum, tx) => sum + tx.total, 0);
    
    return {
      totalTransactions: monthFiltered.length,
      totalBuys: buys.length,
      totalSells: sells.length,
      totalInvested,
      totalSold,
    };
  }, [transactions, selectedMonth]);

  if (transactions.length === 0) {
    return (
      <div className="investment-card text-center py-16 animate-smooth-appear">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          Linha do tempo vazia
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Suas transações de compra e venda aparecerão aqui em ordem cronológica.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-smooth-appear">
      {/* Header com título e estatísticas */}
      <div className="investment-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Linha do Tempo Financeira</h2>
            <p className="text-xs text-muted-foreground">
              {stats.totalTransactions} transações registradas
            </p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-success flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">Aportes</span>
            </div>
            <p className="font-mono text-xs sm:text-sm font-semibold text-success truncate">
              {formatCurrency(stats.totalInvested)}
            </p>
            <p className="text-xs text-muted-foreground">{stats.totalBuys} compras</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">Vendas</span>
            </div>
            <p className="font-mono text-xs sm:text-sm font-semibold text-destructive truncate">
              {formatCurrency(stats.totalSold)}
            </p>
            <p className="text-xs text-muted-foreground">{stats.totalSells} vendas</p>
          </div>
        </div>
        
        {/* Month Selector */}
        <Popover open={monthPopoverOpen} onOpenChange={setMonthPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="capitalize truncate">{selectedMonthLabel}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 bg-popover border border-border shadow-lg z-50" align="start">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedMonth('all');
                  setMonthPopoverOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                  selectedMonth === 'all' 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
              >
                <span>Todos os meses</span>
                {selectedMonth === 'all' && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
              {availableMonths.map((month) => (
                <button
                  key={month.key}
                  onClick={() => {
                    setSelectedMonth(month.key);
                    setMonthPopoverOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors capitalize",
                    selectedMonth === month.key 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <span className="truncate">{month.label}</span>
                  {selectedMonth === month.key && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="w-full px-2 text-xs sm:text-sm"
          >
            <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">Todos</span>
          </Button>
          <Button
            variant={filter === 'buy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('buy')}
            className={cn("w-full px-2 text-xs sm:text-sm", filter === 'buy' && "bg-success hover:bg-success/90")}
          >
            <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">Aportes</span>
          </Button>
          <Button
            variant={filter === 'sell' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sell')}
            className={cn("w-full px-2 text-xs sm:text-sm", filter === 'sell' && "bg-destructive hover:bg-destructive/90")}
          >
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">Vendas</span>
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((tx, index) => {
          const isBuy = tx.type === 'buy';
          const isCrypto = tx.category === 'crypto';
          const hasProfit = tx.type === 'sell' && tx.profitLoss !== undefined;
          const isPositive = hasProfit && (tx.profitLoss ?? 0) >= 0;
          
          return (
            <div
              key={tx.id}
              className="animate-smooth-appear"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Transaction Card */}
              <div className={cn(
                "investment-card transition-all duration-200",
                "border-l-4",
                isBuy ? "border-l-success" : "border-l-destructive"
              )}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-medium",
                        isBuy 
                          ? "border-success/50 text-success bg-success/10" 
                          : "border-destructive/50 text-destructive bg-destructive/10"
                      )}
                    >
                      {isBuy ? '💰 Compra' : '💸 Venda'}
                    </Badge>
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: categoryColors[tx.category] }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {categoryLabels[tx.category]}
                    </span>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(tx)}
                        className="hover:text-primary hover:bg-primary/10 h-7 w-7"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(tx.id)}
                        className="hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Asset Info */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h4 className="font-semibold text-card-foreground truncate">
                    {tx.investmentName}
                  </h4>
                  {tx.ticker && (
                    <span className="text-primary text-xs sm:text-sm font-mono bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      {tx.ticker}
                    </span>
                  )}
                </div>
                
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Quantidade</p>
                    <p className="font-mono text-card-foreground text-xs sm:text-sm truncate">
                      {tx.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Preço</p>
                    <p className="font-mono text-card-foreground text-xs sm:text-sm truncate">
                      {formatCurrency(tx.price, isCrypto)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                    <p className="font-mono font-semibold text-primary text-xs sm:text-sm truncate">
                      {formatCurrency(tx.total, isCrypto)}
                    </p>
                  </div>
                  {hasProfit && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {isPositive ? 'Lucro' : 'Prejuízo'}
                      </p>
                      <p className={cn(
                        "font-mono font-semibold text-xs sm:text-sm truncate",
                        isPositive ? "text-success" : "text-destructive"
                      )}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.profitLoss ?? 0, isCrypto)}
                        <span className="text-xs ml-1 opacity-75">
                          ({isPositive ? '+' : ''}{(tx.profitLossPercent ?? 0).toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Footer with date */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(tx.date)}</span>
                  <span>•</span>
                  <span>{formatTime(tx.date)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredTransactions.length === 0 && (filter !== 'all' || selectedMonth !== 'all') && (
        <div className="investment-card text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma transação encontrada para os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}
