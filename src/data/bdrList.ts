export interface BDRAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'etf';
  underlyingTicker: string;
}

// BDRs disponíveis no Yahoo Finance (B3) - Atualizado Fev/2026
export const bdrList: BDRAsset[] = [
  // Big Tech
  { ticker: 'AAPL34', name: 'Apple Inc', price: 48.25, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AAPL' },
  { ticker: 'MSFT34', name: 'Microsoft Corp', price: 52.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MSFT' },
  { ticker: 'GOGL34', name: 'Alphabet Inc (Google)', price: 35.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'GOOGL' },
  { ticker: 'AMZO34', name: 'Amazon.com Inc', price: 42.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AMZN' },
  { ticker: 'META34', name: 'Meta Platforms Inc', price: 62.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'META' },
  { ticker: 'NVDC34', name: 'NVIDIA Corp', price: 28.95, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NVDA' },
  { ticker: 'TSLA34', name: 'Tesla Inc', price: 58.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TSLA' },
  { ticker: 'AVGO34', name: 'Broadcom Inc', price: 85.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AVGO' },
  { ticker: 'ORCL34', name: 'Oracle Corp', price: 42.75, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ORCL' },

  // Semicondutores
  { ticker: 'AMD34', name: 'AMD Inc', price: 32.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AMD' },
  { ticker: 'INTC34', name: 'Intel Corp', price: 8.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'INTC' },
  { ticker: 'QCOM34', name: 'Qualcomm Inc', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'QCOM' },
  { ticker: 'TXRX34', name: 'Texas Instruments', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TXN' },
  { ticker: 'TSMC34', name: 'Taiwan Semiconductor', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TSM' },

  // Software & Cloud
  { ticker: 'ADBE34', name: 'Adobe Inc', price: 85.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ADBE' },
  { ticker: 'CSCO34', name: 'Cisco Systems', price: 22.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CSCO' },
  { ticker: 'CRWD34', name: 'CrowdStrike Holdings', price: 55.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CRWD' },
  { ticker: 'SNOW34', name: 'Snowflake Inc', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SNOW' },
  { ticker: 'S2QU34', name: 'Block Inc', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SQ' },
  { ticker: 'C1RM34', name: 'Salesforce Inc', price: 48.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CRM' },
  { ticker: 'U2BE34', name: 'Uber Technologies', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'UBER' },
  { ticker: 'A1BN34', name: 'Airbnb Inc', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ABNB' },
  { ticker: 'S1PO34', name: 'Spotify Technology', price: 62.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SPOT' },
  { ticker: 'P2LT34', name: 'Palantir Technologies', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PLTR' },

  // Financeiro
  { ticker: 'JPMC34', name: 'JPMorgan Chase', price: 32.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'JPM' },
  { ticker: 'BOAC34', name: 'Bank of America', price: 18.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BAC' },
  { ticker: 'GSGI34', name: 'Goldman Sachs', price: 68.25, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'GS' },
  { ticker: 'VISA34', name: 'Visa Inc', price: 42.75, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'V' },
  { ticker: 'MAST34', name: 'Mastercard Inc', price: 65.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MA' },
  { ticker: 'BERK34', name: 'Berkshire Hathaway', price: 85.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BRK-B' },
  { ticker: 'MSBR34', name: 'Morgan Stanley', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MS' },
  { ticker: 'WFCO34', name: 'Wells Fargo', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'WFC' },
  { ticker: 'CTGP34', name: 'Citigroup', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'C' },
  { ticker: 'AXPB34', name: 'American Express', price: 52.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AXP' },
  { ticker: 'BLAK34', name: 'BlackRock Inc', price: 165.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BLK' },
  { ticker: 'PYPL34', name: 'PayPal Holdings', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PYPL' },
  { ticker: 'C2OI34', name: 'Coinbase Global', price: 52.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'COIN' },

  // Consumo
  { ticker: 'COCA34', name: 'Coca-Cola Co', price: 28.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'KO' },
  { ticker: 'PEPB34', name: 'PepsiCo Inc', price: 42.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PEP' },
  { ticker: 'MCDC34', name: 'McDonald\'s Corp', price: 58.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MCD' },
  { ticker: 'NFLX34', name: 'Netflix Inc', price: 125.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NFLX' },
  { ticker: 'DISB34', name: 'Walt Disney Co', price: 32.25, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DIS' },
  { ticker: 'NIKE34', name: 'Nike Inc', price: 28.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NKE' },
  { ticker: 'SBUB34', name: 'Starbucks Corp', price: 32.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SBUX' },
  { ticker: 'WALM34', name: 'Walmart Inc', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'WMT' },
  { ticker: 'COWC34', name: 'Costco Wholesale', price: 165.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'COST' },
  { ticker: 'HOME34', name: 'Home Depot', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'HD' },
  { ticker: 'PGCO34', name: 'Procter & Gamble', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PG' },
  { ticker: 'CMGB34', name: 'Chipotle Mexican Grill', price: 125.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CMG' },
  { ticker: 'M1DL34', name: 'Mondelez International', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MDLZ' },
  { ticker: 'L1UL34', name: 'Lululemon Athletica', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LULU' },

  // Saúde
  { ticker: 'JNJB34', name: 'Johnson & Johnson', price: 48.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'JNJ' },
  { ticker: 'PFIZ34', name: 'Pfizer Inc', price: 12.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PFE' },
  { ticker: 'MRCK34', name: 'Merck & Co', price: 42.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MRK' },
  { ticker: 'ABBV34', name: 'AbbVie Inc', price: 55.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ABBV' },
  { ticker: 'LILY34', name: 'Eli Lilly', price: 185.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LLY' },
  { ticker: 'UNHH34', name: 'UnitedHealth Group', price: 125.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'UNH' },
  { ticker: 'ABTT34', name: 'Abbott Laboratories', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ABT' },
  { ticker: 'AMGN34', name: 'Amgen Inc', price: 68.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AMGN' },
  { ticker: 'M1RN34', name: 'Moderna Inc', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MRNA' },

  // Industrial & Defesa
  { ticker: 'CATP34', name: 'Caterpillar Inc', price: 72.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CAT' },
  { ticker: 'DEEC34', name: 'Deere & Co', price: 95.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DE' },
  { ticker: 'HONB34', name: 'Honeywell Intl', price: 48.25, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'HON' },
  { ticker: 'BOEN34', name: 'Boeing Company', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BA' },
  { ticker: 'LMTB34', name: 'Lockheed Martin', price: 115.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LMT' },
  { ticker: 'GEOO34', name: 'GE Aerospace', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'GE' },
  { ticker: 'UPSS34', name: 'United Parcel Service', price: 35.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'UPS' },
  { ticker: 'FDXB34', name: 'FedEx Corporation', price: 58.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'FDX' },
  { ticker: 'MMMC34', name: '3M Company', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MMM' },

  // Energia
  { ticker: 'EXXO34', name: 'Exxon Mobil Corp', price: 38.45, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'XOM' },
  { ticker: 'CHVX34', name: 'Chevron Corp', price: 52.85, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CVX' },
  { ticker: 'COPH34', name: 'ConocoPhillips', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'COP' },

  // Telecom
  { ticker: 'ATTB34', name: 'AT&T Inc', price: 5.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'T' },
  { ticker: 'VERZ34', name: 'Verizon Communications', price: 10.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'VZ' },
  { ticker: 'T1MU34', name: 'T-Mobile US', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TMUS' },

  // Automotivo
  { ticker: 'GMCO34', name: 'General Motors', price: 10.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'GM' },
  { ticker: 'FDMO34', name: 'Ford Motor', price: 3.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'F' },
  { ticker: 'TOYB34', name: 'Toyota Motor', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TM' },

  // Outros
  { ticker: 'ACNB34', name: 'Accenture plc', price: 72.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ACN' },
  { ticker: 'IBMB34', name: 'IBM Corporation', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'IBM' },
  { ticker: 'MELI34', name: 'MercadoLibre Inc', price: 385.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MELI' },
  { ticker: 'BABA34', name: 'Alibaba Group', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BABA' },
  { ticker: 'N1EE34', name: 'NextEra Energy', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NEE' },

  // BDRs de ETFs
  { ticker: 'BIVB39', name: 'iShares Core S&P 500', price: 52.45, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'IVV' },
  { ticker: 'BQQQ39', name: 'Invesco QQQ Trust', price: 68.85, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'QQQ' },
  { ticker: 'BSPY39', name: 'SPDR S&P 500 ETF', price: 48.25, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'SPY' },
  { ticker: 'BVOO39', name: 'Vanguard S&P 500', price: 55.45, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'VOO' },
  { ticker: 'BVTI39', name: 'Vanguard Total Stock', price: 42.85, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'VTI' },
  { ticker: 'BDIA39', name: 'SPDR Dow Jones', price: 38.75, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'DIA' },
  { ticker: 'BIWM39', name: 'iShares Russell 2000', price: 28.45, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'IWM' },
  { ticker: 'BVEA39', name: 'Vanguard FTSE Emerging', price: 18.25, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'VWO' },
  { ticker: 'BEFA39', name: 'iShares MSCI EAFE', price: 25.45, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'EFA' },
  { ticker: 'BXLE39', name: 'Energy Select SPDR', price: 32.85, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLE' },
  { ticker: 'BXLF39', name: 'Financial Select SPDR', price: 28.45, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLF' },
  { ticker: 'BXLK39', name: 'Technology Select SPDR', price: 42.85, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLK' },
  { ticker: 'BARX39', name: 'iShares U.S. Real Estate', price: 35.45, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'IYR' },
  { ticker: 'BGLD39', name: 'SPDR Gold Shares', price: 48.25, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'GLD' },
  { ticker: 'BSLV39', name: 'iShares Silver Trust', price: 12.85, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'SLV' },
  { ticker: 'BACW39', name: 'iShares MSCI ACWI', price: 22.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'ACWI' },
  { ticker: 'BVNQ39', name: 'Vanguard Real Estate', price: 18.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'VNQ' },
  { ticker: 'BAGG39', name: 'iShares Core US Aggregate Bond', price: 25.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'AGG' },
  { ticker: 'BTLT39', name: 'iShares 20+ Year Treasury', price: 22.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'TLT' },
  { ticker: 'BXLV39', name: 'Health Care Select SPDR', price: 32.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLV' },
  { ticker: 'BXLI39', name: 'Industrial Select SPDR', price: 28.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLI' },
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
