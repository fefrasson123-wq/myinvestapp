export interface StockAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'fii';
}

// Preços de ações brasileiras atualizados (Dezembro 2025 - fonte: B3/Status Invest/InfoMoney)
export const stocksList: StockAsset[] = [
  // Blue Chips - Atualizado Dezembro 2025
  { ticker: 'PETR4', name: 'Petrobras PN', price: 36.85, change: 0.32, changePercent: 0.88, type: 'stock' },
  { ticker: 'PETR3', name: 'Petrobras ON', price: 40.12, change: 0.28, changePercent: 0.70, type: 'stock' },
  { ticker: 'VALE3', name: 'Vale ON', price: 52.45, change: -0.85, changePercent: -1.59, type: 'stock' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', price: 32.78, change: 0.45, changePercent: 1.39, type: 'stock' },
  { ticker: 'BBDC4', name: 'Bradesco PN', price: 12.15, change: 0.18, changePercent: 1.50, type: 'stock' },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', price: 27.42, change: 0.35, changePercent: 1.29, type: 'stock' },
  { ticker: 'ABEV3', name: 'Ambev ON', price: 10.95, change: -0.12, changePercent: -1.08, type: 'stock' },
  { ticker: 'WEGE3', name: 'WEG ON', price: 54.28, change: 0.75, changePercent: 1.40, type: 'stock' },
  { ticker: 'RENT3', name: 'Localiza ON', price: 36.45, change: -0.42, changePercent: -1.14, type: 'stock' },
  { ticker: 'MGLU3', name: 'Magazine Luiza ON', price: 8.25, change: 0.18, changePercent: 2.23, type: 'stock' },
  { ticker: 'ELET3', name: 'Eletrobras ON', price: 37.85, change: 0.55, changePercent: 1.47, type: 'stock' },
  { ticker: 'ELET6', name: 'Eletrobras PNB', price: 41.20, change: 0.62, changePercent: 1.53, type: 'stock' },
  { ticker: 'SUZB3', name: 'Suzano ON', price: 61.75, change: -0.45, changePercent: -0.72, type: 'stock' },
  { ticker: 'JBSS3', name: 'JBS ON', price: 38.92, change: 0.48, changePercent: 1.25, type: 'stock' },
  { ticker: 'LREN3', name: 'Lojas Renner ON', price: 15.85, change: 0.22, changePercent: 1.41, type: 'stock' },
  { ticker: 'HAPV3', name: 'Hapvida ON', price: 2.68, change: 0.05, changePercent: 1.90, type: 'stock' },
  { ticker: 'RAIL3', name: 'Rumo ON', price: 19.45, change: 0.28, changePercent: 1.46, type: 'stock' },
  { ticker: 'RADL3', name: 'RD Saúde ON', price: 23.85, change: 0.32, changePercent: 1.36, type: 'stock' },
  { ticker: 'EMBR3', name: 'Embraer ON', price: 62.45, change: 1.25, changePercent: 2.04, type: 'stock' },
  { ticker: 'CMIG4', name: 'Cemig PN', price: 11.28, change: 0.15, changePercent: 1.35, type: 'stock' },
  { ticker: 'CSNA3', name: 'CSN ON', price: 10.42, change: 0.18, changePercent: 1.76, type: 'stock' },
  { ticker: 'GGBR4', name: 'Gerdau PN', price: 18.65, change: 0.28, changePercent: 1.52, type: 'stock' },
  { ticker: 'B3SA3', name: 'B3 ON', price: 11.45, change: 0.15, changePercent: 1.33, type: 'stock' },
  { ticker: 'CSAN3', name: 'Cosan ON', price: 9.85, change: 0.12, changePercent: 1.23, type: 'stock' },
  { ticker: 'PRIO3', name: 'PRIO ON', price: 44.28, change: 0.65, changePercent: 1.49, type: 'stock' },
  { ticker: 'VIVT3', name: 'Telefônica Brasil ON', price: 54.85, change: 0.42, changePercent: 0.77, type: 'stock' },
  { ticker: 'EQTL3', name: 'Equatorial ON', price: 30.15, change: 0.38, changePercent: 1.28, type: 'stock' },
  { ticker: 'RDOR3', name: 'Rede D\'Or ON', price: 27.45, change: 0.35, changePercent: 1.29, type: 'stock' },
  { ticker: 'SBSP3', name: 'Sabesp ON', price: 95.85, change: 1.45, changePercent: 1.54, type: 'stock' },
  { ticker: 'ITSA4', name: 'Itaúsa PN', price: 10.85, change: 0.12, changePercent: 1.12, type: 'stock' },
  { ticker: 'BPAC11', name: 'BTG Pactual UNT', price: 31.45, change: 0.55, changePercent: 1.78, type: 'stock' },
  { ticker: 'SANB11', name: 'Santander UNT', price: 26.28, change: 0.32, changePercent: 1.23, type: 'stock' },
  { ticker: 'TOTS3', name: 'Totvs ON', price: 30.15, change: 0.42, changePercent: 1.41, type: 'stock' },
  { ticker: 'KLBN11', name: 'Klabin UNT', price: 22.45, change: 0.28, changePercent: 1.26, type: 'stock' },
  { ticker: 'TAEE11', name: 'Taesa UNT', price: 35.28, change: 0.35, changePercent: 1.00, type: 'stock' },
  { ticker: 'USIM5', name: 'Usiminas PNA', price: 6.28, change: 0.12, changePercent: 1.95, type: 'stock' },
  { ticker: 'BRFS3', name: 'BRF ON', price: 26.45, change: 0.45, changePercent: 1.73, type: 'stock' },
  { ticker: 'MRFG3', name: 'Marfrig ON', price: 19.28, change: 0.32, changePercent: 1.69, type: 'stock' },
  { ticker: 'CPLE6', name: 'Copel PNB', price: 10.45, change: 0.15, changePercent: 1.46, type: 'stock' },
  { ticker: 'CPFE3', name: 'CPFL Energia ON', price: 34.28, change: 0.42, changePercent: 1.24, type: 'stock' },
  { ticker: 'ENGI11', name: 'Energisa UNT', price: 42.85, change: 0.55, changePercent: 1.30, type: 'stock' },
  { ticker: 'CYRE3', name: 'Cyrela ON', price: 20.45, change: 0.28, changePercent: 1.39, type: 'stock' },
  { ticker: 'MRVE3', name: 'MRV ON', price: 6.45, change: 0.12, changePercent: 1.89, type: 'stock' },
  { ticker: 'ASAI3', name: 'Assaí ON', price: 6.85, change: 0.08, changePercent: 1.18, type: 'stock' },
  { ticker: 'CRFB3', name: 'Carrefour Brasil ON', price: 7.45, change: 0.12, changePercent: 1.64, type: 'stock' },
  { ticker: 'COGN3', name: 'Cogna ON', price: 1.45, change: 0.03, changePercent: 2.11, type: 'stock' },
  { ticker: 'YDUQ3', name: 'Yduqs ON', price: 11.28, change: 0.18, changePercent: 1.62, type: 'stock' },
  { ticker: 'CIEL3', name: 'Cielo ON', price: 5.85, change: 0.08, changePercent: 1.39, type: 'stock' },
  { ticker: 'AZUL4', name: 'Azul PN', price: 4.85, change: 0.15, changePercent: 3.19, type: 'stock' },
  { ticker: 'GOLL4', name: 'Gol PN', price: 1.25, change: 0.03, changePercent: 2.46, type: 'stock' },
];

// Lista de Fundos Imobiliários com preços atualizados (Dezembro 2025 - fonte: Status Invest)
export const fiiList: StockAsset[] = [
  { ticker: 'MXRF11', name: 'Maxi Renda', price: 9.85, change: 0.08, changePercent: 0.82, type: 'fii' },
  { ticker: 'XPLG11', name: 'XP Log', price: 98.45, change: 0.65, changePercent: 0.66, type: 'fii' },
  { ticker: 'HGLG11', name: 'CSHG Logística', price: 155.28, change: 1.25, changePercent: 0.81, type: 'fii' },
  { ticker: 'VISC11', name: 'Vinci Shopping Centers', price: 115.85, change: 0.85, changePercent: 0.74, type: 'fii' },
  { ticker: 'XPML11', name: 'XP Malls', price: 108.45, change: 0.72, changePercent: 0.67, type: 'fii' },
  { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária', price: 142.28, change: 0.95, changePercent: 0.67, type: 'fii' },
  { ticker: 'HGBS11', name: 'Hedge Brasil Shopping', price: 198.45, change: 1.45, changePercent: 0.74, type: 'fii' },
  { ticker: 'BCFF11', name: 'BTG Pactual Fundo de Fundos', price: 75.85, change: 0.35, changePercent: 0.46, type: 'fii' },
  { ticker: 'VILG11', name: 'Vinci Logística', price: 91.28, change: 0.48, changePercent: 0.53, type: 'fii' },
  { ticker: 'PVBI11', name: 'VBI Prime Properties', price: 95.45, change: 0.42, changePercent: 0.44, type: 'fii' },
  { ticker: 'RBRP11', name: 'RBR Properties', price: 58.85, change: 0.28, changePercent: 0.48, type: 'fii' },
  { ticker: 'BTLG11', name: 'BTG Pactual Logística', price: 97.85, change: 0.55, changePercent: 0.56, type: 'fii' },
  { ticker: 'HGRE11', name: 'CSHG Real Estate', price: 125.45, change: 0.72, changePercent: 0.58, type: 'fii' },
  { ticker: 'JSRE11', name: 'JS Real Estate', price: 71.85, change: 0.35, changePercent: 0.49, type: 'fii' },
  { ticker: 'VRTA11', name: 'Fator Verita', price: 85.28, change: 0.42, changePercent: 0.49, type: 'fii' },
  { ticker: 'CPTS11', name: 'Capitânia Securities', price: 81.45, change: 0.35, changePercent: 0.43, type: 'fii' },
  { ticker: 'RECR11', name: 'REC Recebíveis', price: 79.85, change: 0.38, changePercent: 0.48, type: 'fii' },
  { ticker: 'IRDM11', name: 'Iridium Recebíveis', price: 75.28, change: 0.32, changePercent: 0.43, type: 'fii' },
  { ticker: 'KNCR11', name: 'Kinea Rendimentos', price: 102.45, change: 0.55, changePercent: 0.54, type: 'fii' },
  { ticker: 'RBRY11', name: 'RBR Rendimento High Grade', price: 91.85, change: 0.42, changePercent: 0.46, type: 'fii' },
  { ticker: 'VGIR11', name: 'Valora RE', price: 9.65, change: 0.05, changePercent: 0.52, type: 'fii' },
  { ticker: 'HSML11', name: 'HSI Malls', price: 82.45, change: 0.38, changePercent: 0.46, type: 'fii' },
  { ticker: 'MALL11', name: 'Malls Brasil Plural', price: 97.85, change: 0.55, changePercent: 0.57, type: 'fii' },
  { ticker: 'LVBI11', name: 'VBI Logístico', price: 105.85, change: 0.68, changePercent: 0.65, type: 'fii' },
  { ticker: 'ALZR11', name: 'Alianza Trust', price: 112.45, change: 0.75, changePercent: 0.67, type: 'fii' },
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
