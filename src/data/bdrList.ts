export interface BDRAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'etf';
  underlyingTicker: string; // Ticker do ativo original (ex: AAPL, MSFT)
}

// Lista de BDRs populares negociados na B3 (Dezembro 2025)
export const bdrList: BDRAsset[] = [
  // BDRs de Ações - Big Tech
  { ticker: 'AAPL34', name: 'Apple Inc', price: 48.25, change: 0.85, changePercent: 1.79, type: 'stock', underlyingTicker: 'AAPL' },
  { ticker: 'MSFT34', name: 'Microsoft Corp', price: 52.85, change: 0.95, changePercent: 1.83, type: 'stock', underlyingTicker: 'MSFT' },
  { ticker: 'GOGL34', name: 'Alphabet Inc (Google)', price: 35.45, change: 0.65, changePercent: 1.87, type: 'stock', underlyingTicker: 'GOOGL' },
  { ticker: 'AMZO34', name: 'Amazon.com Inc', price: 42.85, change: 0.72, changePercent: 1.71, type: 'stock', underlyingTicker: 'AMZN' },
  { ticker: 'META34', name: 'Meta Platforms Inc', price: 62.45, change: 1.25, changePercent: 2.04, type: 'stock', underlyingTicker: 'META' },
  { ticker: 'NVDC34', name: 'NVIDIA Corp', price: 28.95, change: 0.85, changePercent: 3.02, type: 'stock', underlyingTicker: 'NVDA' },
  { ticker: 'TSLA34', name: 'Tesla Inc', price: 58.45, change: 1.45, changePercent: 2.54, type: 'stock', underlyingTicker: 'TSLA' },
  
  // BDRs de Ações - Financeiro
  { ticker: 'JPMC34', name: 'JPMorgan Chase', price: 32.85, change: 0.45, changePercent: 1.39, type: 'stock', underlyingTicker: 'JPM' },
  { ticker: 'BOAC34', name: 'Bank of America', price: 18.45, change: 0.28, changePercent: 1.54, type: 'stock', underlyingTicker: 'BAC' },
  { ticker: 'GSGI34', name: 'Goldman Sachs', price: 68.25, change: 0.95, changePercent: 1.41, type: 'stock', underlyingTicker: 'GS' },
  { ticker: 'VISA34', name: 'Visa Inc', price: 42.75, change: 0.55, changePercent: 1.30, type: 'stock', underlyingTicker: 'V' },
  { ticker: 'MAST34', name: 'Mastercard Inc', price: 65.85, change: 0.85, changePercent: 1.31, type: 'stock', underlyingTicker: 'MA' },
  
  // BDRs de Ações - Consumo
  { ticker: 'COCA34', name: 'Coca-Cola Co', price: 28.45, change: 0.22, changePercent: 0.78, type: 'stock', underlyingTicker: 'KO' },
  { ticker: 'PEPB34', name: 'PepsiCo Inc', price: 42.85, change: 0.35, changePercent: 0.82, type: 'stock', underlyingTicker: 'PEP' },
  { ticker: 'MCDC34', name: 'McDonald\'s Corp', price: 58.45, change: 0.42, changePercent: 0.72, type: 'stock', underlyingTicker: 'MCD' },
  { ticker: 'NFLX34', name: 'Netflix Inc', price: 125.45, change: 2.85, changePercent: 2.32, type: 'stock', underlyingTicker: 'NFLX' },
  { ticker: 'DISB34', name: 'Walt Disney Co', price: 32.25, change: 0.45, changePercent: 1.41, type: 'stock', underlyingTicker: 'DIS' },
  
  // BDRs de Ações - Saúde
  { ticker: 'JNJB34', name: 'Johnson & Johnson', price: 48.85, change: 0.35, changePercent: 0.72, type: 'stock', underlyingTicker: 'JNJ' },
  { ticker: 'PFIZ34', name: 'Pfizer Inc', price: 12.45, change: 0.15, changePercent: 1.22, type: 'stock', underlyingTicker: 'PFE' },
  { ticker: 'MRCK34', name: 'Merck & Co', price: 42.85, change: 0.52, changePercent: 1.23, type: 'stock', underlyingTicker: 'MRK' },
  { ticker: 'ABBV34', name: 'AbbVie Inc', price: 55.45, change: 0.65, changePercent: 1.19, type: 'stock', underlyingTicker: 'ABBV' },
  
  // BDRs de Ações - Industrial
  { ticker: 'BERK34', name: 'Berkshire Hathaway', price: 85.45, change: 0.72, changePercent: 0.85, type: 'stock', underlyingTicker: 'BRK-B' },
  { ticker: 'CATP34', name: 'Caterpillar Inc', price: 72.85, change: 0.95, changePercent: 1.32, type: 'stock', underlyingTicker: 'CAT' },
  { ticker: 'DEEC34', name: 'Deere & Co', price: 95.45, change: 1.15, changePercent: 1.22, type: 'stock', underlyingTicker: 'DE' },
  { ticker: 'HONB34', name: 'Honeywell Intl', price: 48.25, change: 0.55, changePercent: 1.15, type: 'stock', underlyingTicker: 'HON' },
  
  // BDRs de Ações - Energia
  { ticker: 'EXXO34', name: 'Exxon Mobil Corp', price: 38.45, change: 0.48, changePercent: 1.26, type: 'stock', underlyingTicker: 'XOM' },
  { ticker: 'CHVX34', name: 'Chevron Corp', price: 52.85, change: 0.62, changePercent: 1.19, type: 'stock', underlyingTicker: 'CVX' },
  
  // BDRs de Ações - Outros
  { ticker: 'NIKE34', name: 'Nike Inc', price: 28.45, change: 0.35, changePercent: 1.25, type: 'stock', underlyingTicker: 'NKE' },
  { ticker: 'SBUB34', name: 'Starbucks Corp', price: 32.85, change: 0.42, changePercent: 1.29, type: 'stock', underlyingTicker: 'SBUX' },
  { ticker: 'ADBE34', name: 'Adobe Inc', price: 85.45, change: 1.25, changePercent: 1.48, type: 'stock', underlyingTicker: 'ADBE' },
  { ticker: 'ORCL34', name: 'Oracle Corp', price: 42.75, change: 0.65, changePercent: 1.54, type: 'stock', underlyingTicker: 'ORCL' },
  { ticker: 'CSCO34', name: 'Cisco Systems', price: 22.45, change: 0.28, changePercent: 1.26, type: 'stock', underlyingTicker: 'CSCO' },
  { ticker: 'INTC34', name: 'Intel Corp', price: 8.85, change: 0.12, changePercent: 1.37, type: 'stock', underlyingTicker: 'INTC' },
  { ticker: 'AMD34', name: 'AMD Inc', price: 32.45, change: 0.85, changePercent: 2.69, type: 'stock', underlyingTicker: 'AMD' },
  
  // BDRs de ETFs
  { ticker: 'BIVB39', name: 'iShares Core S&P 500', price: 52.45, change: 0.45, changePercent: 0.87, type: 'etf', underlyingTicker: 'IVV' },
  { ticker: 'BQQQ39', name: 'Invesco QQQ Trust', price: 68.85, change: 0.95, changePercent: 1.40, type: 'etf', underlyingTicker: 'QQQ' },
  { ticker: 'BSPY39', name: 'SPDR S&P 500 ETF', price: 48.25, change: 0.42, changePercent: 0.88, type: 'etf', underlyingTicker: 'SPY' },
  { ticker: 'BVOO39', name: 'Vanguard S&P 500', price: 55.45, change: 0.48, changePercent: 0.87, type: 'etf', underlyingTicker: 'VOO' },
  { ticker: 'BVTI39', name: 'Vanguard Total Stock', price: 42.85, change: 0.35, changePercent: 0.82, type: 'etf', underlyingTicker: 'VTI' },
  { ticker: 'BDIA39', name: 'SPDR Dow Jones', price: 38.75, change: 0.32, changePercent: 0.83, type: 'etf', underlyingTicker: 'DIA' },
  { ticker: 'BIWM39', name: 'iShares Russell 2000', price: 28.45, change: 0.35, changePercent: 1.25, type: 'etf', underlyingTicker: 'IWM' },
  { ticker: 'BVEA39', name: 'Vanguard FTSE Emerging', price: 18.25, change: 0.22, changePercent: 1.22, type: 'etf', underlyingTicker: 'VWO' },
  { ticker: 'BEFA39', name: 'iShares MSCI EAFE', price: 25.45, change: 0.28, changePercent: 1.11, type: 'etf', underlyingTicker: 'EFA' },
  { ticker: 'BXLE39', name: 'Energy Select SPDR', price: 32.85, change: 0.42, changePercent: 1.29, type: 'etf', underlyingTicker: 'XLE' },
  { ticker: 'BXLF39', name: 'Financial Select SPDR', price: 28.45, change: 0.35, changePercent: 1.25, type: 'etf', underlyingTicker: 'XLF' },
  { ticker: 'BXLK39', name: 'Technology Select SPDR', price: 42.85, change: 0.65, changePercent: 1.54, type: 'etf', underlyingTicker: 'XLK' },
  { ticker: 'BARX39', name: 'iShares U.S. Real Estate', price: 35.45, change: 0.42, changePercent: 1.20, type: 'etf', underlyingTicker: 'IYR' },
  { ticker: 'BGLD39', name: 'SPDR Gold Shares', price: 48.25, change: 0.55, changePercent: 1.15, type: 'etf', underlyingTicker: 'GLD' },
  { ticker: 'BSLV39', name: 'iShares Silver Trust', price: 12.85, change: 0.18, changePercent: 1.42, type: 'etf', underlyingTicker: 'SLV' },
];

export function searchBDRs(query: string): BDRAsset[] {
  const q = query.toLowerCase();
  return bdrList.filter(
    b => b.ticker.toLowerCase().includes(q) || 
         b.name.toLowerCase().includes(q) ||
         b.underlyingTicker.toLowerCase().includes(q)
  );
}

export function searchBDRsByType(query: string, type: 'stock' | 'etf'): BDRAsset[] {
  const q = query.toLowerCase();
  return bdrList.filter(
    b => b.type === type && (
      b.ticker.toLowerCase().includes(q) || 
      b.name.toLowerCase().includes(q) ||
      b.underlyingTicker.toLowerCase().includes(q)
    )
  );
}

export function getBDRByTicker(ticker: string): BDRAsset | undefined {
  return bdrList.find(b => b.ticker.toLowerCase() === ticker.toLowerCase());
}
