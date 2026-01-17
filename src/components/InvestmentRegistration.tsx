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
  ArrowLeft,
  Percent,
  Building,
  FileText,
  TrendingDown,
  DollarSign,
  Globe,
  BarChart3,
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
import { USAStockForm } from './forms/USAStockForm';
import { REITsForm } from './forms/REITsForm';
import { BDRForm } from './forms/BDRForm';
import { ETFForm } from './forms/ETFForm';

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

type FormType = 'menu' | 'fixedincomeMenu' | 'usaMenu' | 'crypto' | 'stocks' | 'fii' | 'cdb' | 'lcilca' | 'lci' | 'lca' | 'treasury' | 'savings' | 'cash' | 'realestate' | 'gold' | 'debentures' | 'cricra' | 'fixedincomefund' | 'usastocks' | 'reits' | 'bdr' | 'etf';

// Categorias principais (menu inicial)
const mainInvestmentTypes = [
  { id: 'crypto' as const, label: 'Criptomoedas', icon: Bitcoin, color: 'hsl(45, 100%, 50%)' },
  { id: 'stocks' as const, label: 'Ações', icon: TrendingUp, color: 'hsl(200, 100%, 50%)' },
  { id: 'fii' as const, label: 'Fundos Imobiliários', icon: Building2, color: 'hsl(280, 100%, 60%)' },
  { id: 'etf' as const, label: 'ETF', icon: BarChart3, color: 'hsl(170, 80%, 45%)' },
  { id: 'bdr' as const, label: 'BDR', icon: Globe, color: 'hsl(190, 90%, 45%)' },
  { id: 'usaMenu' as const, label: 'Bolsa Americana', icon: DollarSign, color: 'hsl(210, 100%, 45%)' },
  { id: 'fixedincomeMenu' as const, label: 'Renda Fixa', icon: Percent, color: 'hsl(140, 100%, 50%)' },
  { id: 'gold' as const, label: 'Ouro', icon: CircleDollarSign, color: 'hsl(50, 100%, 45%)' },
  { id: 'realestate' as const, label: 'Imóveis', icon: Home, color: 'hsl(220, 70%, 50%)' },
  { id: 'cash' as const, label: 'Dinheiro', icon: Wallet, color: 'hsl(120, 70%, 45%)' },
];

// Subcategorias de Renda Fixa
const fixedIncomeTypes = [
  { id: 'treasury' as const, label: 'Tesouro Direto', icon: Landmark, color: 'hsl(30, 100%, 50%)' },
  { id: 'cdb' as const, label: 'CDB', icon: Banknote, color: 'hsl(140, 100%, 50%)' },
  { id: 'lci' as const, label: 'LCI', icon: Building, color: 'hsl(160, 80%, 45%)' },
  { id: 'lca' as const, label: 'LCA', icon: TrendingDown, color: 'hsl(100, 70%, 45%)' },
  { id: 'savings' as const, label: 'Poupança', icon: PiggyBank, color: 'hsl(180, 100%, 40%)' },
  { id: 'debentures' as const, label: 'Debêntures', icon: FileText, color: 'hsl(260, 70%, 55%)' },
  { id: 'cricra' as const, label: 'CRI / CRA', icon: Building2, color: 'hsl(320, 70%, 50%)' },
  { id: 'fixedincomefund' as const, label: 'Fundo de Renda Fixa', icon: Percent, color: 'hsl(200, 70%, 50%)' },
];

// Subcategorias de Bolsa Americana
const usaMarketTypes = [
  { id: 'usastocks' as const, label: 'Ações Americanas', icon: TrendingUp, color: 'hsl(210, 100%, 45%)' },
  { id: 'reits' as const, label: 'REITs', icon: Building2, color: 'hsl(250, 80%, 55%)' },
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
    // Se estiver em um formulário de renda fixa, volta para o menu de renda fixa
    const fixedIncomeIds = fixedIncomeTypes.map(t => t.id);
    const usaMarketIds = usaMarketTypes.map(t => t.id);
    if (fixedIncomeIds.includes(currentForm as any)) {
      setCurrentForm('fixedincomeMenu');
    } else if (usaMarketIds.includes(currentForm as any)) {
      setCurrentForm('usaMenu');
    } else {
      setCurrentForm('menu');
    }
  };

  const handleBackToMainMenu = () => {
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
      case 'bdr':
        return <BDRForm onSubmit={handleSubmit} onSell={handleSell} onBack={handleBack} />;
      case 'etf':
        return <ETFForm onSubmit={handleSubmit} onSell={handleSell} onBack={handleBack} />;
      case 'cash':
        return <CashForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'realestate':
        return <RealEstateForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'gold':
        return <GoldForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'usastocks':
        return <USAStockForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'reits':
        return <REITsForm onSubmit={handleSubmit} onBack={handleBack} />;
      case 'cdb':
      case 'lci':
      case 'lca':
      case 'lcilca':
      case 'treasury':
      case 'savings':
      case 'debentures':
      case 'cricra':
      case 'fixedincomefund':
        return <FixedIncomeForm category={currentForm} onSubmit={handleSubmit} onBack={handleBack} />;
      default:
        return null;
    }
  };

  const renderCategoryGrid = (types: typeof mainInvestmentTypes | typeof fixedIncomeTypes | typeof usaMarketTypes) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {types.map((type, index) => {
        const Icon = type.icon;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => setCurrentForm(type.id)}
            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 active:scale-95 animate-slide-up group"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div 
              className="p-2 rounded-lg mb-2 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${type.color}20` }}
            >
              <Icon 
                className="w-5 h-5 transition-transform duration-200" 
                style={{ color: type.color }}
              />
            </div>
            <span className="font-medium text-card-foreground text-xs text-center group-hover:text-primary transition-colors">
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  const getTitle = () => {
    if (currentForm === 'menu') return 'Novo Investimento';
    if (currentForm === 'fixedincomeMenu') return 'Renda Fixa';
    if (currentForm === 'usaMenu') return 'Bolsa Americana';
    return 'Cadastrar';
  };

  const content = () => {
    if (currentForm === 'menu') {
      return renderCategoryGrid(mainInvestmentTypes);
    }
    
    if (currentForm === 'fixedincomeMenu') {
      return (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMainMenu}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          {renderCategoryGrid(fixedIncomeTypes)}
        </div>
      );
    }

    if (currentForm === 'usaMenu') {
      return (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMainMenu}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          {renderCategoryGrid(usaMarketTypes)}
        </div>
      );
    }

    return (
      <div className="animate-slide-in-right">
        {renderForm()}
      </div>
    );
  };

  // Modal version
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto animate-fade-in">
        <div className="bg-card border border-border/50 rounded-xl w-full max-w-md shadow-2xl shadow-primary/5 animate-pop mt-4 mb-4 mx-4">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <h2 className="text-base font-semibold text-card-foreground">
              {getTitle()}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-3">
            {content()}
          </div>
        </div>
      </div>
    );
  }

  // Inline version (for register tab)
  return content();
}
