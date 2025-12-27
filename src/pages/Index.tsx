import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LayoutDashboard, PlusCircle, TrendingUp, History } from 'lucide-react';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentList } from '@/components/InvestmentList';
import { InvestmentRegistration } from '@/components/InvestmentRegistration';
import { ResultsArea } from '@/components/ResultsArea';
import { SellAssetModal } from '@/components/SellAssetModal';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useInvestments } from '@/hooks/useInvestments';
import { useTransactions } from '@/hooks/useTransactions';
import { Investment } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ActiveTab = 'dashboard' | 'register' | 'history';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
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

  const { transactions, addTransaction } = useTransactions();

  const handleAddClick = () => {
    setShowRegistration(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
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
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 -mb-px",
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
                  "flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 -mb-px",
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
                  "flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 -mb-px",
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
              <div className="investment-card p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Cadastrar Novo Investimento
                </h2>
                <InvestmentRegistration
                  onSubmit={handleSubmit}
                  onClose={() => setActiveTab('dashboard')}
                />
              </div>
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
              <TransactionHistory transactions={transactions} />
            </div>
          )}
        </main>

        {showRegistration && (
          <InvestmentRegistration
            onSubmit={handleSubmit}
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
      </div>
    </>
  );
};

export default Index;
