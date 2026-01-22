import { useState, useEffect } from 'react';

interface EconomicRates {
  ipca: number; // Taxa IPCA acumulada 12 meses
  cdi: number;  // Taxa CDI/Selic anual atual
  ibovespa: number; // Retorno IBOVESPA 12 meses
  sp500: number; // Retorno S&P 500 12 meses
  lastUpdated: Date;
}

const RATES_STORAGE_KEY = 'economic-rates-v3';
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hora

// Taxas aproximadas atuais (fallback)
const DEFAULT_RATES: EconomicRates = {
  ipca: 4.5,
  cdi: 12.25,
  ibovespa: 15.0,
  sp500: 12.0,
  lastUpdated: new Date(),
};

// Função para buscar retorno 12 meses do IBOVESPA via edge function
async function fetchIbovespa12mReturn(): Promise<number | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-quotes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'historical',
          symbols: ['^BVSP'],
          market: 'br',
          range: '1y'
        }),
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const prices = data['^BVSP'] || data['BVSP'];
    
    if (prices && prices.length >= 2) {
      const firstPrice = prices[0].price;
      const lastPrice = prices[prices.length - 1].price;
      return ((lastPrice - firstPrice) / firstPrice) * 100;
    }
    return null;
  } catch (error) {
    console.error('Error fetching IBOVESPA:', error);
    return null;
  }
}

// Função para buscar retorno 12 meses do S&P 500 via edge function
async function fetchSP50012mReturn(): Promise<number | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-quotes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'historical',
          symbols: ['^GSPC'],
          market: 'usa',
          range: '1y'
        }),
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const prices = data['^GSPC'] || data['GSPC'];
    
    if (prices && prices.length >= 2) {
      const firstPrice = prices[0].price;
      const lastPrice = prices[prices.length - 1].price;
      return ((lastPrice - firstPrice) / firstPrice) * 100;
    }
    return null;
  } catch (error) {
    console.error('Error fetching S&P 500:', error);
    return null;
  }
}

export function useEconomicRates() {
  const [rates, setRates] = useState<EconomicRates>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Verificar cache local
        const cached = localStorage.getItem(RATES_STORAGE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(parsedCache.lastUpdated).getTime();
          
          if (cacheAge < CACHE_DURATION) {
            setRates({
              ...parsedCache,
              lastUpdated: new Date(parsedCache.lastUpdated),
            });
            setIsLoading(false);
            return;
          }
        }

        // Buscar todas as taxas em paralelo
        const [selicResponse, ipcaResponse, ibovespaReturn, sp500Return] = await Promise.all([
          fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'),
          fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json'),
          fetchIbovespa12mReturn(),
          fetchSP50012mReturn(),
        ]);

        let cdiRate = DEFAULT_RATES.cdi;
        let ipcaRate = DEFAULT_RATES.ipca;
        let ibovespaRate = ibovespaReturn ?? DEFAULT_RATES.ibovespa;
        let sp500Rate = sp500Return ?? DEFAULT_RATES.sp500;

        if (selicResponse.ok) {
          const selicData = await selicResponse.json();
          if (selicData && selicData[0]) {
            cdiRate = parseFloat(selicData[0].valor);
          }
        }

        if (ipcaResponse.ok) {
          const ipcaData = await ipcaResponse.json();
          if (ipcaData && ipcaData.length > 0) {
            // Calcular IPCA acumulado 12 meses
            const monthlyRates = ipcaData.map((item: { valor: string }) => parseFloat(item.valor));
            ipcaRate = (monthlyRates.reduce((acc: number, rate: number) => acc * (1 + rate / 100), 1) - 1) * 100;
          }
        }

        const newRates: EconomicRates = {
          ipca: parseFloat(ipcaRate.toFixed(2)),
          cdi: parseFloat(cdiRate.toFixed(2)),
          ibovespa: parseFloat(ibovespaRate.toFixed(2)),
          sp500: parseFloat(sp500Rate.toFixed(2)),
          lastUpdated: new Date(),
        };

        setRates(newRates);
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(newRates));
        console.log('Economic rates updated:', newRates);
      } catch (error) {
        console.error('Erro ao buscar taxas econômicas:', error);
        setRates(DEFAULT_RATES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Calcular rendimento com taxa variável
  const calculateVariableReturn = (
    investedAmount: number,
    purchaseDateStr: string,
    type: 'ipca' | 'pos',
    additionalRate: number
  ): number => {
    const purchaseDate = new Date(purchaseDateStr);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsElapsed <= 0) return investedAmount;

    if (type === 'ipca') {
      const totalRate = rates.ipca + additionalRate;
      return investedAmount * Math.pow(1 + totalRate / 100, yearsElapsed);
    } else {
      const effectiveRate = (rates.cdi * additionalRate) / 100;
      return investedAmount * Math.pow(1 + effectiveRate / 100, yearsElapsed);
    }
  };

  return {
    rates,
    isLoading,
    calculateVariableReturn,
  };
}
