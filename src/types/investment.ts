export type InvestmentCategory = 
  | 'crypto'
  | 'stocks'
  | 'fii'
  | 'cdb'
  | 'lci'
  | 'lca'
  | 'lcilca'
  | 'treasury'
  | 'savings'
  | 'debentures'
  | 'cricra'
  | 'fixedincomefund'
  | 'cash'
  | 'realestate'
  | 'gold'
  | 'usastocks'
  | 'reits'
  | 'other';

export type FixedIncomeType = 'pos' | 'pre' | 'ipca' | 'cdi';

export type TransactionType = 'buy' | 'sell';

export type RealEstateType = 'house' | 'apartment' | 'land' | 'lot' | 'commercial';

export interface Transaction {
  id: string;
  investmentId: string;
  investmentName: string;
  ticker?: string;
  category: InvestmentCategory;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  profitLoss?: number;
  profitLossPercent?: number;
  date: Date;
  createdAt: Date;
}

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
  purchaseDate?: string;
  maturityDate?: string;
  fixedIncomeType?: FixedIncomeType;
  interestRate?: number;
  dividends?: number;
  // Real Estate specific fields
  realEstateType?: RealEstateType;
  address?: string;
  areaM2?: number;
  city?: string;
  state?: string;
  // Gold specific fields
  weightGrams?: number;
  purity?: number; // karats or percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceHistory {
  date: string;
  value: number;
}

export const categoryLabels: Record<InvestmentCategory, string> = {
  crypto: 'Criptomoedas',
  stocks: 'Ações',
  fii: 'Fundos Imobiliários',
  cdb: 'CDB',
  lci: 'LCI',
  lca: 'LCA',
  lcilca: 'LCI/LCA',
  treasury: 'Tesouro Direto',
  savings: 'Poupança',
  debentures: 'Debêntures',
  cricra: 'CRI/CRA',
  fixedincomefund: 'Fundo de Renda Fixa',
  cash: 'Dinheiro em Espécie',
  realestate: 'Imóveis',
  gold: 'Ouro',
  usastocks: 'Ações Americanas',
  reits: 'REITs',
  other: 'Outros',
};

export const categoryColors: Record<InvestmentCategory, string> = {
  crypto: 'hsl(45, 100%, 50%)',
  stocks: 'hsl(200, 100%, 50%)',
  fii: 'hsl(280, 100%, 60%)',
  cdb: 'hsl(140, 100%, 50%)',
  lci: 'hsl(160, 80%, 45%)',
  lca: 'hsl(100, 70%, 45%)',
  lcilca: 'hsl(160, 80%, 45%)',
  treasury: 'hsl(30, 100%, 50%)',
  savings: 'hsl(180, 100%, 40%)',
  debentures: 'hsl(260, 70%, 55%)',
  cricra: 'hsl(320, 70%, 50%)',
  fixedincomefund: 'hsl(200, 70%, 50%)',
  cash: 'hsl(120, 70%, 45%)',
  realestate: 'hsl(220, 70%, 50%)',
  gold: 'hsl(50, 100%, 45%)',
  usastocks: 'hsl(210, 100%, 45%)',
  reits: 'hsl(250, 80%, 55%)',
  other: 'hsl(0, 0%, 50%)',
};

export const fixedIncomeLabels: Record<FixedIncomeType, string> = {
  pos: 'Pós-fixado',
  pre: 'Pré-fixado',
  ipca: 'IPCA+',
  cdi: 'CDI',
};

export const realEstateLabels: Record<RealEstateType, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  lot: 'Lote',
  commercial: 'Comercial',
};

export const transactionLabels: Record<TransactionType, string> = {
  buy: 'Compra',
  sell: 'Venda',
};
