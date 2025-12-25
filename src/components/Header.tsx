import { TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddClick: () => void;
}

export function Header({ onAddClick }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 glow-primary">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary text-glow tracking-tight">
                InvestTracker
              </h1>
              <p className="text-xs text-muted-foreground">Gerencie seus investimentos</p>
            </div>
          </div>
          
          <Button onClick={onAddClick} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar Investimento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
