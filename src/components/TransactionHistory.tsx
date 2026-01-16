import { ArrowDownLeft, ArrowUpRight, History, Trash2, Edit } from 'lucide-react';
import { Transaction, transactionLabels } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

function formatCurrency(value: number, isCrypto: boolean = false): string {
  // Todos os valores agora são em BRL
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
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function TransactionHistory({ transactions, onDelete, onEdit }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="investment-card text-center py-12 animate-smooth-appear">
        <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhuma transação registrada ainda.</p>
        <p className="text-muted-foreground text-sm mt-2">
          Compre ou venda ativos para ver o histórico aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-smooth-appear">
      {transactions.map((tx, index) => {
        const isBuy = tx.type === 'buy';
        const isCrypto = tx.category === 'crypto';
        const hasProfit = tx.type === 'sell' && tx.profitLoss !== undefined;
        const isPositive = hasProfit && (tx.profitLoss ?? 0) >= 0;

        return (
          <div
            key={tx.id}
            className="investment-card transition-all duration-200 overflow-hidden"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors shrink-0",
                    isBuy ? "bg-success/20" : "bg-destructive/20"
                  )}>
                    {isBuy ? (
                      <ArrowDownLeft className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0",
                        isBuy ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      )}>
                        {transactionLabels[tx.type]}
                      </span>
                      <span className="font-medium text-card-foreground text-sm truncate max-w-[120px]">
                        {tx.investmentName}
                      </span>
                    </div>
                    {tx.ticker && (
                      <span className="text-primary text-xs font-mono">({tx.ticker})</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(tx)}
                      className="hover:text-primary hover:bg-primary/10 h-7 w-7"
                      title="Editar transação"
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
                      title="Excluir transação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {tx.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} × {formatCurrency(tx.price, isCrypto)}
                </span>
                <div className="text-right">
                  <p className="font-mono font-medium text-card-foreground text-sm">
                    {formatCurrency(tx.total, isCrypto)}
                  </p>
                  {hasProfit && (
                    <p className={cn(
                      "text-xs font-mono",
                      isPositive ? "text-success" : "text-destructive"
                    )}>
                      {isPositive ? '+' : ''}{(tx.profitLossPercent ?? 0).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {formatDate(tx.date)}
              </p>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg transition-colors shrink-0",
                isBuy ? "bg-success/20" : "bg-destructive/20"
              )}>
                {isBuy ? (
                  <ArrowDownLeft className="w-5 h-5 text-success" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-destructive" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                    isBuy ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  )}>
                    {transactionLabels[tx.type]}
                  </span>
                  <span className="font-medium text-card-foreground truncate">
                    {tx.investmentName}
                  </span>
                  {tx.ticker && (
                    <span className="text-primary text-sm font-mono shrink-0">({tx.ticker})</span>
                  )}
                  {isCrypto && (
                    <span className="text-xs text-muted-foreground font-mono shrink-0">USD</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {tx.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} × {formatCurrency(tx.price, isCrypto)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-mono font-medium text-card-foreground">
                  {formatCurrency(tx.total, isCrypto)}
                </p>
                {hasProfit && (
                  <p className={cn(
                    "text-xs font-mono",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? '+' : ''}{formatCurrency(tx.profitLoss ?? 0, isCrypto)}
                    <span className="ml-1">
                      ({isPositive ? '+' : ''}{(tx.profitLossPercent ?? 0).toFixed(2)}%)
                    </span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(tx.date)}
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(tx)}
                    className="hover:text-primary hover:bg-primary/10"
                    title="Editar transação"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(tx.id)}
                    className="hover:text-destructive hover:bg-destructive/10"
                    title="Excluir transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
