import { useState, useEffect } from 'react';

interface EconomicRates {
  ipca: number; // Taxa IPCA anual atual
  cdi: number;  // Taxa CDI/Selic anual atual
  lastUpdated: Date;
}

const RATES_STORAGE_KEY = 'economic-rates';
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hora - atualiza com mais frequência

// Taxas aproximadas atuais (fallback)
const DEFAULT_RATES: EconomicRates = {
  ipca: 4.5, // IPCA aproximado
  cdi: 12.25, // Selic/CDI aproximado
  lastUpdated: new Date(),
};

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

        // Buscar taxas do Banco Central (API pública)
        const [selicResponse, ipcaResponse] = await Promise.all([
          fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'),
          fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json'),
        ]);

        let cdiRate = DEFAULT_RATES.cdi;
        let ipcaRate = DEFAULT_RATES.ipca;

        if (selicResponse.ok) {
          const selicData = await selicResponse.json();
          if (selicData && selicData[0]) {
            // Taxa Selic Meta é retornada como valor anual
            cdiRate = parseFloat(selicData[0].valor);
          }
        }

        if (ipcaResponse.ok) {
          const ipcaData = await ipcaResponse.json();
          if (ipcaData && ipcaData.length > 0) {
            // Calcular IPCA acumulado 12 meses
            const monthlyRates = ipcaData.map((item: { valor: string }) => parseFloat(item.valor));
            // Acumulado = ((1 + r1) * (1 + r2) * ... * (1 + r12) - 1) * 100
            ipcaRate = (monthlyRates.reduce((acc: number, rate: number) => acc * (1 + rate / 100), 1) - 1) * 100;
          }
        }

        const newRates: EconomicRates = {
          ipca: parseFloat(ipcaRate.toFixed(2)),
          cdi: parseFloat(cdiRate.toFixed(2)),
          lastUpdated: new Date(),
        };

        setRates(newRates);
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(newRates));
      } catch (error) {
        console.error('Erro ao buscar taxas econômicas:', error);
        // Usar taxas padrão em caso de erro
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
    additionalRate: number // Para IPCA+: o "+" / Para Pós-fixado: % do CDI (ex: 110)
  ): number => {
    const purchaseDate = new Date(purchaseDateStr);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsElapsed <= 0) return investedAmount;

    if (type === 'ipca') {
      // IPCA + taxa adicional
      const totalRate = rates.ipca + additionalRate;
      return investedAmount * Math.pow(1 + totalRate / 100, yearsElapsed);
    } else {
      // Pós-fixado: % do CDI
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
