export interface BDRAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'etf';
  underlyingTicker: string;
}

// BDRs disponíveis no Yahoo Finance (B3) - Atualizado Mar/2026
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

  // Expansão Mar/2026 - Mais BDRs de ações
  { ticker: 'ARMT34', name: 'Arm Holdings', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ARM' },
  { ticker: 'M1TA34', name: 'Micron Technology', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MU' },
  { ticker: 'A1DI34', name: 'Analog Devices', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ADI' },
  { ticker: 'K1LA34', name: 'KLA Corporation', price: 125.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'KLAC' },
  { ticker: 'LRCX34', name: 'Lam Research', price: 135.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LRCX' },
  { ticker: 'A1PL34', name: 'Applied Materials', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AMAT' },
  { ticker: 'MRVL34', name: 'Marvell Technology', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MRVL' },
  { ticker: 'S1NP34', name: 'Synopsys Inc', price: 95.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SNPS' },
  { ticker: 'C1DN34', name: 'Cadence Design', price: 52.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CDNS' },
  { ticker: 'PANR34', name: 'Palo Alto Networks', price: 62.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PANW' },
  { ticker: 'D1AT34', name: 'Datadog Inc', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DDOG' },
  { ticker: 'Z1SC34', name: 'Zscaler Inc', price: 35.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ZS' },
  { ticker: 'F1TV34', name: 'Fortinet Inc', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'FTNT' },
  { ticker: 'S2HP34', name: 'Shopify Inc', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SHOP' },
  { ticker: 'TWLO34', name: 'Twilio Inc', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TWLO' },
  { ticker: 'OKTA34', name: 'Okta Inc', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'OKTA' },
  { ticker: 'WDAY34', name: 'Workday Inc', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'WDAY' },
  { ticker: 'S1ER34', name: 'ServiceNow Inc', price: 125.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NOW' },
  { ticker: 'I1NT34', name: 'Intuit Inc', price: 105.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'INTU' },
  { ticker: 'DOCU34', name: 'DocuSign Inc', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DOCU' },
  { ticker: 'Z1OM34', name: 'Zoom Video', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ZM' },
  { ticker: 'R1BL34', name: 'Roblox Corp', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'RBLX' },
  { ticker: 'SNAP34', name: 'Snap Inc', price: 2.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SNAP' },
  { ticker: 'P1IN34', name: 'Pinterest Inc', price: 5.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PINS' },
  { ticker: 'ROKU34', name: 'Roku Inc', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ROKU' },
  { ticker: 'D1KN34', name: 'DraftKings Inc', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DKNG' },
  { ticker: 'E2TS34', name: 'Etsy Inc', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ETSY' },
  { ticker: 'RIVN34', name: 'Rivian Automotive', price: 2.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'RIVN' },
  { ticker: 'L1CI34', name: 'Lucid Group', price: 0.80, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LCID' },
  { ticker: 'S1OI34', name: 'SoFi Technologies', price: 2.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SOFI' },
  { ticker: 'U1PS34', name: 'UiPath Inc', price: 2.80, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PATH' },
  { ticker: 'CLVS34', name: 'Cloudflare Inc', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NET' },
  { ticker: 'M1DB34', name: 'MongoDB Inc', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MDB' },
  { ticker: 'DDOG34', name: 'Datadog Inc', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DDOG' },
  { ticker: 'CELG34', name: 'Celgene Corp', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CELG' },
  { ticker: 'GILD34', name: 'Gilead Sciences', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'GILD' },
  { ticker: 'REGN34', name: 'Regeneron Pharma', price: 185.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'REGN' },
  { ticker: 'VRTX34', name: 'Vertex Pharma', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'VRTX' },
  { ticker: 'BIIB34', name: 'Biogen Inc', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BIIB' },
  { ticker: 'I1SG34', name: 'Intuitive Surgical', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ISRG' },
  { ticker: 'E1DW34', name: 'Edwards Lifesciences', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'EW' },
  { ticker: 'S1YK34', name: 'Stryker Corp', price: 72.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SYK' },
  { ticker: 'B1DX34', name: 'Becton Dickinson', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BDX' },
  { ticker: 'LOWE34', name: 'Lowe\'s Companies', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LOW' },
  { ticker: 'TGTB34', name: 'Target Corp', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TGT' },
  { ticker: 'COLG34', name: 'Colgate-Palmolive', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CL' },
  { ticker: 'K1MB34', name: 'Kimberly-Clark', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'KMB' },
  { ticker: 'C1LX34', name: 'Clorox Company', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CLX' },
  { ticker: 'E1LC34', name: 'Estée Lauder', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'EL' },
  { ticker: 'HNKL34', name: 'Hershey Company', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'HSY' },
  { ticker: 'G1IS34', name: 'Gartner Inc', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'IT' },
  { ticker: 'R1OP34', name: 'Roper Technologies', price: 105.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ROP' },
  { ticker: 'I1LM34', name: 'Illinois Tool Works', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ITW' },
  { ticker: 'E1MR34', name: 'Emerson Electric', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'EMR' },
  { ticker: 'RTXB34', name: 'RTX Corporation', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'RTX' },
  { ticker: 'NOCC34', name: 'Northrop Grumman', price: 95.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NOC' },
  { ticker: 'G1DC34', name: 'General Dynamics', price: 52.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'GD' },
  { ticker: 'L3HX34', name: 'L3Harris Technologies', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LHX' },
  { ticker: 'D1UK34', name: 'Duke Energy', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DUK' },
  // Expansão Extra Mar/2026 - Mais BDRs
  { ticker: 'S1OC34', name: 'Southern Company', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SO' },
  { ticker: 'D1OM34', name: 'Dominion Energy', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'D' },
  { ticker: 'A1EP34', name: 'AEP Inc', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AEP' },
  { ticker: 'S1RE34', name: 'Sempra', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SRE' },
  { ticker: 'T1MO34', name: 'Thermo Fisher', price: 125.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TMO' },
  { ticker: 'D1HR34', name: 'Danaher Corp', price: 52.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DHR' },
  { ticker: 'B1MY34', name: 'Bristol-Myers Squibb', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BMY' },
  { ticker: 'M1DT34', name: 'Medtronic', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MDT' },
  { ticker: 'Z1TS34', name: 'Zoetis Inc', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ZTS' },
  { ticker: 'B1SX34', name: 'Boston Scientific', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BSX' },
  { ticker: 'H1CA34', name: 'HCA Healthcare', price: 62.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'HCA' },
  { ticker: 'C1VX34', name: 'CVS Health', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CVS' },
  { ticker: 'C1IG34', name: 'Cigna Group', price: 72.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CI' },
  { ticker: 'E1LV34', name: 'Elevance Health', price: 105.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ELV' },
  { ticker: 'L1IN34', name: 'Linde plc', price: 92.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'LIN' },
  { ticker: 'A1PD34', name: 'Air Products', price: 58.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'APD' },
  { ticker: 'S1HW34', name: 'Sherwin-Williams', price: 72.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SHW' },
  { ticker: 'F1CX34', name: 'Freeport-McMoRan', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'FCX' },
  { ticker: 'N1EM34', name: 'Newmont Corp', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NEM' },
  { ticker: 'N1UE34', name: 'Nucor Corp', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NUE' },
  { ticker: 'D1OW34', name: 'Dow Inc', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DOW' },
  { ticker: 'U1NP34', name: 'Union Pacific', price: 48.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'UNP' },
  { ticker: 'E1TN34', name: 'Eaton Corp', price: 58.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ETN' },
  { ticker: 'P1H_34', name: 'Parker-Hannifin', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PH' },
  { ticker: 'W1M_34', name: 'Waste Management', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'WM' },
  { ticker: 'C1SX34', name: 'CSX Corp', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CSX' },
  { ticker: 'N1SC34', name: 'Norfolk Southern', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NSC' },
  { ticker: 'S1LB34', name: 'SLB (Schlumberger)', price: 12.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SLB' },
  { ticker: 'E1OG34', name: 'EOG Resources', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'EOG' },
  { ticker: 'M1PC34', name: 'Marathon Petroleum', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MPC' },
  { ticker: 'P1SX34', name: 'Phillips 66', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PSX' },
  { ticker: 'D1VN34', name: 'Devon Energy', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DVN' },
  { ticker: 'S1PG34', name: 'S&P Global', price: 92.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SPGI' },
  { ticker: 'M1CO34', name: 'Moody\'s Corp', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MCO' },
  { ticker: 'I1CE34', name: 'Intercontinental Exchange', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ICE' },
  { ticker: 'C1ME34', name: 'CME Group', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'CME' },
  { ticker: 'S1CW34', name: 'Charles Schwab', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SCHW' },
  { ticker: 'P1GR34', name: 'Progressive Corp', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PGR' },
  { ticker: 'F1IS34', name: 'Fidelity National', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'FIS' },
  { ticker: 'F1SV34', name: 'Fiserv Inc', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'FISV' },
  { ticker: 'C1OF34', name: 'Capital One', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'COF' },
  { ticker: 'P1NC34', name: 'PNC Financial', price: 32.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PNC' },
  { ticker: 'U1SB34', name: 'US Bancorp', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'USB' },
  { ticker: 'T1JX34', name: 'TJX Companies', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'TJX' },
  { ticker: 'R1ST34', name: 'Ross Stores', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ROST' },
  { ticker: 'P1M_34', name: 'Philip Morris', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'PM' },
  { ticker: 'M1O_34', name: 'Altria Group', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MO' },
  { ticker: 'S1TZ34', name: 'Constellation Brands', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'STZ' },
  { ticker: 'Y1UM34', name: 'Yum! Brands', price: 28.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'YUM' },
  { ticker: 'M1AR34', name: 'Marriott International', price: 42.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'MAR' },
  { ticker: 'H1LT34', name: 'Hilton Worldwide', price: 38.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'HLT' },
  { ticker: 'B1KG34', name: 'Booking Holdings', price: 82.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'BKNG' },
  { ticker: 'N1FL34', name: 'Netflix BDR II', price: 128.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'NFLX' },
  { ticker: 'S1MC34', name: 'Super Micro Computer', price: 8.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SMCI' },
  { ticker: 'D1EL34', name: 'Dell Technologies', price: 22.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'DELL' },
  { ticker: 'A1NT34', name: 'Arista Networks', price: 52.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'ANET' },
  { ticker: 'S1OE34', name: 'Southern Company', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SO' },
  { ticker: 'D1TE34', name: 'Dominion Energy', price: 10.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'D' },
  { ticker: 'A1EP34', name: 'American Electric Power', price: 18.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'AEP' },
  { ticker: 'S1RE34', name: 'Sempra Energy', price: 15.50, change: 0, changePercent: 0, type: 'stock', underlyingTicker: 'SRE' },

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
  // Expansão Mar/2026 - Mais BDRs de ETFs
  { ticker: 'BXLC39', name: 'Communication Services SPDR', price: 15.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLC' },
  { ticker: 'BXLP39', name: 'Consumer Staples SPDR', price: 18.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLP' },
  { ticker: 'BXLY39', name: 'Consumer Discretionary SPDR', price: 32.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLY' },
  { ticker: 'BXLU39', name: 'Utilities Select SPDR', price: 12.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLU' },
  { ticker: 'BXLB39', name: 'Materials Select SPDR', price: 15.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'XLB' },
  { ticker: 'BSMH39', name: 'iShares MSCI Emerging Markets', price: 8.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'EEM' },
  { ticker: 'BFXI39', name: 'iShares China Large-Cap', price: 5.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'FXI' },
  { ticker: 'BEWZ39', name: 'iShares MSCI Brazil', price: 5.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'EWZ' },
  { ticker: 'BGDX39', name: 'VanEck Gold Miners', price: 8.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'GDX' },
  { ticker: 'BUSO39', name: 'United States Oil Fund', price: 12.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'USO' },
  { ticker: 'BARKS39', name: 'ARK Innovation ETF', price: 8.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'ARKK' },
  { ticker: 'BVXU39', name: 'Vanguard Total International', price: 12.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'VXUS' },
  { ticker: 'BVYM39', name: 'Vanguard High Dividend Yield', price: 22.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'VYM' },
  { ticker: 'BSCHD39', name: 'Schwab US Dividend Equity', price: 15.50, change: 0, changePercent: 0, type: 'etf', underlyingTicker: 'SCHD' },
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
