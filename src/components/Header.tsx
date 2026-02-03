import { TrendingUp, Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { PersonalGoal } from '@/components/PersonalGoal';
import { Transaction } from '@/types/investment';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onAddClick: () => void;
  currentPortfolioValue?: number;
  totalInvestedAmount?: number;
  transactions?: Transaction[];
}

export function Header({ onAddClick, currentPortfolioValue = 0, totalInvestedAmount = 0, transactions = [] }: HeaderProps) {
  const navigate = useNavigate();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const { user } = useAuth();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md relative z-30 w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 glow-primary text-xl sm:text-2xl">
              🏆
            </div>
            <div className="text-left">
              <h1 className="text-lg sm:text-xl font-bold text-primary text-glow tracking-tight">
                Metas financeiras
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seus investimentos</p>
            </div>
          </button>
          
          {/* Personal Goal - Desktop: between logo and eye icon */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <PersonalGoal currentPortfolioValue={currentPortfolioValue} totalInvestedAmount={totalInvestedAmount} transactions={transactions} />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleValuesVisibility}
              className="bg-secondary/50 hover:bg-secondary transition-colors"
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? (
                <Eye className="w-5 h-5 text-muted-foreground" />
              ) : (
                <EyeOff className="w-5 h-5 text-primary" />
              )}
            </Button>
            {user && <NotificationBell />}
            <Button onClick={onAddClick} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Investimento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
