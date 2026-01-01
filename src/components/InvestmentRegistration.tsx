import { useState } from 'react';
import { 
  Bitcoin, 
  TrendingUp, 
  Building2, 
  Banknote, 
  Landmark, 
  PiggyBank,
  Wallet,
  Home,
  CircleDollarSign,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Investment } from '@/types/investment';
import { CryptoForm } from './forms/CryptoForm';
import { StockForm } from './forms/StockForm';
import { FIIForm } from './forms/FIIForm';
import { FixedIncomeForm } from './forms/FixedIncomeForm';
import { CashForm } from './forms/CashForm';
import { RealEstateForm } from './forms/RealEstateForm';
import { GoldForm } from './forms/GoldForm';

interface SellData {
  name: string;
  ticker: string;
  category: string;
  quantity: number;
  price: number;
  date: Date;
  total: number;
}

interface InvestmentRegistrationProps {
  onSubmit: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => void;
  onSell?: (data: SellData) => void;
  onClose: () => void;
  isModal?: boolean;
}

type FormType = 'menu' | 'crypto' | 'stocks' | 'fii' | 'cdb' | 'cdi' | 'treasury' | 'savings' | 'cash' | 'realestate' | 'gold';

const investmentTypes = [
  { id: 'crypto' as const, label: 'Criptomoedas', icon: Bitcoin, color: 'hsl(45, 100%, 50%)' },
  { id: 'stocks' as const, label: 'Ações', icon: TrendingUp, color: 'hsl(200, 100%, 50%)' },
  { id: 'fii' as const, label: 'Fundos Imobiliários', icon: Building2, color: 'hsl(280, 100%, 60%)' },
  { id: 'gold' as const, label: 'Ouro', icon: CircleDollarSign, color: 'hsl(50, 100%, 45%)' },
  { id: 'realestate' as const, label: 'Imóveis', icon: Home, color: 'hsl(220, 70%, 50%)' },
  { id: 'cash' as const, label: 'Dinheiro', icon: Wallet, color: 'hsl(120, 70%, 45%)' },
  { id: 'cdb' as const, label: 'CDB', icon: Banknote, color: 'hsl(140, 100%, 50%)' },
  { id: 'treasury' as const, label: 'Tesouro Direto', icon: Landmark, color: 'hsl(30, 100%, 50%)' },
  { id: 'savings' as const, label: 'Poupança', icon: PiggyBank, color: 'hsl(180, 100%, 40%)' },
];

export function InvestmentRegistration({ onSubmit, onSell, onClose, isModal = true }: InvestmentRegistrationProps) {
  const [currentForm, setCurrentForm] = useState<FormType>('menu');

  const handleSubmit = (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'profitLoss' | 'profitLossPercent'>) => {
    onSubmit(data);
    setCurrentForm('menu');
    if (isModal) {
      onClose();
    }
  };

  const handleSell = (data: SellData) => {
    if (onSell) {
      onSell(data);
      setCurrentForm('menu');
      if (isModal) {
        onClose();
      }
    }
  };

  const handleBack = () => {
    setCurrentForm('menu');
  };

  const renderForm = () => {
    switch (currentForm) {
      case 'crypto':
        return <CryptoForm onSubmit={handleSubmit} onSell={handleSell} onBack={handleBack} />;
      case 'stocks':
        return <StockForm onSubmit={handleSubmit} onSell={handleSell} onBack={handleBack} />;
      case 'fii':
        return <FIIForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'cash':
        return <CashForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'realestate':
        return <RealEstateForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'gold':
        return <GoldForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'cdb':
      case 'cdi':
      case 'treasury':
      case 'savings':
        return <FixedIncomeForm category={currentForm} onSubmit={handleSubmit} onBack={handleBack} />;
      default:
        return null;
    }
  };

  const content = currentForm === 'menu' ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {investmentTypes.map((type, index) => {
        const Icon = type.icon;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => setCurrentForm(type.id)}
            className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 active:scale-95 animate-slide-up group"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div 
              className="p-3 rounded-lg mb-3 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${type.color}20` }}
            >
              <Icon 
                className="w-6 h-6 transition-transform duration-200" 
                style={{ color: type.color }}
              />
            </div>
            <span className="font-medium text-card-foreground text-sm text-center group-hover:text-primary transition-colors">
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  ) : (
    <div className="animate-slide-in-right">
      {renderForm()}
    </div>
  );

  // Modal version
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto animate-fade-in">
        <div className="bg-card border border-border/50 rounded-xl w-full max-w-md shadow-2xl shadow-primary/5 animate-pop my-8 mx-4">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="text-lg font-semibold text-card-foreground">
              {currentForm === 'menu' ? 'Novo Investimento' : 'Cadastrar'}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-4">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Inline version (for register tab)
  return content;
}
