import { useState, useEffect, useCallback } from 'react';

interface GoldPriceData {
  pricePerGram: number;
  pricePerOunce: number;
  currency: string;
  lastUpdated: string;
}

// Preço base do ouro (atualizado manualmente, mas pode usar API)
// Preço aproximado de dezembro 2025: ~R$ 450/g para ouro 24K
const FALLBACK_GOLD_PRICE_PER_GRAM = 450;

export function useGoldPrice() {
  const [pricePerGram, setPricePerGram] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Tenta buscar preço via API de metais preciosos
      // Usando API gratuita de commodities (goldapi.io tem plano free limitado)
      // Por enquanto, vamos calcular baseado no preço internacional
      
      // Preço do ouro internacional em USD por onça troy
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=brl',
        { headers: { 'Accept': 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        // PAX Gold é lastreado 1:1 com ouro físico (1 PAXG = 1 onça troy de ouro)
        if (data['pax-gold']?.brl) {
          const pricePerOunce = data['pax-gold'].brl;
          // 1 onça troy = 31.1035 gramas
          const pricePerGramValue = pricePerOunce / 31.1035;
          setPricePerGram(Math.round(pricePerGramValue * 100) / 100);
          setLastUpdate(new Date());
          console.log('Gold price updated from API:', pricePerGramValue);
          return;
        }
      }

      // Fallback para preço aproximado
      console.log('Using fallback gold price');
      setPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching gold price:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotação do ouro');
      // Usa fallback em caso de erro
      setPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca preço na inicialização
  useEffect(() => {
    fetchPrice();
    
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    pricePerGram,
    isLoading,
    error,
    lastUpdate,
    fetchPrice,
  };
}
