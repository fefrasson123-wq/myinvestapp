import { useState, useEffect, useCallback, useRef } from 'react';
import { getPriceCache } from '@/lib/priceCache';

interface GoldPriceData {
  pricePerGram: number;
  pricePerOunce: number;
  lastUpdated: string;
}

// Cache instance
const goldCache = getPriceCache<GoldPriceData>('gold');

// Preço base do ouro 24K (dezembro 2025: ~R$ 800/g)
// Baseado em: 1 onça troy (~31.1g) = ~R$ 25.000
const FALLBACK_GOLD_PRICE_PER_GRAM = 800;

export function useGoldPrice() {
  const [pricePerGram, setPricePerGram] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Mantém o último preço válido da API
  const lastValidPrice = useRef<number | null>(null);

  // Inicializa com cache
  useEffect(() => {
    const initCache = async () => {
      const cached = await goldCache.get();
      if (cached) {
        setPricePerGram(cached.data.pricePerGram);
        setLastUpdate(new Date(goldCache.getTimestamp() || Date.now()));
        lastValidPrice.current = cached.data.pricePerGram;
      }
    };
    initCache();
    
    // Subscribe to cache updates from other tabs
    const unsubscribe = goldCache.subscribe((data) => {
      const goldData = data as GoldPriceData;
      setPricePerGram(goldData.pricePerGram);
      setLastUpdate(new Date());
    });
    
    return unsubscribe;
  }, []);

  const fetchPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Tenta buscar preço via CoinGecko (PAX Gold = 1 onça de ouro)
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
          const roundedPrice = Math.round(pricePerGramValue * 100) / 100;
          
          // Salva no cache
          await goldCache.set({
            pricePerGram: roundedPrice,
            pricePerOunce,
            lastUpdated: new Date().toISOString(),
          });
          
          lastValidPrice.current = roundedPrice;
          setPricePerGram(roundedPrice);
          setLastUpdate(new Date());
          console.log('Gold price updated from API:', roundedPrice, 'BRL/g');
          return;
        }
      }

      // Se API falhou, usa cache ou último preço válido
      const cached = await goldCache.get();
      if (cached && !cached.isStale) {
        console.log('Using cached gold price:', cached.data.pricePerGram);
        setPricePerGram(cached.data.pricePerGram);
        setLastUpdate(new Date(goldCache.getTimestamp() || Date.now()));
        return;
      }

      if (lastValidPrice.current) {
        console.log('Using last valid gold price:', lastValidPrice.current);
        setPricePerGram(lastValidPrice.current);
        return;
      }

      // Fallback final
      console.log('Using fallback gold price:', FALLBACK_GOLD_PRICE_PER_GRAM);
      setPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching gold price:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotação do ouro');
      
      // Tenta usar cache ou último preço válido antes do fallback
      const cached = await goldCache.get();
      if (cached) {
        setPricePerGram(cached.data.pricePerGram);
        setLastUpdate(new Date(goldCache.getTimestamp() || Date.now()));
        return;
      }

      if (lastValidPrice.current) {
        setPricePerGram(lastValidPrice.current);
        return;
      }

      // Fallback final apenas se não há outro dado
      setPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca preço na inicialização
  useEffect(() => {
    const init = async () => {
      const cached = await goldCache.get();
      
      if (cached?.isValid) {
        console.log('Using valid cached gold price');
        setPricePerGram(cached.data.pricePerGram);
        setLastUpdate(new Date(goldCache.getTimestamp() || Date.now()));
        lastValidPrice.current = cached.data.pricePerGram;
      } else {
        fetchPrice();
      }
    };
    
    init();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchPrice, 60000);
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
