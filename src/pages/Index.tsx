import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LayoutDashboard, PlusCircle, History } from 'lucide-react';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentList } from '@/components/InvestmentList';
import { InvestmentRegistration } from '@/components/InvestmentRegistration';
import { ResultsArea } from '@/components/ResultsArea';
import { SellAssetModal } from '@/components/SellAssetModal';
import { EditInvestmentModal } from '@/components/EditInvestmentModal';
import { TransactionHistory } from '@/components/TransactionHistory';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { PriceUpdateIndicator } from '@/components/PriceUpdateIndicator';
import { useInvestments } from '@/hooks/useInvestments';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useStockPrices } from '@/hooks/useStockPrices';
import { useFIIPrices } from '@/hooks/useFIIPrices';
import { Investment, Transaction } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ActiveTab = 'dashboard' | 'register' | 'history';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const {
    investments,
    isLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getTotalValue,
    getTotalInvested,
    getTotalProfitLoss,
    getCategoryTotals,
  } = useInvestments();

  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions();
  
  // Hooks de preços em tempo real
  const { 
    prices: cryptoPrices, 
    getPrice: getCryptoPrice, 
    isLoading: cryptoLoading, 
    lastUpdate: cryptoLastUpdate, 
    fetchPrices: fetchCryptoPrices 
  } = useCryptoPrices();
  
  const { 
    getPrice: getStockPrice, 
    isLoading: stocksLoading, 
    lastUpdate: stocksLastUpdate, 
    fetchPrices: fetchStockPrices 
  } = useStockPrices();
  
  const { 
    getPrice: getFIIPrice, 
    isLoading: fiiLoading, 
    lastUpdate: fiiLastUpdate, 
    fetchPrices: fetchFIIPrices 
  } = useFIIPrices();

  // Combina o status de loading
  const pricesLoading = cryptoLoading || stocksLoading || fiiLoading;
  
  // Usa a atualização mais recente
  const lastUpdate = [cryptoLastUpdate, stocksLastUpdate, fiiLastUpdate]
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null;

  // Função para atualizar todos os preços - busca preços reais para ativos da carteira
  const refreshAllPrices = useCallback(() => {
    // Busca preços de criptos
    const cryptoIds = investments
      .filter(inv => inv.category === 'crypto' && inv.ticker)
      .map(inv => inv.ticker!.toLowerCase());
    if (cryptoIds.length > 0) {
      fetchCryptoPrices(cryptoIds);
    }
    
    // Busca preços de ações da carteira via API
    const stockTickers = investments
      .filter(inv => inv.category === 'stocks' && inv.ticker)
      .map(inv => inv.ticker!);
    if (stockTickers.length > 0) {
      fetchStockPrices(stockTickers);
    }
    
    // Busca preços de FIIs da carteira via API
    const fiiTickers = investments
      .filter(inv => inv.category === 'fii' && inv.ticker)
      .map(inv => inv.ticker!);
    if (fiiTickers.length > 0) {
      fetchFIIPrices(fiiTickers);
    }
  }, [investments, fetchCryptoPrices, fetchStockPrices, fetchFIIPrices]);

  // Busca preços reais quando a carteira é carregada
  useEffect(() => {
    if (investments.length > 0) {
      refreshAllPrices();
    }
  }, [investments.length]); // Só executa quando o número de investimentos muda

  // Atualiza os preços em tempo real para todos os tipos de ativos
  useEffect(() => {
    investments.forEach(inv => {
      if (!inv.ticker) return;
      
      let realTimePrice: number | null = null;
      
      if (inv.category === 'crypto') {
        realTimePrice = getCryptoPrice(inv.ticker);
      } else if (inv.category === 'stocks') {
        realTimePrice = getStockPrice(inv.ticker);
      } else if (inv.category === 'fii') {
        realTimePrice = getFIIPrice(inv.ticker);
      }
      
      if (realTimePrice && Math.abs(realTimePrice - inv.currentPrice) > 0.01) {
        updateInvestment(inv.id, { currentPrice: realTimePrice });
      }
    });
  }, [cryptoPrices, investments, getCryptoPrice, getStockPrice, getFIIPrice, updateInvestment]);

  // Handler para venda direta do formulário de cadastro
  const handleDirectSell = (data: {
    name: string;
    ticker: string;
    category: string;
    quantity: number;
    price: number;
    date: Date;
    total: number;
  }) => {
    // Registra a transação de venda
    addTransaction({
      investmentId: '',
      investmentName: data.name,
      ticker: data.ticker,
      category: data.category as Investment['category'],
      type: 'sell',
      quantity: data.quantity,
      price: data.price,
      total: data.total,
      date: data.date,
    });

    toast({
      title: 'Venda registrada',
      description: `${data.quantity} unidades de ${data.name} vendidas com sucesso.`,
    });
  };

  const handleAddClick = () => {
    setShowRegistration(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
  };

  const handleSaveEdit = (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => {
    updateInvestment(id, data);
    toast({
      title: 'Investimento atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
    setEditingInvestment(null);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast({
      title: 'Transação removida',
      description: 'A transação foi excluída do histórico.',
    });
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveTransaction = (id: string, data: Partial<Transaction>) => {
    updateTransaction(id, data);
    toast({
      title: 'Transação atualizada',
      description: 'As alterações foram salvas com sucesso.',
    });
    setEditingTransaction(null);
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
    toast({
      title: 'Investimento removido',
      description: 'O investimento foi excluído com sucesso.',
    });
  };

  const handleSell = (investment: Investment) => {
    setSellingInvestment(investment);
  };

  const handleConfirmSell = (data: {
    quantity: number;
    price: number;
    date: Date;
    profitLoss: number;
    profitLossPercent: number;
  }) => {
    if (!sellingInvestment) return;

    // Registra a transação de venda
    addTransaction({
      investmentId: sellingInvestment.id,
      investmentName: sellingInvestment.name,
      ticker: sellingInvestment.ticker,
      category: sellingInvestment.category,
      type: 'sell',
      quantity: data.quantity,
      price: data.price,
      total: data.quantity * data.price,
      profitLoss: data.profitLoss,
      profitLossPercent: data.profitLossPercent,
      date: data.date,
    });

    // Atualiza ou remove o investimento
    const remainingQuantity = sellingInvestment.quantity - data.quantity;
    
    if (remainingQuantity <= 0) {
      deleteInvestment(sellingInvestment.id);
    } else {
      updateInvestment(sellingInvestment.id, {
        quantity: remainingQuantity,
        investedAmount: remainingQuantity * sellingInvestment.averagePrice,
      });
    }

    toast({
      title: 'Venda registrada',
      description: `${data.quantity} unidades de ${sellingInvestment.name} vendidas com sucesso.`,
    });

    setSellingInvestment(null);
  };

  const handleSubmit = (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    const newInvestment = addInvestment(data);
    
    // Registra a transação de compra
    addTransaction({
      investmentId: newInvestment.id,
      investmentName: data.name,
      ticker: data.ticker,
      category: data.category,
      type: 'buy',
      quantity: data.quantity,
      price: data.averagePrice,
      total: data.investedAmount,
      date: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
    });

    toast({
      title: 'Investimento adicionado',
      description: 'O novo investimento foi cadastrado com sucesso.',
    });
    setShowRegistration(false);
  };

  const handleClose = () => {
    setShowRegistration(false);
    setEditingInvestment(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary animate-pulse text-glow">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>InvestTracker - Gerencie seus Investimentos</title>
        <meta name="description" content="Aplicativo para gerenciar e acompanhar todos os seus investimentos: criptomoedas, ações, fundos imobiliários, CDB, CDI e mais." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onAddClick={handleAddClick} />

        {/* Navigation Tabs */}
        <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-[73px] z-30">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px whitespace-nowrap",
                  activeTab === 'dashboard'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px whitespace-nowrap",
                  activeTab === 'register'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                )}
              >
                <PlusCircle className="w-4 h-4" />
                Cadastrar
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px whitespace-nowrap",
                  activeTab === 'history'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                )}
              >
                <History className="w-4 h-4" />
                Histórico
              </button>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="animate-smooth-appear">
              {/* Price Update Indicator */}
              <div className="mb-4">
                <PriceUpdateIndicator
                  lastUpdate={lastUpdate}
                  isLoading={pricesLoading}
                  onRefresh={refreshAllPrices}
                />
              </div>

              <PortfolioStats
                totalValue={getTotalValue()}
                totalInvested={getTotalInvested()}
                totalProfitLoss={getTotalProfitLoss()}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-1">
                  <CategoryChart categoryTotals={getCategoryTotals()} />
                </div>
                <div className="lg:col-span-2">
                  <ResultsArea investments={investments} />
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Seus Investimentos
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({investments.length})
                    </span>
                  </h2>
                </div>
                <InvestmentList
                  investments={investments}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSell={handleSell}
                />
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="max-w-2xl mx-auto animate-smooth-appear">
              <InvestmentRegistration
                onSubmit={handleSubmit}
                onSell={handleDirectSell}
                onClose={() => setActiveTab('dashboard')}
                isModal={false}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-3xl mx-auto animate-smooth-appear">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Histórico de Transações
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Registro de todas as compras e vendas realizadas
                </p>
              </div>
              <TransactionHistory 
                transactions={transactions} 
                onDelete={handleDeleteTransaction} 
                onEdit={handleEditTransaction}
              />
            </div>
          )}
        </main>

        {showRegistration && (
          <InvestmentRegistration
            onSubmit={handleSubmit}
            onSell={handleDirectSell}
            onClose={handleClose}
          />
        )}

        {sellingInvestment && (
          <SellAssetModal
            investment={sellingInvestment}
            onSell={handleConfirmSell}
            onClose={() => setSellingInvestment(null)}
          />
        )}

        {editingInvestment && (
          <EditInvestmentModal
            investment={editingInvestment}
            onSave={handleSaveEdit}
            onClose={() => setEditingInvestment(null)}
          />
        )}

        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            onSave={handleSaveTransaction}
            onClose={() => setEditingTransaction(null)}
          />
        )}
      </div>
    </>
  );
};

export default Index;
