import { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calendar, TrendingUp, TrendingDown, Trash2, Edit, Filter, Wallet, DollarSign } from 'lucide-react';
import { Transaction, transactionLabels, categoryLabels, categoryColors } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

// Agrupa transações por mês/ano
function groupTransactionsByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(tx);
  });
  
  return groups;
}

export function TransactionHistory({ transactions, onDelete, onEdit }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(tx => tx.type === filter);
  }, [transactions, filter]);
  
  const groupedTransactions = useMemo(() => 
    groupTransactionsByMonth(filteredTransactions),
  [filteredTransactions]);
  
  // Estatísticas
  const stats = useMemo(() => {
    const buys = transactions.filter(tx => tx.type === 'buy');
    const sells = transactions.filter(tx => tx.type === 'sell');
    
    const totalInvested = buys.reduce((sum, tx) => sum + tx.total, 0);
    const totalSold = sells.reduce((sum, tx) => sum + tx.total, 0);
    const totalProfit = sells.reduce((sum, tx) => sum + (tx.profitLoss || 0), 0);
    
    return {
      totalTransactions: transactions.length,
      totalBuys: buys.length,
      totalSells: sells.length,
      totalInvested,
      totalSold,
      totalProfit,
    };
  }, [transactions]);

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
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Aportes</span>
            </div>
            <p className="font-mono text-sm font-semibold text-success">
              {formatCurrency(stats.totalInvested)}
            </p>
            <p className="text-xs text-muted-foreground">{stats.totalBuys} compras</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-muted-foreground">Vendas</span>
            </div>
            <p className="font-mono text-sm font-semibold text-destructive">
              {formatCurrency(stats.totalSold)}
            </p>
            <p className="text-xs text-muted-foreground">{stats.totalSells} vendas</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg border",
            stats.totalProfit >= 0 
              ? "bg-success/10 border-success/20" 
              : "bg-destructive/10 border-destructive/20"
          )}>
            <div className="flex items-center gap-1.5 mb-1">
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Realizado</span>
            </div>
            <p className={cn(
              "font-mono text-sm font-semibold",
              stats.totalProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
            </p>
            <p className="text-xs text-muted-foreground">lucro/prejuízo</p>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Todos
          </Button>
          <Button
            variant={filter === 'buy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('buy')}
            className={cn("flex-1", filter === 'buy' && "bg-success hover:bg-success/90")}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5" />
            Aportes
          </Button>
          <Button
            variant={filter === 'sell' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sell')}
            className={cn("flex-1", filter === 'sell' && "bg-destructive hover:bg-destructive/90")}
          >
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
            Vendas
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {Object.entries(groupedTransactions).map(([monthLabel, monthTransactions], groupIndex) => (
          <div key={monthLabel} className="mb-6 last:mb-0">
            {/* Month Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <Badge variant="secondary" className="font-medium capitalize">
                  📅 {monthLabel}
                </Badge>
                <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
              </div>
            </div>
            
            {/* Timeline Items */}
            <div className="relative pl-6 sm:pl-8">
              {/* Vertical Line */}
              <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-border to-transparent" />
              
              {monthTransactions.map((tx, index) => {
                const isBuy = tx.type === 'buy';
                const isCrypto = tx.category === 'crypto';
                const hasProfit = tx.type === 'sell' && tx.profitLoss !== undefined;
                const isPositive = hasProfit && (tx.profitLoss ?? 0) >= 0;
                
                return (
                  <div
                    key={tx.id}
                    className="relative mb-4 last:mb-0 animate-smooth-appear"
                    style={{ animationDelay: `${(groupIndex * 50) + (index * 30)}ms` }}
                  >
                    {/* Timeline Dot */}
                    <div className={cn(
                      "absolute -left-4 sm:-left-5 w-4 h-4 rounded-full border-2 border-background shadow-sm",
                      isBuy ? "bg-success" : "bg-destructive"
                    )}>
                      {isBuy ? (
                        <ArrowDownLeft className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      ) : (
                        <ArrowUpRight className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    
                    {/* Transaction Card */}
                    <div className={cn(
                      "investment-card ml-2 transition-all duration-200 hover:translate-x-1",
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
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: categoryColors[tx.category] }}
                          />
                          <span className="text-xs text-muted-foreground">
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
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-card-foreground">
                          {tx.investmentName}
                        </h4>
                        {tx.ticker && (
                          <span className="text-primary text-sm font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                            {tx.ticker}
                          </span>
                        )}
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Quantidade</p>
                          <p className="font-mono text-card-foreground">
                            {tx.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Preço</p>
                          <p className="font-mono text-card-foreground">
                            {formatCurrency(tx.price, isCrypto)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                          <p className="font-mono font-semibold text-primary">
                            {formatCurrency(tx.total, isCrypto)}
                          </p>
                        </div>
                        {hasProfit && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {isPositive ? 'Lucro' : 'Prejuízo'}
                            </p>
                            <p className={cn(
                              "font-mono font-semibold",
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
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{formatTime(tx.date)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {filteredTransactions.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma {filter === 'buy' ? 'compra' : 'venda'} encontrada.
          </p>
        </div>
      )}
    </div>
  );
}
