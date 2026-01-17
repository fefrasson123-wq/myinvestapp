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
  { ticker: 'BRAX11', name: 'iShares IBrX-100', price: 105.30, change: 0.85, changePercent: 0.81, etfType: 'etf_acoes_brasil' },
  { ticker: 'BOVX11', name: 'Trend Ibovespa', price: 118.40, change: 1.15, changePercent: 0.98, etfType: 'etf_acoes_brasil' },
  { ticker: 'IBOB11', name: 'BTG Ibovespa B3', price: 102.80, change: 0.95, changePercent: 0.93, etfType: 'etf_acoes_brasil' },

  // ETF de Ações Exterior
  { ticker: 'IVVB11', name: 'iShares S&P 500', price: 285.40, change: 2.15, changePercent: 0.76, etfType: 'etf_acoes_exterior' },
  { ticker: 'SPXI11', name: 'It Now S&P 500', price: 268.90, change: 1.98, changePercent: 0.74, etfType: 'etf_acoes_exterior' },
  { ticker: 'NASD11', name: 'Trend ETF Nasdaq', price: 45.80, change: 0.65, changePercent: 1.44, etfType: 'etf_acoes_exterior' },
  { ticker: 'EURP11', name: 'Trend ETF MSCI Europa', price: 38.25, change: 0.22, changePercent: 0.58, etfType: 'etf_acoes_exterior' },
  { ticker: 'ACWI11', name: 'Trend ETF MSCI ACWI', price: 52.60, change: 0.35, changePercent: 0.67, etfType: 'etf_acoes_exterior' },
  { ticker: 'XINA11', name: 'Trend ETF MSCI China', price: 8.45, change: -0.12, changePercent: -1.40, etfType: 'etf_acoes_exterior' },
  { ticker: 'ASIA11', name: 'Trend ETF MSCI Ásia', price: 6.80, change: 0.05, changePercent: 0.74, etfType: 'etf_acoes_exterior' },
  { ticker: 'EMEG11', name: 'Trend ETF Emergentes', price: 7.25, change: -0.08, changePercent: -1.09, etfType: 'etf_acoes_exterior' },
  { ticker: 'SPXB11', name: 'BTG S&P 500', price: 125.60, change: 0.92, changePercent: 0.74, etfType: 'etf_acoes_exterior' },
  { ticker: 'WRLD11', name: 'Trend Global Equities', price: 48.30, change: 0.28, changePercent: 0.58, etfType: 'etf_acoes_exterior' },
  { ticker: 'USTK11', name: 'Trend NYSE FANG+', price: 32.45, change: 0.55, changePercent: 1.72, etfType: 'etf_acoes_exterior' },
  { ticker: 'JAPA11', name: 'Trend Japão MSCI', price: 9.85, change: 0.08, changePercent: 0.82, etfType: 'etf_acoes_exterior' },
  { ticker: 'BNDX11', name: 'Nu International Bonds', price: 95.20, change: 0.15, changePercent: 0.16, etfType: 'etf_acoes_exterior' },

  // ETF de Renda Fixa
  { ticker: 'IMAB11', name: 'It Now IMA-B', price: 82.45, change: 0.18, changePercent: 0.22, etfType: 'etf_renda_fixa' },
  { ticker: 'IRFM11', name: 'It Now IRF-M P2', price: 68.30, change: 0.12, changePercent: 0.18, etfType: 'etf_renda_fixa' },
  { ticker: 'FIXA11', name: 'Mirae Asset Renda Fixa', price: 9.85, change: 0.02, changePercent: 0.20, etfType: 'etf_renda_fixa' },
  { ticker: 'B5P211', name: 'It Now IMA-B5 P2', price: 118.60, change: 0.25, changePercent: 0.21, etfType: 'etf_renda_fixa' },
  { ticker: 'IB5M11', name: 'It Now IMA-B5+', price: 95.20, change: 0.22, changePercent: 0.23, etfType: 'etf_renda_fixa' },
  { ticker: 'IMBB11', name: 'Bradesco IMA-B', price: 75.40, change: 0.15, changePercent: 0.20, etfType: 'etf_renda_fixa' },
  { ticker: 'NTNS11', name: 'Trend Tesouro Selic', price: 105.80, change: 0.08, changePercent: 0.08, etfType: 'etf_renda_fixa' },
  { ticker: 'LFTS11', name: 'Investo Selic', price: 112.40, change: 0.09, changePercent: 0.08, etfType: 'etf_renda_fixa' },
  { ticker: 'PACB11', name: 'BTG Títulos Públicos', price: 88.60, change: 0.12, changePercent: 0.14, etfType: 'etf_renda_fixa' },
  { ticker: 'KDIF11', name: 'Kinea Infra RF', price: 102.30, change: 0.18, changePercent: 0.18, etfType: 'etf_renda_fixa' },

  // ETF de Índice / Setoriais
  { ticker: 'FIND11', name: 'It Now IFNC', price: 85.60, change: 0.72, changePercent: 0.85, etfType: 'etf_indice' },
  { ticker: 'MATB11', name: 'It Now IMAT', price: 48.25, change: 0.38, changePercent: 0.79, etfType: 'etf_indice' },
  { ticker: 'ISUS11', name: 'It Now ISE', price: 32.80, change: 0.15, changePercent: 0.46, etfType: 'etf_indice' },
  { ticker: 'ECOO11', name: 'It Now ICO2', price: 95.40, change: 0.55, changePercent: 0.58, etfType: 'etf_indice' },
  { ticker: 'UTIL11', name: 'It Now UTIL', price: 78.90, change: 0.42, changePercent: 0.54, etfType: 'etf_indice' },
  { ticker: 'TECK11', name: 'It Now Tech Brasil', price: 28.45, change: 0.35, changePercent: 1.25, etfType: 'etf_indice' },
  { ticker: 'SHOT11', name: 'It Now MLCX', price: 55.20, change: 0.48, changePercent: 0.88, etfType: 'etf_indice' },
  { ticker: 'AGRI11', name: 'Trend Agronegócio', price: 42.80, change: 0.25, changePercent: 0.59, etfType: 'etf_indice' },
  { ticker: 'OGIN11', name: 'Trend Energia Limpa', price: 35.60, change: 0.18, changePercent: 0.51, etfType: 'etf_indice' },
  { ticker: 'GOLD11', name: 'Trend Ouro', price: 15.45, change: 0.22, changePercent: 1.44, etfType: 'etf_indice' },
  { ticker: 'CORN11', name: 'It Now Milho', price: 12.85, change: 0.15, changePercent: 1.18, etfType: 'etf_indice' },
  { ticker: 'SOJA11', name: 'It Now Soja', price: 10.20, change: 0.08, changePercent: 0.79, etfType: 'etf_indice' },
  { ticker: 'BOVA39', name: 'Ibovespa CDI', price: 98.50, change: 0.65, changePercent: 0.66, etfType: 'etf_indice' },
  { ticker: 'PETR11', name: 'It Now Petróleo', price: 18.90, change: 0.35, changePercent: 1.89, etfType: 'etf_indice' },
  { ticker: 'CMDB11', name: 'Trend Commodities', price: 22.45, change: 0.28, changePercent: 1.26, etfType: 'etf_indice' },
  { ticker: 'BDOM11', name: 'BTG Consumo', price: 68.40, change: 0.42, changePercent: 0.62, etfType: 'etf_indice' },
  { ticker: 'SAET11', name: 'Trend Saúde', price: 45.80, change: 0.32, changePercent: 0.70, etfType: 'etf_indice' },
  { ticker: 'IMOB11', name: 'It Now IMOB', price: 52.30, change: 0.28, changePercent: 0.54, etfType: 'etf_indice' },
  { ticker: 'ALUG11', name: 'Investo Aluguéis', price: 38.60, change: 0.15, changePercent: 0.39, etfType: 'etf_indice' },

  // ETF de Criptomoedas
  { ticker: 'HASH11', name: 'Hashdex Nasdaq Crypto', price: 28.50, change: 1.85, changePercent: 6.94, etfType: 'etf_cripto' },
  { ticker: 'QBTC11', name: 'QR Bitcoin', price: 12.80, change: 0.95, changePercent: 8.02, etfType: 'etf_cripto' },
  { ticker: 'BITH11', name: 'Hashdex Bitcoin', price: 45.60, change: 3.20, changePercent: 7.55, etfType: 'etf_cripto' },
  { ticker: 'ETHE11', name: 'Hashdex Ethereum', price: 18.90, change: 1.45, changePercent: 8.31, etfType: 'etf_cripto' },
  { ticker: 'QETH11', name: 'QR Ethereum', price: 8.25, change: 0.62, changePercent: 8.13, etfType: 'etf_cripto' },
  { ticker: 'DEFI11', name: 'Hashdex DeFi', price: 22.40, change: 1.65, changePercent: 7.95, etfType: 'etf_cripto' },
  { ticker: 'WEB311', name: 'Hashdex Web3', price: 15.80, change: 1.12, changePercent: 7.63, etfType: 'etf_cripto' },
  { ticker: 'META11', name: 'Hashdex Metaverse', price: 6.45, change: 0.48, changePercent: 8.04, etfType: 'etf_cripto' },
  { ticker: 'BITI11', name: 'It Now Bitcoin', price: 38.90, change: 2.85, changePercent: 7.90, etfType: 'etf_cripto' },
  { ticker: 'QDFI11', name: 'QR DeFi', price: 5.80, change: 0.42, changePercent: 7.80, etfType: 'etf_cripto' },
  { ticker: 'NFTS11', name: 'Investo NFT', price: 4.25, change: 0.35, changePercent: 8.98, etfType: 'etf_cripto' },
  { ticker: 'BLOK11', name: 'Investo Blockchain', price: 8.60, change: 0.58, changePercent: 7.23, etfType: 'etf_cripto' },
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
