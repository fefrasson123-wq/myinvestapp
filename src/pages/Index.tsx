import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentList } from '@/components/InvestmentList';
import { InvestmentForm } from '@/components/InvestmentForm';
import { useInvestments } from '@/hooks/useInvestments';
import { Investment } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
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

  const handleAddClick = () => {
    setEditingInvestment(null);
    setShowForm(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
    toast({
      title: 'Investimento removido',
      description: 'O investimento foi excluído com sucesso.',
    });
  };

  const handleSubmit = (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    if (editingInvestment) {
      updateInvestment(editingInvestment.id, data);
      toast({
        title: 'Investimento atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    } else {
      addInvestment(data);
      toast({
        title: 'Investimento adicionado',
        description: 'O novo investimento foi cadastrado com sucesso.',
      });
    }
    setShowForm(false);
    setEditingInvestment(null);
  };

  const handleClose = () => {
    setShowForm(false);
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

        <main className="container mx-auto px-4 py-6 space-y-6">
          <PortfolioStats
            totalValue={getTotalValue()}
            totalInvested={getTotalInvested()}
            totalProfitLoss={getTotalProfitLoss()}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CategoryChart categoryTotals={getCategoryTotals()} />
            </div>
            <div className="lg:col-span-2">
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
              />
            </div>
          </div>
        </main>

        {showForm && (
          <InvestmentForm
            investment={editingInvestment}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </>
  );
};

export default Index;
