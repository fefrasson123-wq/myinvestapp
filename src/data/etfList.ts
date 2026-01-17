import { ETFType } from '@/types/investment';

export interface ETFAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  etfType: ETFType;
}

// Lista de ETFs brasileiros
export const etfList: ETFAsset[] = [
  // ETF de Ações Brasil
  { ticker: 'BOVA11', name: 'iShares Ibovespa', price: 128.50, change: 1.25, changePercent: 0.98, etfType: 'etf_acoes_brasil' },
  { ticker: 'PIBB11', name: 'It Now PIBB IBrX-50', price: 185.20, change: -0.80, changePercent: -0.43, etfType: 'etf_acoes_brasil' },
  { ticker: 'BBSD11', name: 'BB ETF S&P Dividendos', price: 78.30, change: 0.45, changePercent: 0.58, etfType: 'etf_acoes_brasil' },
  { ticker: 'DIVO11', name: 'It Now IDIV', price: 65.80, change: 0.32, changePercent: 0.49, etfType: 'etf_acoes_brasil' },
  { ticker: 'SMAL11', name: 'iShares Small Cap', price: 98.40, change: -0.55, changePercent: -0.56, etfType: 'etf_acoes_brasil' },
  { ticker: 'BOVV11', name: 'It Now Ibovespa', price: 112.60, change: 1.10, changePercent: 0.99, etfType: 'etf_acoes_brasil' },
  { ticker: 'BOVB11', name: 'Bradesco Ibovespa', price: 95.20, change: 0.88, changePercent: 0.93, etfType: 'etf_acoes_brasil' },
  { ticker: 'XBOV11', name: 'Caixa Ibovespa', price: 108.75, change: 1.02, changePercent: 0.95, etfType: 'etf_acoes_brasil' },
  { ticker: 'SMAC11', name: 'It Now Small Cap', price: 45.30, change: -0.22, changePercent: -0.48, etfType: 'etf_acoes_brasil' },
  { ticker: 'GOVE11', name: 'It Now IGCT', price: 42.15, change: 0.18, changePercent: 0.43, etfType: 'etf_acoes_brasil' },

  // ETF de Ações Exterior
  { ticker: 'IVVB11', name: 'iShares S&P 500', price: 285.40, change: 2.15, changePercent: 0.76, etfType: 'etf_acoes_exterior' },
  { ticker: 'SPXI11', name: 'It Now S&P 500', price: 268.90, change: 1.98, changePercent: 0.74, etfType: 'etf_acoes_exterior' },
  { ticker: 'NASD11', name: 'Trend ETF Nasdaq', price: 45.80, change: 0.65, changePercent: 1.44, etfType: 'etf_acoes_exterior' },
  { ticker: 'EURP11', name: 'Trend ETF MSCI Europa', price: 38.25, change: 0.22, changePercent: 0.58, etfType: 'etf_acoes_exterior' },
  { ticker: 'ACWI11', name: 'Trend ETF MSCI ACWI', price: 52.60, change: 0.35, changePercent: 0.67, etfType: 'etf_acoes_exterior' },
  { ticker: 'XINA11', name: 'Trend ETF MSCI China', price: 8.45, change: -0.12, changePercent: -1.40, etfType: 'etf_acoes_exterior' },
  { ticker: 'ASIA11', name: 'Trend ETF MSCI Ásia', price: 6.80, change: 0.05, changePercent: 0.74, etfType: 'etf_acoes_exterior' },
  { ticker: 'EMEG11', name: 'Trend ETF Emergentes', price: 7.25, change: -0.08, changePercent: -1.09, etfType: 'etf_acoes_exterior' },

  // ETF de Renda Fixa
  { ticker: 'IMAB11', name: 'It Now IMA-B', price: 82.45, change: 0.18, changePercent: 0.22, etfType: 'etf_renda_fixa' },
  { ticker: 'IRFM11', name: 'It Now IRF-M P2', price: 68.30, change: 0.12, changePercent: 0.18, etfType: 'etf_renda_fixa' },
  { ticker: 'FIXA11', name: 'Mirae Asset Renda Fixa', price: 9.85, change: 0.02, changePercent: 0.20, etfType: 'etf_renda_fixa' },
  { ticker: 'B5P211', name: 'It Now IMA-B5 P2', price: 118.60, change: 0.25, changePercent: 0.21, etfType: 'etf_renda_fixa' },
  { ticker: 'IB5M11', name: 'It Now IMA-B5+', price: 95.20, change: 0.22, changePercent: 0.23, etfType: 'etf_renda_fixa' },
  { ticker: 'IMBB11', name: 'Bradesco IMA-B', price: 75.40, change: 0.15, changePercent: 0.20, etfType: 'etf_renda_fixa' },

  // ETF de Índice
  { ticker: 'FIND11', name: 'It Now IFNC', price: 85.60, change: 0.72, changePercent: 0.85, etfType: 'etf_indice' },
  { ticker: 'MATB11', name: 'It Now IMAT', price: 48.25, change: 0.38, changePercent: 0.79, etfType: 'etf_indice' },
  { ticker: 'ISUS11', name: 'It Now ISE', price: 32.80, change: 0.15, changePercent: 0.46, etfType: 'etf_indice' },
  { ticker: 'ECOO11', name: 'It Now ICO2', price: 95.40, change: 0.55, changePercent: 0.58, etfType: 'etf_indice' },
  { ticker: 'UTIL11', name: 'It Now UTIL', price: 78.90, change: 0.42, changePercent: 0.54, etfType: 'etf_indice' },
  { ticker: 'TECK11', name: 'It Now Tech Brasil', price: 28.45, change: 0.35, changePercent: 1.25, etfType: 'etf_indice' },
  { ticker: 'SHOT11', name: 'It Now MLCX', price: 55.20, change: 0.48, changePercent: 0.88, etfType: 'etf_indice' },

  // ETF de Criptomoedas
  { ticker: 'HASH11', name: 'Hashdex Nasdaq Crypto', price: 28.50, change: 1.85, changePercent: 6.94, etfType: 'etf_cripto' },
  { ticker: 'QBTC11', name: 'QR Bitcoin', price: 12.80, change: 0.95, changePercent: 8.02, etfType: 'etf_cripto' },
  { ticker: 'BITH11', name: 'Hashdex Bitcoin', price: 45.60, change: 3.20, changePercent: 7.55, etfType: 'etf_cripto' },
  { ticker: 'ETHE11', name: 'Hashdex Ethereum', price: 18.90, change: 1.45, changePercent: 8.31, etfType: 'etf_cripto' },
  { ticker: 'QETH11', name: 'QR Ethereum', price: 8.25, change: 0.62, changePercent: 8.13, etfType: 'etf_cripto' },
  { ticker: 'DEFI11', name: 'Hashdex DeFi', price: 22.40, change: 1.65, changePercent: 7.95, etfType: 'etf_cripto' },
  { ticker: 'WEB311', name: 'Hashdex Web3', price: 15.80, change: 1.12, changePercent: 7.63, etfType: 'etf_cripto' },
  { ticker: 'META11', name: 'Hashdex Metaverse', price: 6.45, change: 0.48, changePercent: 8.04, etfType: 'etf_cripto' },
];

export const getETFByTicker = (ticker: string): ETFAsset | undefined => {
  return etfList.find(e => e.ticker.toUpperCase() === ticker.toUpperCase());
};

export const searchETFs = (query: string, etfType?: ETFType): ETFAsset[] => {
  const normalizedQuery = query.toLowerCase();
  return etfList.filter(e => {
    const matchesQuery = e.ticker.toLowerCase().includes(normalizedQuery) || 
                         e.name.toLowerCase().includes(normalizedQuery);
    const matchesType = etfType ? e.etfType === etfType : true;
    return matchesQuery && matchesType;
  });
};

export const getETFsByType = (etfType: ETFType): ETFAsset[] => {
  return etfList.filter(e => e.etfType === etfType);
};
