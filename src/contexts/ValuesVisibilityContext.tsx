import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ValuesVisibilityContextType {
  showValues: boolean;
  toggleValuesVisibility: () => void;
  formatValue: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined);

export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem('showValues');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('showValues', JSON.stringify(showValues));
  }, [showValues]);

  const toggleValuesVisibility = () => {
    setShowValues((prev: boolean) => !prev);
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

  return (
    <ValuesVisibilityContext.Provider value={{ showValues, toggleValuesVisibility, formatValue, formatPercent }}>
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