import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LayoutDashboard, PlusCircle, History } from 'lucide-react';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { PriceUpdateIndicator } from '@/components/PriceUpdateIndicator';
import { PersonalGoal } from '@/components/PersonalGoal';
import { useInvestments } from '@/hooks/useInvestments';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useStockPrices } from '@/hooks/useStockPrices';
import { useFIIPrices } from '@/hooks/useFIIPrices';
import { useGoldPrice } from '@/hooks/useGoldPrice';
import { Investment, Transaction } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { InvestmentsByTag, InvestmentTag } from '@/components/InvestmentsByTag';
import { useAuth } from '@/contexts/AuthContext';
import { InvestmentRegistration } from '@/components/InvestmentRegistration';
import { Button } from '@/components/ui/button';

import { EditInvestmentModal } from '@/components/EditInvestmentModal';
import { SellAssetModal } from '@/components/SellAssetModal';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentList } from '@/components/InvestmentList';
import { ResultsArea } from '@/components/ResultsArea';
import { TransactionHistory } from '@/components/TransactionHistory';

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
  const [isNavSticky, setIsNavSticky] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const navPlaceholderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Handle sticky nav on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (navPlaceholderRef.current) {
        const navTop = navPlaceholderRef.current.getBoundingClientRect().top;
        setIsNavSticky(navTop <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


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
    restoreInvestment,
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
  // Usa useRef para evitar dependência de investments e updateInvestment no array
  const investmentsRef = useRef(investments);
  investmentsRef.current = investments;
  const updateInvestmentRef = useRef(updateInvestment);
  updateInvestmentRef.current = updateInvestment;

  useEffect(() => {
    const currentInvestments = investmentsRef.current;
    const update = updateInvestmentRef.current;
    
    currentInvestments.forEach(inv => {
      let realTimePrice: number | null = null;
      
      if (inv.category === 'crypto' && inv.ticker) {
        realTimePrice = getCryptoPrice(inv.ticker);
      } else if (inv.category === 'stocks' && inv.ticker) {
        realTimePrice = getStockPrice(inv.ticker);
      } else if (inv.category === 'fii' && inv.ticker) {
        realTimePrice = getFIIPrice(inv.ticker);
      } else if (inv.category === 'gold' && goldPricePerGram && inv.weightGrams && inv.purity) {
        const purityMultiplier = inv.purity / 24;
        realTimePrice = goldPricePerGram * purityMultiplier;
      }
      
      if (realTimePrice && Math.abs(realTimePrice - inv.currentPrice) > 0.01) {
        update(inv.id, { currentPrice: realTimePrice });
      }
    });
  }, [cryptoPrices, goldPricePerGram, getCryptoPrice, getStockPrice, getFIIPrice]);

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
      // Busca o investimento existente pelo ticker ou nome
      const existingInvestment = investments.find(inv => {
        if (data.ticker) {
          return inv.ticker?.toLowerCase() === data.ticker.toLowerCase() && 
                 inv.category === data.category;
        }
        return inv.name.toLowerCase() === data.name.toLowerCase() && 
               inv.category === data.category;
      });

      // Calcula lucro/prejuízo se encontrou investimento
      let profitLoss: number | undefined;
      let profitLossPercent: number | undefined;
      
      if (existingInvestment) {
        const costBasis = data.quantity * existingInvestment.averagePrice;
        profitLoss = data.total - costBasis;
        profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
      }

      // Registra a transação de venda
      addTransaction({
        investmentId: existingInvestment?.id || '',
        investmentName: data.name,
        ticker: data.ticker,
        category: data.category as Investment['category'],
        type: 'sell',
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        profitLoss,
        profitLossPercent,
        date: data.date,
      });

      // Atualiza ou remove o investimento existente
      if (existingInvestment) {
        const remainingQuantity = existingInvestment.quantity - data.quantity;

        if (remainingQuantity <= 0) {
          deleteInvestment(existingInvestment.id);
        } else {
          updateInvestment(existingInvestment.id, {
            quantity: remainingQuantity,
            investedAmount: remainingQuantity * existingInvestment.averagePrice,
          });
        }
      }

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

  const handleDelete = async (id: string) => {
    requireAuth(async () => {
      // Encontra o investimento antes de deletar para mostrar toast instantâneo
      const investmentToDelete = investments.find(inv => inv.id === id);
      
      if (investmentToDelete) {
        // Toast instantâneo (optimistic UI)
        toast({
          title: 'Investimento removido',
          description: `${investmentToDelete.name} foi excluído.`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const restored = await restoreInvestment(investmentToDelete);
                if (restored) {
                  toast({
                    title: 'Investimento restaurado',
                    description: `${investmentToDelete.name} foi restaurado com sucesso.`,
                  });
                } else {
                  toast({
                    variant: 'destructive',
                    title: 'Erro ao restaurar',
                    description: 'Não foi possível restaurar o investimento.',
                  });
                }
              }}
            >
              Desfazer
            </Button>
          ),
        });
      }
      
      // Executa a exclusão em background
      await deleteInvestment(id);
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

  const handleSubmit = async (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>, tag?: InvestmentTag | null) => {
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

      // Se uma tag foi selecionada, salva ela
      if (tag) {
        handleTagChange(newInvestment.id, tag);
      }

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
        <svg className="w-12 h-12 animate-pulse" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' }}>
          <path d="M3 17L9 11L13 15L21 7" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 7H21V13" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Invest - Gerencie seus Investimentos</title>
        <meta name="description" content="Aplicativo para gerenciar e acompanhar todos os seus investimentos: criptomoedas, ações, fundos imobiliários, CDB, CDI e mais." />
      </Helmet>

      <div className="min-h-screen w-full bg-background overflow-x-hidden">
        <Header onAddClick={handleAddClick} currentPortfolioValue={getTotalValue() || getTotalInvested()} totalInvestedAmount={getTotalInvested()} transactions={transactions} />

        {/* Navigation Tabs Placeholder - maintains layout when nav becomes fixed */}
        <div ref={navPlaceholderRef} className={isNavSticky ? "h-[49px]" : "h-0"} />
        
        {/* Navigation Tabs */}
        <nav 
          ref={navRef}
          className={cn(
            "border-b border-border/50 bg-card/95 backdrop-blur-md z-40 w-full",
            isNavSticky 
              ? "fixed top-0 left-0 right-0 shadow-lg transition-shadow duration-300" 
              : "relative transition-shadow duration-300"
          )}
        >
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
            <div className="flex justify-around sm:justify-center gap-0 sm:gap-1 w-full">
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
                onClick={() => requireAuth(() => setActiveTab('register'))}
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
                onClick={() => requireAuth(() => setActiveTab('history'))}
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

        <main className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="animate-smooth-appear">
              {/* Personal Goal - Mobile only (above price update) */}
              <div className="md:hidden mb-4">
                <PersonalGoal currentPortfolioValue={getTotalValue() || getTotalInvested()} totalInvestedAmount={getTotalInvested()} transactions={transactions} className="w-full justify-center" />
              </div>

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
                  <CategoryChart categoryTotals={getCategoryTotals()} investments={investments} />
                </div>
                <div className="lg:col-span-2">
                  <ResultsArea investments={investments} />
                </div>
              </div>

              {/* Investimentos por Tag */}
              {Object.keys(investmentTags).length > 0 && (
                <div className="mt-6">
                  <InvestmentsByTag
                    investments={investments}
                    investmentTags={investmentTags}
                    onTagChange={handleTagChange}
                  />
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
                <InvestmentList
                  investments={[...investments].sort((a, b) => b.profitLoss - a.profitLoss)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSell={handleSell}
                  investmentTags={investmentTags}
                  onTagChange={handleTagChange}
                />
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="animate-smooth-appear">
              <InvestmentRegistration
                onSubmit={handleSubmit}
                onSell={handleDirectSell}
                onClose={() => setActiveTab('dashboard')}
                isModal={false}
              />
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
