export interface REITAsset {
  ticker: string;
  name: string;
}

// REITs disponíveis no Yahoo Finance - Atualizado Mar/2026
export const reitsList: REITAsset[] = [
  // Diversificado
  { ticker: 'O', name: 'Realty Income Corporation' },
  { ticker: 'WPC', name: 'W. P. Carey Inc.' },
  { ticker: 'NNN', name: 'NNN REIT Inc.' },
  { ticker: 'STOR', name: 'STORE Capital' },
  { ticker: 'ADC', name: 'Agree Realty' },
  { ticker: 'EPRT', name: 'Essential Properties Realty' },
  { ticker: 'STAG', name: 'STAG Industrial' },

  // Torres de Celular / Data Centers
  { ticker: 'AMT', name: 'American Tower Corporation' },
  { ticker: 'CCI', name: 'Crown Castle Inc.' },
  { ticker: 'SBAC', name: 'SBA Communications' },
  { ticker: 'EQIX', name: 'Equinix Inc.' },
  { ticker: 'DLR', name: 'Digital Realty Trust' },

  // Shopping / Varejo
  { ticker: 'SPG', name: 'Simon Property Group' },
  { ticker: 'MAC', name: 'Macerich Company' },
  { ticker: 'KIM', name: 'Kimco Realty' },
  { ticker: 'REG', name: 'Regency Centers' },
  { ticker: 'FRT', name: 'Federal Realty Investment' },
  { ticker: 'BRX', name: 'Brixmor Property' },
  { ticker: 'SKT', name: 'Tanger Factory Outlet' },
  { ticker: 'RPT', name: 'RPT Realty' },

  // Residencial
  { ticker: 'AVB', name: 'AvalonBay Communities' },
  { ticker: 'EQR', name: 'Equity Residential' },
  { ticker: 'MAA', name: 'Mid-America Apartment' },
  { ticker: 'ESS', name: 'Essex Property Trust' },
  { ticker: 'UDR', name: 'UDR Inc.' },
  { ticker: 'CPT', name: 'Camden Property Trust' },
  { ticker: 'NXRT', name: 'NexPoint Residential' },
  { ticker: 'AIV', name: 'Apartment Investment' },
  { ticker: 'INVH', name: 'Invitation Homes' },
  { ticker: 'AMH', name: 'American Homes 4 Rent' },
  { ticker: 'SUI', name: 'Sun Communities' },
  { ticker: 'ELS', name: 'Equity LifeStyle Properties' },

  // Escritórios
  { ticker: 'ARE', name: 'Alexandria Real Estate' },
  { ticker: 'BXP', name: 'BXP Inc. (ex-Boston Prop)' },
  { ticker: 'VNO', name: 'Vornado Realty Trust' },
  { ticker: 'SLG', name: 'SL Green Realty' },
  { ticker: 'KRC', name: 'Kilroy Realty' },
  { ticker: 'HIW', name: 'Highwoods Properties' },
  { ticker: 'CUZ', name: 'Cousins Properties' },
  { ticker: 'DEI', name: 'Douglas Emmett' },
  { ticker: 'OFC', name: 'Corporate Office Properties' },
  { ticker: 'PDM', name: 'Piedmont Office Realty' },

  // Logística / Industrial
  { ticker: 'PLD', name: 'Prologis Inc.' },
  { ticker: 'REXR', name: 'Rexford Industrial Realty' },
  { ticker: 'FR', name: 'First Industrial Realty' },
  { ticker: 'EGP', name: 'EastGroup Properties' },
  { ticker: 'LPT', name: 'Liberty Property Trust' },
  { ticker: 'TRNO', name: 'Terreno Realty' },

  // Self Storage
  { ticker: 'PSA', name: 'Public Storage' },
  { ticker: 'EXR', name: 'Extra Space Storage' },
  { ticker: 'CUBE', name: 'CubeSmart' },
  { ticker: 'LSI', name: 'Life Storage Inc.' },
  { ticker: 'NSA', name: 'National Storage Affiliates' },

  // Saúde
  { ticker: 'WELL', name: 'Welltower Inc.' },
  { ticker: 'VTR', name: 'Ventas Inc.' },
  { ticker: 'OHI', name: 'Omega Healthcare Investors' },
  { ticker: 'HR', name: 'Healthcare Realty Trust' },
  { ticker: 'PEAK', name: 'Healthpeak Properties' },
  { ticker: 'DOC', name: 'Physicians Realty Trust' },
  { ticker: 'CTRE', name: 'CareTrust REIT' },
  { ticker: 'MPW', name: 'Medical Properties Trust' },
  { ticker: 'SBRA', name: 'Sabra Health Care REIT' },
  { ticker: 'NHI', name: 'National Health Investors' },
  { ticker: 'LTC', name: 'LTC Properties' },

  // Hospitalidade
  { ticker: 'HST', name: 'Host Hotels & Resorts' },
  { ticker: 'RHP', name: 'Ryman Hospitality' },
  { ticker: 'PK', name: 'Park Hotels & Resorts' },
  { ticker: 'SHO', name: 'Sunstone Hotel Investors' },
  { ticker: 'DRH', name: 'DiamondRock Hospitality' },
  { ticker: 'APLE', name: 'Apple Hospitality REIT' },
  { ticker: 'RLJ', name: 'RLJ Lodging Trust' },
  { ticker: 'XHR', name: 'Xenia Hotels & Resorts' },
  { ticker: 'PEB', name: 'Pebblebrook Hotel Trust' },

  // Specialty
  { ticker: 'VICI', name: 'VICI Properties (Gaming)' },
  { ticker: 'IRM', name: 'Iron Mountain (Storage)' },
  { ticker: 'GLPI', name: 'Gaming & Leisure Properties' },
  { ticker: 'LAMR', name: 'Lamar Advertising' },
  { ticker: 'OUT', name: 'Outfront Media' },
  { ticker: 'GTY', name: 'Getty Realty' },
  { ticker: 'SAFE', name: 'Safehold Inc.' },
  { ticker: 'IIPR', name: 'Innovative Industrial Prop.' },
  { ticker: 'UE', name: 'Urban Edge Properties' },
  { ticker: 'AKR', name: 'Acadia Realty Trust' },

  // Timber
  { ticker: 'WY', name: 'Weyerhaeuser Company' },
  { ticker: 'RYN', name: 'Rayonier Inc.' },
  { ticker: 'PCH', name: 'PotlatchDeltic Corporation' },

  // Mortgage REITs
  { ticker: 'AGNC', name: 'AGNC Investment' },
  { ticker: 'NLY', name: 'Annaly Capital Management' },
  { ticker: 'STWD', name: 'Starwood Property Trust' },
  { ticker: 'BXMT', name: 'Blackstone Mortgage Trust' },
  { ticker: 'TWO', name: 'Two Harbors Investment' },
  { ticker: 'ARR', name: 'ARMOUR Residential REIT' },
  { ticker: 'MFA', name: 'MFA Financial' },
  { ticker: 'RC', name: 'Ready Capital' },
  { ticker: 'KREF', name: 'KKR Real Estate Finance' },
  { ticker: 'ARI', name: 'Apollo Commercial Real Estate' },

  // ETF de REITs
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF' },
  { ticker: 'SCHH', name: 'Schwab U.S. REIT ETF' },
  { ticker: 'IYR', name: 'iShares U.S. Real Estate ETF' },
  { ticker: 'XLRE', name: 'Real Estate Select SPDR' },
  { ticker: 'RWR', name: 'SPDR Dow Jones REIT ETF' },
  { ticker: 'VNQI', name: 'Vanguard Global ex-US Real Estate' },

  // Expansão Mar/2026
  // Shopping / Varejo extra
  { ticker: 'WRI', name: 'Weingarten Realty' },
  { ticker: 'ROIC', name: 'Retail Opportunity Investments' },
  { ticker: 'SITC', name: 'SITE Centers' },
  { ticker: 'KRG', name: 'Kite Realty Group Trust' },
  { ticker: 'RPAI', name: 'RPT Realty (ex-Ramco)' },
  { ticker: 'CBL', name: 'CBL & Associates' },
  { ticker: 'PEI', name: 'Pennsylvania REIT' },
  { ticker: 'BFS', name: 'Saul Centers' },
  { ticker: 'WHLR', name: 'Wheeler REIT' },
  { ticker: 'WSR', name: 'Whitestone REIT' },

  // Residencial extra
  { ticker: 'NRZ', name: 'New Residential Investment' },
  { ticker: 'NXDT', name: 'NexPoint Diversified' },
  { ticker: 'VRE', name: 'Veris Residential' },
  { ticker: 'CSR', name: 'Centerspace' },
  { ticker: 'IRT', name: 'Independence Realty Trust' },
  { ticker: 'NEN', name: 'New England Realty' },
  { ticker: 'ELME', name: 'Elme Communities' },
  { ticker: 'BRT', name: 'BRT Realty Trust' },

  // Escritórios extra
  { ticker: 'PGRE', name: 'Paramount Group' },
  { ticker: 'EQC', name: 'Equity Commonwealth' },
  { ticker: 'CADE', name: 'Cadence Bank REIT' },
  { ticker: 'JBGS', name: 'JBG SMITH Properties' },
  { ticker: 'BDN', name: 'Brandywine Realty' },
  { ticker: 'CDP', name: 'COPT Defense Properties' },
  { ticker: 'FSP', name: 'Franklin Street Properties' },
  { ticker: 'CLI', name: 'Mack-Cali Realty' },
  { ticker: 'ESRT', name: 'Empire State Realty Trust' },

  // Industrial extra
  { ticker: 'DRE', name: 'Duke Realty' },
  { ticker: 'GLP', name: 'Global Logistics Properties' },
  { ticker: 'GTI', name: 'Graniteshares Gold Trust' },
  { ticker: 'IIPR', name: 'Innovative Industrial Properties' },
  { ticker: 'LXP', name: 'LXP Industrial Trust' },
  { ticker: 'MNR', name: 'Monmouth Real Estate' },
  { ticker: 'PLT', name: 'Plymouth Industrial REIT' },

  // Self Storage extra
  { ticker: 'SSS', name: 'Sovran Self Storage' },
  { ticker: 'SELF', name: 'Global Self Storage' },

  // Saúde extra
  { ticker: 'UHT', name: 'Universal Health Realty' },
  { ticker: 'CHCT', name: 'Community Healthcare Trust' },
  { ticker: 'GHC', name: 'Global Medical REIT' },
  { ticker: 'GMRE', name: 'Global Medical REIT Inc.' },
  { ticker: 'DHC', name: 'Diversified Healthcare Trust' },

  // Hospitalidade extra
  { ticker: 'HT', name: 'Hersha Hospitality Trust' },
  { ticker: 'AHT', name: 'Ashford Hospitality Trust' },
  { ticker: 'BHR', name: 'Braemar Hotels & Resorts' },
  { ticker: 'CLDT', name: 'Chatham Lodging Trust' },
  { ticker: 'INN', name: 'Summit Hotel Properties' },

  // Specialty extra
  { ticker: 'UNIT', name: 'Uniti Group' },
  { ticker: 'CTO', name: 'CTO Realty Growth' },
  { ticker: 'FPR', name: 'FlexShopper' },
  { ticker: 'SRC', name: 'Spirit Realty Capital' },
  { ticker: 'BNL', name: 'Broadstone Net Lease' },
  { ticker: 'PINE', name: 'Alpine Income Prop Trust' },
  { ticker: 'PLYM', name: 'Plymouth Industrial REIT' },
  { ticker: 'AAT', name: 'American Assets Trust' },
  { ticker: 'EFC', name: 'Ellington Financial' },
  { ticker: 'TWO', name: 'Two Harbors Investment' },

  // Mortgage REITs extra
  { ticker: 'PMT', name: 'PennyMac Mortgage Trust' },
  { ticker: 'CIM', name: 'Chimera Investment' },
  { ticker: 'NYMT', name: 'New York Mortgage Trust' },
  { ticker: 'MITT', name: 'AG Mortgage Investment' },
  { ticker: 'RWT', name: 'Redwood Trust' },
  { ticker: 'ACRE', name: 'Ares Commercial Real Estate' },
  { ticker: 'TRTX', name: 'TPG RE Finance Trust' },
  { ticker: 'LADR', name: 'Ladder Capital' },
  { ticker: 'GPMT', name: 'Granite Point Mortgage' },
  { ticker: 'DX', name: 'Dynex Capital' },
  { ticker: 'RITM', name: 'Rithm Capital' },
  { ticker: 'ABR', name: 'Arbor Realty Trust' },
  { ticker: 'HASI', name: 'HA Sustainable Infrastructure' },
  { ticker: 'AOMR', name: 'Angel Oak Mortgage' },
  { ticker: 'CHMI', name: 'Cherry Hill Mortgage' },

  // ETF de REITs extra
  { ticker: 'REET', name: 'iShares Global REIT ETF' },
  { ticker: 'REM', name: 'iShares Mortgage REIT ETF' },
  { ticker: 'MORT', name: 'VanEck Mortgage REIT Income' },
  { ticker: 'RWX', name: 'SPDR Intl Real Estate ETF' },
  { ticker: 'KBWY', name: 'Invesco KBW Premium Yield' },
  { ticker: 'USRT', name: 'iShares Core US REIT ETF' },
  { ticker: 'REZ', name: 'iShares Residential & Multisector' },
  { ticker: 'ICF', name: 'iShares Cohen & Steers REIT' },
  { ticker: 'SRET', name: 'Global X SuperDividend REIT' },
  { ticker: 'BBRE', name: 'JPMorgan BetaBuilders MSCI REIT' },
];

export function searchREITs(query: string): REITAsset[] {
  const q = query.toLowerCase();
  return reitsList.filter(
    r => r.ticker.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
  );
}
