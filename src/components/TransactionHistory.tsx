import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { Transaction, categoryLabels, transactionLabels } from '@/types/investment';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

function formatCurrency(value: number, isCrypto: boolean = false): string {
  return new Intl.NumberFormat(isCrypto ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: isCrypto ? 'USD' : 'BRL',
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

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
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
            className="investment-card transition-all duration-200"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
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
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isBuy ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  )}>
                    {transactionLabels[tx.type]}
                  </span>
                  <span className="font-medium text-card-foreground truncate">
                    {tx.investmentName}
                  </span>
                  {tx.ticker && (
                    <span className="text-primary text-sm font-mono">({tx.ticker})</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {tx.quantity.toLocaleString('pt-BR')} × {formatCurrency(tx.price, isCrypto)}
                </p>
              </div>

              <div className="text-right">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
