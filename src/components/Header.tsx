import { TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onAddClick: () => void;
}

export function Header({ onAddClick }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md relative z-30">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 glow-primary">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-lg sm:text-xl font-bold text-primary text-glow tracking-tight">
                My Invest
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seus investimentos</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
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
