import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';

export type DisplayCurrency = 'BRL' | 'USD';

interface ValuesVisibilityContextType {
  showValues: boolean;
  toggleValuesVisibility: () => void;
  formatValue: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  formatCurrencyValue: (valueInBrl: number) => string;
  usdBrlRate: number;
  isRateLoading: boolean;
  rateLastUpdated: Date | null;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined);

export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem('showValues');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>(() => {
    const saved = localStorage.getItem('displayCurrency');
    return (saved === 'USD' || saved === 'BRL') ? saved : 'BRL';
  });

  const { rate: usdBrlRate, isLoading: isRateLoading, lastUpdated: rateLastUpdated } = useUsdBrlRate();

  useEffect(() => {
    localStorage.setItem('showValues', JSON.stringify(showValues));
  }, [showValues]);

  useEffect(() => {
    localStorage.setItem('displayCurrency', displayCurrency);
  }, [displayCurrency]);

  const toggleValuesVisibility = () => {
    setShowValues((prev: boolean) => !prev);
  };

  const setDisplayCurrency = (currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
  };

  const formatValue = (value: number, options?: Intl.NumberFormatOptions) => {
    if (!showValues) {
      return '*****';
    }
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options });
  };

  const formatPercent = (value: number) => {
    if (!showValues) {
      return '****';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Format currency value based on selected display currency
  const formatCurrencyValue = (valueInBrl: number) => {
    if (!showValues) {
      return '*****';
    }

    if (displayCurrency === 'USD') {
      const valueInUsd = valueInBrl / usdBrlRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(valueInUsd);
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueInBrl);
  };

  return (
    <ValuesVisibilityContext.Provider value={{ 
      showValues, 
      toggleValuesVisibility, 
      formatValue, 
      formatPercent,
      displayCurrency,
      setDisplayCurrency,
      formatCurrencyValue,
      usdBrlRate,
      isRateLoading,
      rateLastUpdated,
    }}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
}

export function useValuesVisibility() {
  const context = useContext(ValuesVisibilityContext);
  if (context === undefined) {
    throw new Error('useValuesVisibility must be used within a ValuesVisibilityProvider');
  }
  return context;
}
