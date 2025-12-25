export type InvestmentCategory = 
  | 'crypto'
  | 'stocks'
  | 'fii'
  | 'cdb'
  | 'cdi'
  | 'treasury'
  | 'savings'
  | 'other';

export interface Investment {
  id: string;
  name: string;
  category: InvestmentCategory;
  ticker?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const categoryLabels: Record<InvestmentCategory, string> = {
  crypto: 'Criptomoedas',
  stocks: 'Ações',
  fii: 'Fundos Imobiliários',
  cdb: 'CDB',
  cdi: 'CDI',
  treasury: 'Tesouro Direto',
  savings: 'Poupança',
  other: 'Outros',
};

export const categoryColors: Record<InvestmentCategory, string> = {
  crypto: 'hsl(45, 100%, 50%)',
  stocks: 'hsl(200, 100%, 50%)',
  fii: 'hsl(280, 100%, 60%)',
  cdb: 'hsl(140, 100%, 50%)',
  cdi: 'hsl(320, 100%, 50%)',
  treasury: 'hsl(30, 100%, 50%)',
  savings: 'hsl(180, 100%, 40%)',
  other: 'hsl(0, 0%, 50%)',
};
