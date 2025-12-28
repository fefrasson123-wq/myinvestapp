export interface StockAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'fii';
}

// Preços de ações brasileiras atualizados (Dezembro 2024 - fonte: B3/Status Invest)
export const stocksList: StockAsset[] = [
  // Blue Chips - Atualizado
  { ticker: 'PETR4', name: 'Petrobras PN', price: 37.28, change: -0.45, changePercent: -1.19, type: 'stock' },
  { ticker: 'PETR3', name: 'Petrobras ON', price: 40.52, change: -0.38, changePercent: -0.93, type: 'stock' },
  { ticker: 'VALE3', name: 'Vale ON', price: 54.18, change: -1.12, changePercent: -2.03, type: 'stock' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', price: 33.89, change: 0.28, changePercent: 0.83, type: 'stock' },
  { ticker: 'BBDC4', name: 'Bradesco PN', price: 11.42, change: -0.15, changePercent: -1.30, type: 'stock' },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', price: 25.67, change: -0.32, changePercent: -1.23, type: 'stock' },
  { ticker: 'ABEV3', name: 'Ambev ON', price: 11.28, change: 0.12, changePercent: 1.08, type: 'stock' },
  { ticker: 'WEGE3', name: 'WEG ON', price: 52.85, change: 0.95, changePercent: 1.83, type: 'stock' },
  { ticker: 'RENT3', name: 'Localiza ON', price: 38.94, change: -0.56, changePercent: -1.42, type: 'stock' },
  { ticker: 'MGLU3', name: 'Magazine Luiza ON', price: 7.82, change: -0.24, changePercent: -2.98, type: 'stock' },
  { ticker: 'ELET3', name: 'Eletrobras ON', price: 35.42, change: -0.18, changePercent: -0.51, type: 'stock' },
  { ticker: 'ELET6', name: 'Eletrobras PNB', price: 38.75, change: -0.22, changePercent: -0.56, type: 'stock' },
  { ticker: 'SUZB3', name: 'Suzano ON', price: 63.28, change: 1.24, changePercent: 2.00, type: 'stock' },
  { ticker: 'JBSS3', name: 'JBS ON', price: 37.45, change: 0.68, changePercent: 1.85, type: 'stock' },
  { ticker: 'LREN3', name: 'Lojas Renner ON', price: 14.28, change: -0.18, changePercent: -1.24, type: 'stock' },
  { ticker: 'HAPV3', name: 'Hapvida ON', price: 2.42, change: -0.08, changePercent: -3.20, type: 'stock' },
  { ticker: 'RAIL3', name: 'Rumo ON', price: 18.95, change: 0.32, changePercent: 1.72, type: 'stock' },
  { ticker: 'RADL3', name: 'RD Saúde ON', price: 22.35, change: 0.18, changePercent: 0.81, type: 'stock' },
  { ticker: 'EMBR3', name: 'Embraer ON', price: 58.42, change: 1.85, changePercent: 3.27, type: 'stock' },
  { ticker: 'CMIG4', name: 'Cemig PN', price: 10.78, change: 0.15, changePercent: 1.41, type: 'stock' },
  { ticker: 'CSNA3', name: 'CSN ON', price: 9.85, change: -0.28, changePercent: -2.76, type: 'stock' },
  { ticker: 'GGBR4', name: 'Gerdau PN', price: 17.42, change: 0.35, changePercent: 2.05, type: 'stock' },
  { ticker: 'B3SA3', name: 'B3 ON', price: 10.28, change: -0.12, changePercent: -1.15, type: 'stock' },
  { ticker: 'CSAN3', name: 'Cosan ON', price: 8.95, change: -0.18, changePercent: -1.97, type: 'stock' },
  { ticker: 'PRIO3', name: 'PRIO ON', price: 42.68, change: 0.92, changePercent: 2.20, type: 'stock' },
  { ticker: 'VIVT3', name: 'Telefônica Brasil ON', price: 52.35, change: 0.45, changePercent: 0.87, type: 'stock' },
  { ticker: 'EQTL3', name: 'Equatorial ON', price: 28.42, change: 0.28, changePercent: 1.00, type: 'stock' },
  { ticker: 'RDOR3', name: 'Rede D\'Or ON', price: 25.85, change: -0.32, changePercent: -1.22, type: 'stock' },
  { ticker: 'SBSP3', name: 'Sabesp ON', price: 92.45, change: 1.85, changePercent: 2.04, type: 'stock' },
  { ticker: 'ITSA4', name: 'Itaúsa PN', price: 10.28, change: 0.08, changePercent: 0.78, type: 'stock' },
  { ticker: 'BPAC11', name: 'BTG Pactual UNT', price: 29.85, change: 0.45, changePercent: 1.53, type: 'stock' },
  { ticker: 'SANB11', name: 'Santander UNT', price: 24.62, change: -0.18, changePercent: -0.73, type: 'stock' },
  { ticker: 'TOTS3', name: 'Totvs ON', price: 28.75, change: 0.35, changePercent: 1.23, type: 'stock' },
  { ticker: 'KLBN11', name: 'Klabin UNT', price: 20.85, change: 0.28, changePercent: 1.36, type: 'stock' },
  { ticker: 'TAEE11', name: 'Taesa UNT', price: 33.42, change: 0.22, changePercent: 0.66, type: 'stock' },
  { ticker: 'USIM5', name: 'Usiminas PNA', price: 5.68, change: -0.12, changePercent: -2.07, type: 'stock' },
  { ticker: 'BRFS3', name: 'BRF ON', price: 24.85, change: 0.52, changePercent: 2.14, type: 'stock' },
  { ticker: 'MRFG3', name: 'Marfrig ON', price: 17.92, change: 0.28, changePercent: 1.59, type: 'stock' },
  { ticker: 'CPLE6', name: 'Copel PNB', price: 9.85, change: 0.12, changePercent: 1.23, type: 'stock' },
  { ticker: 'CPFE3', name: 'CPFL Energia ON', price: 32.45, change: 0.35, changePercent: 1.09, type: 'stock' },
  { ticker: 'ENGI11', name: 'Energisa UNT', price: 40.28, change: 0.45, changePercent: 1.13, type: 'stock' },
  { ticker: 'CYRE3', name: 'Cyrela ON', price: 18.95, change: -0.22, changePercent: -1.15, type: 'stock' },
  { ticker: 'MRVE3', name: 'MRV ON', price: 5.82, change: -0.15, changePercent: -2.51, type: 'stock' },
  { ticker: 'ASAI3', name: 'Assaí ON', price: 6.28, change: -0.18, changePercent: -2.79, type: 'stock' },
  { ticker: 'CRFB3', name: 'Carrefour Brasil ON', price: 6.95, change: -0.12, changePercent: -1.70, type: 'stock' },
  { ticker: 'COGN3', name: 'Cogna ON', price: 1.28, change: -0.05, changePercent: -3.76, type: 'stock' },
  { ticker: 'YDUQ3', name: 'Yduqs ON', price: 10.28, change: -0.18, changePercent: -1.72, type: 'stock' },
  { ticker: 'CIEL3', name: 'Cielo ON', price: 5.42, change: 0.08, changePercent: 1.50, type: 'stock' },
  { ticker: 'AZUL4', name: 'Azul PN', price: 4.28, change: -0.22, changePercent: -4.89, type: 'stock' },
  { ticker: 'GOLL4', name: 'Gol PN', price: 1.08, change: -0.05, changePercent: -4.42, type: 'stock' },
];

// Lista de Fundos Imobiliários com preços atualizados (Dezembro 2024 - fonte: Status Invest)
export const fiiList: StockAsset[] = [
  { ticker: 'MXRF11', name: 'Maxi Renda', price: 9.42, change: -0.08, changePercent: -0.84, type: 'fii' },
  { ticker: 'XPLG11', name: 'XP Log', price: 96.85, change: 0.45, changePercent: 0.47, type: 'fii' },
  { ticker: 'HGLG11', name: 'CSHG Logística', price: 152.28, change: 1.15, changePercent: 0.76, type: 'fii' },
  { ticker: 'VISC11', name: 'Vinci Shopping Centers', price: 112.45, change: 0.68, changePercent: 0.61, type: 'fii' },
  { ticker: 'XPML11', name: 'XP Malls', price: 104.85, change: 0.52, changePercent: 0.50, type: 'fii' },
  { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária', price: 138.92, change: 0.85, changePercent: 0.62, type: 'fii' },
  { ticker: 'HGBS11', name: 'Hedge Brasil Shopping', price: 192.45, change: 1.25, changePercent: 0.65, type: 'fii' },
  { ticker: 'BCFF11', name: 'BTG Pactual Fundo de Fundos', price: 72.85, change: -0.18, changePercent: -0.25, type: 'fii' },
  { ticker: 'VILG11', name: 'Vinci Logística', price: 88.42, change: 0.32, changePercent: 0.36, type: 'fii' },
  { ticker: 'PVBI11', name: 'VBI Prime Properties', price: 92.15, change: 0.28, changePercent: 0.30, type: 'fii' },
  { ticker: 'RBRP11', name: 'RBR Properties', price: 56.85, change: -0.25, changePercent: -0.44, type: 'fii' },
  { ticker: 'BTLG11', name: 'BTG Pactual Logística', price: 94.28, change: 0.42, changePercent: 0.45, type: 'fii' },
  { ticker: 'HGRE11', name: 'CSHG Real Estate', price: 122.45, change: 0.55, changePercent: 0.45, type: 'fii' },
  { ticker: 'JSRE11', name: 'JS Real Estate', price: 68.92, change: -0.15, changePercent: -0.22, type: 'fii' },
  { ticker: 'VRTA11', name: 'Fator Verita', price: 82.35, change: 0.28, changePercent: 0.34, type: 'fii' },
  { ticker: 'CPTS11', name: 'Capitânia Securities', price: 78.42, change: -0.12, changePercent: -0.15, type: 'fii' },
  { ticker: 'RECR11', name: 'REC Recebíveis', price: 76.85, change: 0.18, changePercent: 0.23, type: 'fii' },
  { ticker: 'IRDM11', name: 'Iridium Recebíveis', price: 72.45, change: -0.22, changePercent: -0.30, type: 'fii' },
  { ticker: 'KNCR11', name: 'Kinea Rendimentos', price: 98.85, change: 0.35, changePercent: 0.36, type: 'fii' },
  { ticker: 'RBRY11', name: 'RBR Rendimento High Grade', price: 88.42, change: 0.28, changePercent: 0.32, type: 'fii' },
  { ticker: 'VGIR11', name: 'Valora RE', price: 9.28, change: 0.02, changePercent: 0.22, type: 'fii' },
  { ticker: 'HSML11', name: 'HSI Malls', price: 78.92, change: -0.18, changePercent: -0.23, type: 'fii' },
  { ticker: 'MALL11', name: 'Malls Brasil Plural', price: 94.28, change: 0.42, changePercent: 0.45, type: 'fii' },
  { ticker: 'LVBI11', name: 'VBI Logístico', price: 102.45, change: 0.55, changePercent: 0.54, type: 'fii' },
  { ticker: 'ALZR11', name: 'Alianza Trust', price: 108.85, change: 0.62, changePercent: 0.57, type: 'fii' },
];

export function getStockByTicker(ticker: string): StockAsset | undefined {
  return [...stocksList, ...fiiList].find(s => s.ticker.toLowerCase() === ticker.toLowerCase());
}

export function searchStocks(query: string): StockAsset[] {
  const q = query.toLowerCase();
  return stocksList.filter(
    s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

export function searchFiis(query: string): StockAsset[] {
  const q = query.toLowerCase();
  return fiiList.filter(
    s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}
