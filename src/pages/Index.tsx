import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LayoutDashboard, PlusCircle, History } from 'lucide-react';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { PriceUpdateIndicator } from '@/components/PriceUpdateIndicator';
import { useInvestments } from '@/hooks/useInvestments';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useStockPrices } from '@/hooks/useStockPrices';
import { useFIIPrices } from '@/hooks/useFIIPrices';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { Investment, Transaction } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { InvestmentTag } from '@/components/InvestmentsByTag';
import { useAuth } from '@/contexts/AuthContext';
// Lazy load heavy components to reduce initial bundle size
const CategoryChart = lazy(() => import('@/components/CategoryChart').then(m => ({ default: m.CategoryChart })));
const InvestmentList = lazy(() => import('@/components/InvestmentList').then(m => ({ default: m.InvestmentList })));
const InvestmentRegistration = lazy(() => import('@/components/InvestmentRegistration').then(m => ({ default: m.InvestmentRegistration })));
const ResultsArea = lazy(() => import('@/components/ResultsArea').then(m => ({ default: m.ResultsArea })));
const SellAssetModal = lazy(() => import('@/components/SellAssetModal').then(m => ({ default: m.SellAssetModal })));
const EditInvestmentModal = lazy(() => import('@/components/EditInvestmentModal').then(m => ({ default: m.EditInvestmentModal })));
const TransactionHistory = lazy(() => import('@/components/TransactionHistory').then(m => ({ default: m.TransactionHistory })));
const EditTransactionModal = lazy(() => import('@/components/EditTransactionModal').then(m => ({ default: m.EditTransactionModal })));
const InvestmentsByTag = lazy(() => import('@/components/InvestmentsByTag').then(m => ({ default: m.InvestmentsByTag })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-primary animate-pulse">Carregando...</div>
  </div>
);

type ActiveTab = 'dashboard' | 'register' | 'history';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [investmentTags, setInvestmentTags] = useState<Record<string, InvestmentTag>>(() => {
    const saved = localStorage.getItem('investment-tags');
    return saved ? JSON.parse(saved) : {};
  });
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();


  // Salva tags no localStorage
  useEffect(() => {
    localStorage.setItem('investment-tags', JSON.stringify(investmentTags));
  }, [investmentTags]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Crie sua conta para continuar',
          description: 'Cadastre-se para realizar ações no app.',
        });
        navigate('/auth?mode=signup');
        return;
      }
      action();
    },
    [user, toast, navigate]
  );

  const handleTagChange = useCallback((investmentId: string, tag: InvestmentTag | null) => {
    setInvestmentTags(prev => {
      const newTags = { ...prev };
      if (tag === null) {
        delete newTags[investmentId];
      } else {
        newTags[investmentId] = tag;
      }
      return newTags;
    });
  }, []);


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

  const {
    pricePerGram: goldPricePerGram,
    isLoading: goldLoading,
    lastUpdate: goldLastUpdate,
    fetchPrice: fetchGoldPrice,
  } = useGoldPrice();

  // Combina o status de loading
  const pricesLoading = cryptoLoading || stocksLoading || fiiLoading || goldLoading;
  
  // Usa a atualização mais recente
  const lastUpdate = [cryptoLastUpdate, stocksLastUpdate, fiiLastUpdate, goldLastUpdate]
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

    // Busca preço do ouro
    const hasGold = investments.some(inv => inv.category === 'gold');
    if (hasGold) {
      fetchGoldPrice();
    }
  }, [investments, fetchCryptoPrices, fetchStockPrices, fetchFIIPrices, fetchGoldPrice]);

  // Busca preços reais quando a carteira é carregada
  useEffect(() => {
    if (investments.length > 0) {
      refreshAllPrices();
    }
  }, [investments.length]); // Só executa quando o número de investimentos muda

  // Atualiza os preços em tempo real para todos os tipos de ativos
  useEffect(() => {
    investments.forEach(inv => {
      let realTimePrice: number | null = null;
      
      if (inv.category === 'crypto' && inv.ticker) {
        realTimePrice = getCryptoPrice(inv.ticker);
      } else if (inv.category === 'stocks' && inv.ticker) {
        realTimePrice = getStockPrice(inv.ticker);
      } else if (inv.category === 'fii' && inv.ticker) {
        realTimePrice = getFIIPrice(inv.ticker);
      } else if (inv.category === 'gold' && goldPricePerGram && inv.weightGrams && inv.purity) {
        // Para ouro, calcula o valor atual baseado no peso e pureza
        const purityMultiplier = inv.purity / 24;
        realTimePrice = goldPricePerGram * purityMultiplier;
      }
      
      if (realTimePrice && Math.abs(realTimePrice - inv.currentPrice) > 0.01) {
        updateInvestment(inv.id, { currentPrice: realTimePrice });
      }
    });
  }, [cryptoPrices, goldPricePerGram, investments, getCryptoPrice, getStockPrice, getFIIPrice, updateInvestment]);

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
    requireAuth(() => {
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
    });
  };

  const handleAddClick = () => {
    requireAuth(() => setShowRegistration(true));
  };

  const handleEdit = (investment: Investment) => {
    requireAuth(() => setEditingInvestment(investment));
  };

  const handleSaveEdit = (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => {
    requireAuth(() => {
      updateInvestment(id, data);
      toast({
        title: 'Investimento atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
      setEditingInvestment(null);
    });
  };

  const handleDeleteTransaction = (id: string) => {
    requireAuth(() => {
      deleteTransaction(id);
      toast({
        title: 'Transação removida',
        description: 'A transação foi excluída do histórico.',
      });
    });
  };

  const handleEditTransaction = (transaction: Transaction) => {
    requireAuth(() => setEditingTransaction(transaction));
  };

  const handleSaveTransaction = (id: string, data: Partial<Transaction>) => {
    requireAuth(() => {
      updateTransaction(id, data);
      toast({
        title: 'Transação atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
      setEditingTransaction(null);
    });
  };

  const handleDelete = (id: string) => {
    requireAuth(() => {
      deleteInvestment(id);
      toast({
        title: 'Investimento removido',
        description: 'O investimento foi excluído com sucesso.',
      });
    });
  };

  const handleSell = (investment: Investment) => {
    requireAuth(() => setSellingInvestment(investment));
  };

  const handleConfirmSell = (data: {
    quantity: number;
    price: number;
    date: Date;
    profitLoss: number;
    profitLossPercent: number;
  }) => {
    if (!sellingInvestment) return;

    requireAuth(() => {
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
    });
  };

  const handleSubmit = async (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    if (!user) {
      requireAuth(() => {});
      return;
    }

    const newInvestment = await addInvestment(data);

    if (newInvestment) {
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
    }
    setShowRegistration(false);
  };

  const handleClose = () => {
    setShowRegistration(false);
    setEditingInvestment(null);
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary animate-pulse text-glow">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Invest - Gerencie seus Investimentos</title>
        <meta name="description" content="Aplicativo para gerenciar e acompanhar todos os seus investimentos: criptomoedas, ações, fundos imobiliários, CDB, CDI e mais." />
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header onAddClick={handleAddClick} />

        {/* Navigation Tabs */}
        <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-40">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex justify-around sm:justify-center gap-0 sm:gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px text-xs sm:text-base min-w-0",
                  activeTab === 'dashboard'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                )}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={cn(
                  "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px text-xs sm:text-base min-w-0",
                  activeTab === 'register'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                )}
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Cadastrar</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-3 font-medium transition-all duration-200 border-b-2 -mb-px text-xs sm:text-base min-w-0",
                  activeTab === 'history'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                )}
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Histórico</span>
              </button>
            </div>
          </div>
        </nav>

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
                  <Suspense fallback={<LoadingFallback />}>
                    <CategoryChart categoryTotals={getCategoryTotals()} investments={investments} />
                  </Suspense>
                </div>
                <div className="lg:col-span-2">
                  <Suspense fallback={<LoadingFallback />}>
                    <ResultsArea investments={investments} />
                  </Suspense>
                </div>
              </div>

              {/* Investimentos por Tag */}
              {Object.keys(investmentTags).length > 0 && (
                <div className="mt-6">
                  <Suspense fallback={<LoadingFallback />}>
                    <InvestmentsByTag
                      investments={investments}
                      investmentTags={investmentTags}
                      onTagChange={handleTagChange}
                    />
                  </Suspense>
                </div>
              )}

              <div className="mt-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Seus Investimentos
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({investments.length})
                    </span>
                  </h2>
                </div>
                <Suspense fallback={<LoadingFallback />}>
                  <InvestmentList
                    investments={investments}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSell={handleSell}
                    investmentTags={investmentTags}
                    onTagChange={handleTagChange}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="animate-smooth-appear">
              <Suspense fallback={<LoadingFallback />}>
                <InvestmentRegistration
                  onSubmit={handleSubmit}
                  onSell={handleDirectSell}
                  onClose={() => setActiveTab('dashboard')}
                  isModal={false}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-smooth-appear">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-card-foreground flex items-center gap-2">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Histórico de Transações
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  Registro de todas as compras e vendas
                </p>
              </div>
              <Suspense fallback={<LoadingFallback />}>
                <TransactionHistory 
                  transactions={transactions} 
                  onDelete={handleDeleteTransaction} 
                  onEdit={handleEditTransaction}
                />
              </Suspense>
            </div>
          )}
        </main>

        {showRegistration && (
          <Suspense fallback={<LoadingFallback />}>
            <InvestmentRegistration
              onSubmit={handleSubmit}
              onSell={handleDirectSell}
              onClose={handleClose}
            />
          </Suspense>
        )}

        {sellingInvestment && (
          <Suspense fallback={<LoadingFallback />}>
            <SellAssetModal
              investment={sellingInvestment}
              onSell={handleConfirmSell}
              onClose={() => setSellingInvestment(null)}
            />
          </Suspense>
        )}

        {editingInvestment && (
          <Suspense fallback={<LoadingFallback />}>
            <EditInvestmentModal
              investment={editingInvestment}
              onSave={handleSaveEdit}
              onClose={() => setEditingInvestment(null)}
            />
          </Suspense>
        )}

        {editingTransaction && (
          <Suspense fallback={<LoadingFallback />}>
            <EditTransactionModal
              transaction={editingTransaction}
              onSave={handleSaveTransaction}
              onClose={() => setEditingTransaction(null)}
            />
          </Suspense>
        )}
      </div>
    </>
  );
};

export default Index;
