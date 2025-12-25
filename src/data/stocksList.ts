export interface StockAsset {
  ticker: string;
  name: string;
  price: number;
  type: 'stock' | 'fii';
}

// Lista simulada de ações brasileiras com preços (em BRL)
export const stocksList: StockAsset[] = [
  // Ações
  { ticker: 'PETR4', name: 'Petrobras PN', price: 38.50, type: 'stock' },
  { ticker: 'VALE3', name: 'Vale ON', price: 68.20, type: 'stock' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', price: 32.80, type: 'stock' },
  { ticker: 'BBDC4', name: 'Bradesco PN', price: 14.30, type: 'stock' },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', price: 28.50, type: 'stock' },
  { ticker: 'ABEV3', name: 'Ambev ON', price: 12.40, type: 'stock' },
  { ticker: 'WEGE3', name: 'WEG ON', price: 52.30, type: 'stock' },
  { ticker: 'RENT3', name: 'Localiza ON', price: 42.80, type: 'stock' },
  { ticker: 'MGLU3', name: 'Magazine Luiza ON', price: 8.50, type: 'stock' },
  { ticker: 'ELET3', name: 'Eletrobras ON', price: 41.20, type: 'stock' },
  { ticker: 'SUZB3', name: 'Suzano ON', price: 58.90, type: 'stock' },
  { ticker: 'JBSS3', name: 'JBS ON', price: 34.60, type: 'stock' },
  { ticker: 'LREN3', name: 'Lojas Renner ON', price: 14.80, type: 'stock' },
  { ticker: 'HAPV3', name: 'Hapvida ON', price: 4.20, type: 'stock' },
  { ticker: 'RAIL3', name: 'Rumo ON', price: 22.40, type: 'stock' },
  { ticker: 'RADL3', name: 'RD Saúde ON', price: 26.80, type: 'stock' },
  { ticker: 'EMBR3', name: 'Embraer ON', price: 48.50, type: 'stock' },
  { ticker: 'CMIG4', name: 'Cemig PN', price: 11.30, type: 'stock' },
  { ticker: 'CSNA3', name: 'CSN ON', price: 12.80, type: 'stock' },
  { ticker: 'GGBR4', name: 'Gerdau PN', price: 19.40, type: 'stock' },
];

// Lista de Fundos Imobiliários
export const fiiList: StockAsset[] = [
  { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária', price: 142.50, type: 'fii' },
  { ticker: 'HGLG11', name: 'CSHG Logística', price: 158.20, type: 'fii' },
  { ticker: 'XPLG11', name: 'XP Log', price: 108.40, type: 'fii' },
  { ticker: 'VISC11', name: 'Vinci Shopping Centers', price: 118.30, type: 'fii' },
  { ticker: 'MXRF11', name: 'Maxi Renda', price: 10.85, type: 'fii' },
  { ticker: 'KNCR11', name: 'Kinea Rendimentos', price: 102.60, type: 'fii' },
  { ticker: 'XPML11', name: 'XP Malls', price: 112.40, type: 'fii' },
  { ticker: 'BTLG11', name: 'BTG Pactual Logística', price: 98.20, type: 'fii' },
  { ticker: 'PVBI11', name: 'VBI Prime Properties', price: 88.50, type: 'fii' },
  { ticker: 'HGRE11', name: 'CSHG Real Estate', price: 128.70, type: 'fii' },
  { ticker: 'BCFF11', name: 'BTG Pactual Fundo de Fundos', price: 78.40, type: 'fii' },
  { ticker: 'IRDM11', name: 'Iridium Recebíveis', price: 82.30, type: 'fii' },
  { ticker: 'VILG11', name: 'Vinci Logística', price: 98.60, type: 'fii' },
  { ticker: 'RECR11', name: 'REC Recebíveis', price: 85.20, type: 'fii' },
  { ticker: 'RBRF11', name: 'RBR Alpha', price: 78.90, type: 'fii' },
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
