import { useState, useEffect, useRef } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Investment, PriceHistory } from '@/types/investment';
import { useUsdBrlRate } from '@/hooks/useUsdBrlRate';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceChartProps {
  investments: Investment[];
  period: '24h' | '1w' | '1m' | '6m' | '1y' | 'total';
}

// Cache constants
const CACHE_KEY = 'historical_prices_cache';
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes for recent data
const CACHE_STALE_AGE_MS = 5 * 60 * 1000; // 5 minutes before background refresh

// Tipo para histórico de preços
type HistoricalPrices = Record<string, Array<{ date: string; price: number }>>;

interface CachedHistoricalData {
  data: HistoricalPrices;
  timestamp: number;
  range: string;
}

// Cache functions
function getCacheKey(symbols: string[], market: string, range: string): string {
  return `${market}_${range}_${symbols.sort().join(',')}`;
}

function getCache(): Record<string, CachedHistoricalData> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function setCache(key: string, data: HistoricalPrices, range: string): void {
  try {
    const cache = getCache();
    cache[key] = { data, timestamp: Date.now(), range };
    
    // Clean old entries (keep last 20)
    const entries = Object.entries(cache);
    if (entries.length > 20) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const cleaned = Object.fromEntries(entries.slice(0, 20));
      localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.warn('Failed to cache historical prices:', e);
  }
}

function getCachedData(key: string): CachedHistoricalData | null {
  const cache = getCache();
  const entry = cache[key];
  
  if (!entry) return null;
  
  // Check if cache is still valid (not expired)
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_MAX_AGE_MS) {
    return null; // Expired
  }
  
  return entry;
}

function isCacheStale(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_STALE_AGE_MS;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getPeriodDays(period: string, oldestPurchaseDate?: Date): number {
  switch (period) {
    case '24h':
      return 1;
    case '1w':
      return 7;
    case '1m':
      return 30;
    case '6m':
      return 180;
    case '1y':
      return 365;
    case 'total':
      if (oldestPurchaseDate) {
        const daysSincePurchase = Math.ceil((Date.now() - oldestPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(daysSincePurchase, 30); // Minimum 30 days
      }
      return 365;
    default:
      return 365;
  }
}

function getYahooRange(period: string, days?: number): string {
  // If days provided and more than 1 year, use appropriate range
  if (days && days > 365) {
    if (days > 365 * 5) return '10y';
    if (days > 365 * 3) return '5y';
    if (days > 365 * 2) return '5y';
    if (days > 365) return '2y';
  }
  
  switch (period) {
    case '24h':
      return '1d';
    case '1w':
      return '5d'; // Yahoo tem melhor suporte para 5d com intervalo 1h
    case '1m':
      return '1mo';
    case '6m':
      return '6mo';
    case '1y':
      return '1y';
    case 'total':
      return days && days > 365 ? (days > 365 * 2 ? '5y' : '2y') : '1y';
    default:
      return '1y';
  }
}

// Calcula taxa diária baseada no tipo de renda fixa
function getDailyRate(investment: Investment): number {
  const annualRate = (investment.interestRate || 10) / 100;
  return Math.pow(1 + annualRate, 1 / 365) - 1;
}

// Calcula valor da renda fixa em um momento específico
function calculateFixedIncomeAtTime(investment: Investment, timestamp: number): number {
  const purchaseDate = investment.purchaseDate
    ? new Date(investment.purchaseDate).getTime()
    : investment.createdAt.getTime();

  if (timestamp < purchaseDate) return 0;

  const dailyRate = getDailyRate(investment);
  const daysElapsed = (timestamp - purchaseDate) / (1000 * 60 * 60 * 24);

  return investment.investedAmount * Math.pow(1 + dailyRate, daysElapsed);
}

// IMÓVEIS: quando o usuário informa "valor atual", precisamos distribuir esse crescimento ao longo do tempo.
// Calcula a taxa anual implícita e aplica juros compostos até o timestamp.
function calculateRealEstateAtTime(investment: Investment, timestamp: number): number {
  const purchaseTs = investment.purchaseDate
    ? new Date(investment.purchaseDate).getTime()
    : investment.createdAt.getTime();

  if (timestamp < purchaseTs) return 0;

  const invested = Number(investment.investedAmount) || 0;
  const current = Number(investment.currentValue) || 0;
  if (invested <= 0) return 0;

  const nowTs = Date.now();
  const totalYears = Math.max(1 / 365, (nowTs - purchaseTs) / (1000 * 60 * 60 * 24 * 365.25));

  // Taxa implícita baseada no valor atual cadastrado
  const impliedAnnualRate = current > 0
    ? (Math.pow(current / invested, 1 / totalYears) - 1)
    : 0;

  const yearsElapsed = (timestamp - purchaseTs) / (1000 * 60 * 60 * 24 * 365.25);

  // Clamps de segurança (evita overflow e valores absurdos)
  const clampedYears = Math.min(Math.max(0, yearsElapsed), 100);
  const clampedRate = Math.min(Math.max(impliedAnnualRate, -0.99), 5); // -99% a.a. até +500% a.a.

  const value = invested * Math.pow(1 + clampedRate, clampedYears);
  if (!Number.isFinite(value) || value < 0) return 0;

  // Nunca ultrapassa o valor atual no "agora" (em timestamps futuros, trava no atual)
  if (timestamp >= nowTs) return current;

  return Math.min(value, current);
}

// Busca histórico via edge function com cache
async function fetchHistoricalFromYahoo(
  symbols: string[],
  market: 'br' | 'usa' | 'crypto',
  range: string
): Promise<HistoricalPrices> {
  if (symbols.length === 0) return {};
  
  const cacheKey = getCacheKey(symbols, market, range);
  const cached = getCachedData(cacheKey);
  
  // Return cached data if valid and not stale
  if (cached && !isCacheStale(cached.timestamp)) {
    console.log(`Using cached historical for ${symbols.length} ${market} symbols`);
    return cached.data;
  }
  
  // If cache is stale but exists, use it while fetching in background
  if (cached) {
    console.log(`Using stale cache for ${symbols.length} ${market} symbols, fetching fresh data...`);
    // Fetch in background without blocking
    fetchAndCacheHistorical(symbols, market, range, cacheKey);
    return cached.data;
  }
  
  // No cache, fetch fresh data
  return await fetchAndCacheHistorical(symbols, market, range, cacheKey);
}

async function fetchAndCacheHistorical(
  symbols: string[],
  market: 'br' | 'usa' | 'crypto',
  range: string,
  cacheKey: string
): Promise<HistoricalPrices> {
  try {
    console.log(`Fetching historical from Yahoo for ${symbols.length} ${market} symbols...`);
    
    const { data, error } = await supabase.functions.invoke('stock-quotes', {
      body: { 
        symbols, 
        market, 
        action: 'historical',
        range
      }
    });
    
    if (error) {
      console.error('Error fetching historical:', error);
      return {};
    }
    
    const history = data?.history || {};
    
    // Cache the result
    if (Object.keys(history).length > 0) {
      setCache(cacheKey, history, range);
    }
    
    return history;
  } catch (e) {
    console.error('Error fetching historical:', e);
    return {};
  }
}

// Interpola preço para um timestamp específico usando histórico real
function getInterpolatedPrice(
  history: Array<{ date: string; price: number }>,
  timestamp: number
): number | null {
  if (!history || history.length === 0) return null;
  
  // Converte todas as datas para timestamps
  const dataPoints = history.map(h => ({
    time: new Date(h.date).getTime(),
    price: h.price
  })).sort((a, b) => a.time - b.time);
  
  // Se timestamp é antes do primeiro ponto, usa o primeiro
  if (timestamp <= dataPoints[0].time) {
    return dataPoints[0].price;
  }
  
  // Se timestamp é depois do último ponto, usa o último
  if (timestamp >= dataPoints[dataPoints.length - 1].time) {
    return dataPoints[dataPoints.length - 1].price;
  }
  
  // Encontra os dois pontos mais próximos e interpola
  for (let i = 0; i < dataPoints.length - 1; i++) {
    if (timestamp >= dataPoints[i].time && timestamp <= dataPoints[i + 1].time) {
      const t1 = dataPoints[i].time;
      const t2 = dataPoints[i + 1].time;
      const p1 = dataPoints[i].price;
      const p2 = dataPoints[i + 1].price;
      
      const progress = (timestamp - t1) / (t2 - t1);
      return p1 + (p2 - p1) * progress;
    }
  }
  
  return dataPoints[dataPoints.length - 1].price;
}

// Calcula valor do investimento usando histórico REAL
// REGRA: Só mostra dados quando temos histórico real - sem simulação!
function calculateValueAtTime(
  investment: Investment,
  timestamp: number,
  historicalPrices: HistoricalPrices,
  usdToBrl: number
): number {
  const purchaseDate = investment.purchaseDate 
    ? new Date(investment.purchaseDate).getTime() 
    : investment.createdAt.getTime();
  
  // Antes da data de compra, valor é 0
  if (timestamp < purchaseDate) return 0;
  
  const isCrypto = investment.category === 'crypto';
  const isUSA = investment.category === 'usastocks' || investment.category === 'reits';
  const isBRStock = investment.category === 'stocks' || investment.category === 'fii';
  const isETF = investment.category === 'etf';
  const isBDR = investment.category === 'bdr';
  const isGold = investment.category === 'gold';
  const isRealEstate = investment.category === 'realestate';
  const isCash = investment.category === 'cash';
  
  // IMÓVEIS: gera evolução composta do valor de compra até o valor atual cadastrado
  // (sem histórico de mercado, mas com crescimento gradual baseado nos dados do usuário)
  if (isRealEstate) {
    return calculateRealEstateAtTime(investment, timestamp);
  }
  
  // CAIXA/STABLECOINS: valor constante (1:1 com a moeda)
  if (isCash) {
    const multiplier = investment.currency === 'USD' ? usdToBrl : 1;
    return investment.currentValue * multiplier;
  }
  
  // OURO: busca histórico real (GC=F)
  if (isGold) {
    const goldHistory = historicalPrices['GC=F'] || historicalPrices['GC'];
    if (goldHistory && goldHistory.length > 0) {
      const pricePerOz = getInterpolatedPrice(goldHistory, timestamp);
      if (pricePerOz !== null) {
        // Converte preço por onça (USD) para preço por grama (BRL)
        // 1 onça troy = 31.1035 gramas
        const pricePerGramBRL = (pricePerOz / 31.1035) * usdToBrl;
        return investment.quantity * pricePerGramBRL;
      }
    }
    // Se não tem histórico, usa valor atual
    return investment.currentValue;
  }
  
  // ATIVOS COM TICKER: busca histórico real
  if (investment.ticker && (isCrypto || isUSA || isBRStock || isETF || isBDR)) {
    const symbol = investment.ticker.toUpperCase().replace('.SA', '').replace('-USD', '');
    const history = historicalPrices[symbol];
    
    if (history && history.length > 0) {
      const price = getInterpolatedPrice(history, timestamp);
      if (price !== null) {
        const multiplier = (isCrypto || isUSA) ? usdToBrl : 1;
        return investment.quantity * price * multiplier;
      }
    }
  }
  
  // FALLBACK para ativos SEM histórico disponível:
  // Retorna o valor atual (linha reta) - melhor do que simular
  // Isso mostra a realidade: só conhecemos o valor atual
  const multiplier = (isCrypto || isUSA) ? usdToBrl : 1;
  return investment.currentValue * multiplier;
}

function useHistoricalData(investments: Investment[], period: string) {
  const { rate: usdToBrl } = useUsdBrlRate();
  const [data, setData] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef('');
  
  // Create stable key for this specific data fetch
  const investmentsKey = investments
    .map(inv => `${inv.id}-${inv.ticker || 'noticker'}`)
    .sort()
    .join('|');
  
  const fetchKey = `${investmentsKey}_${period}_${usdToBrl.toFixed(2)}`;
  
  useEffect(() => {
    // Skip if already fetching or same key
    if (isFetchingRef.current || lastFetchKeyRef.current === fetchKey) {
      return;
    }
    
    if (investments.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    const loadData = async () => {
      isFetchingRef.current = true;
      lastFetchKeyRef.current = fetchKey;
      
      // Only show loading on first load
      if (data.length === 0) {
        setIsLoading(true);
      }
      
      // Find oldest purchase date among all investments
      const oldestPurchaseDate = investments.reduce((oldest, inv) => {
        const purchaseDate = inv.purchaseDate 
          ? new Date(inv.purchaseDate) 
          : inv.createdAt;
        return !oldest || purchaseDate < oldest ? purchaseDate : oldest;
      }, null as Date | null);
      
      const days = getPeriodDays(period, oldestPurchaseDate || undefined);
      const range = getYahooRange(period, days);
      
      console.log(`Chart period: ${period}, days: ${days}, range: ${range}, oldest: ${oldestPurchaseDate?.toISOString()}`);
      
      // Separa investimentos por categoria
      const fixedIncomeCategories = ['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'savings', 'debentures', 'cricra', 'fixedincomefund'];
      const fixedIncomeInvestments = investments.filter(inv => 
        fixedIncomeCategories.includes(inv.category)
      );
      const otherInvestments = investments.filter(inv => 
        !fixedIncomeCategories.includes(inv.category)
      );
      
      // Separa por mercado para buscar histórico REAL
      const cryptoTickers: string[] = [];
      const usaTickers: string[] = [];
      const brTickers: string[] = []; // Ações BR, FIIs, ETFs, BDRs
      let hasGold = false;
      
      for (const inv of otherInvestments) {
        // Ouro - busca histórico de futuros de ouro
        if (inv.category === 'gold') {
          hasGold = true;
          continue;
        }
        
        if (inv.ticker) {
          const ticker = inv.ticker.toUpperCase().replace('.SA', '').replace('-USD', '');
          
          if (inv.category === 'crypto') {
            cryptoTickers.push(ticker);
          } else if (inv.category === 'usastocks' || inv.category === 'reits') {
            usaTickers.push(ticker);
          } else if (
            inv.category === 'stocks' || 
            inv.category === 'fii' ||
            inv.category === 'etf' ||
            inv.category === 'bdr'
          ) {
            // Todos esses usam sufixo .SA
            brTickers.push(ticker);
          }
        }
      }
      
      // Busca histórico em paralelo (com cache)
      // Ouro usa símbolo GC=F (futuros de ouro COMEX em USD)
      const [cryptoHistory, usaHistory, brHistory, goldHistory] = await Promise.all([
        cryptoTickers.length > 0 ? fetchHistoricalFromYahoo(cryptoTickers, 'crypto', range) : {},
        usaTickers.length > 0 ? fetchHistoricalFromYahoo(usaTickers, 'usa', range) : {},
        brTickers.length > 0 ? fetchHistoricalFromYahoo(brTickers, 'br', range) : {},
        hasGold ? fetchHistoricalFromYahoo(['GC=F'], 'usa', range) : {}
      ]);
      
      const allHistory: HistoricalPrices = { 
        ...cryptoHistory, 
        ...usaHistory, 
        ...brHistory,
        ...goldHistory 
      };
      
      console.log(`Loaded historical for ${Object.keys(allHistory).length} symbols`);
      
      // Gera timestamps para o gráfico - mais pontos para períodos maiores
      const numPoints = days <= 1 ? 24 : days <= 7 ? 14 : days <= 30 ? 30 : days <= 180 ? 30 : days <= 365 ? 52 : Math.min(100, Math.ceil(days / 7));
      const now = Date.now();
      const startTime = now - days * 24 * 60 * 60 * 1000;
      const interval = (now - startTime) / (numPoints - 1);
      
      const timestamps: number[] = [];
      for (let i = 0; i < numPoints; i++) {
        timestamps.push(startTime + i * interval);
      }
      
      // Constrói dados do gráfico
      const chartData: PriceHistory[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        let portfolioValue = 0;

        // 1. Renda fixa - calcula rendimento real baseado na taxa
        for (const inv of fixedIncomeInvestments) {
          portfolioValue += calculateFixedIncomeAtTime(inv, timestamp);
        }

        // 2. Outros investimentos - usa histórico real quando disponível
        for (const inv of otherInvestments) {
          portfolioValue += calculateValueAtTime(inv, timestamp, allHistory, usdToBrl);
        }

        // Formata data
        const date = new Date(timestamp);
        let dateStr: string;
        if (days <= 1) {
          dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (days <= 7) {
          dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        } else if (days <= 30) {
          dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
          dateStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        }

        // Garante que nunca tenha valor negativo - mínimo é 0
        // Inclui timestamp para o tooltip calcular "investido até a data" corretamente
        chartData.push({ date: dateStr, value: Math.max(0, portfolioValue), ts: timestamp } as any);
      }
      
      // Garante que o último ponto tenha o valor atual correto
      const totalCurrentValue = investments.reduce((sum, inv) => {
        const isCrypto = inv.category === 'crypto';
        const isUSA = inv.category === 'usastocks' || inv.category === 'reits';
        const value = (isCrypto || isUSA) ? inv.currentValue * usdToBrl : inv.currentValue;
        return sum + value;
      }, 0);
      
      if (chartData.length > 0) {
        chartData[chartData.length - 1] = { 
          date: 'Agora', 
          value: totalCurrentValue,
          ts: now
        } as any;
      }
      
      setData(chartData);
      setIsLoading(false);
      isFetchingRef.current = false;
    };
    
    loadData();
  }, [fetchKey, investments, period, usdToBrl, data.length]);
  
  return { data, isLoading };
}

export function PerformanceChart({ investments, period }: PerformanceChartProps) {
  const { data, isLoading } = useHistoricalData(investments, period);
  const { rate: usdToBrl } = useUsdBrlRate();
  
  // Calcula o total investido (para comparar lucro/prejuízo real)
  const totalInvested = investments.reduce((sum, inv) => {
    const isCrypto = inv.category === 'crypto';
    const isUSA = inv.category === 'usastocks' || inv.category === 'reits';
    const value = (isCrypto || isUSA) ? inv.investedAmount * usdToBrl : inv.investedAmount;
    return sum + value;
  }, 0);
  
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Carregando histórico...</span>
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Adicione investimentos para ver o gráfico de patrimônio
      </div>
    );
  }

  const lastValue = data[data.length - 1]?.value || 0;
  // Cor baseada em lucro/prejuízo REAL (valor atual vs valor investido)
  const isPositive = lastValue >= totalInvested;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number;
      const ts: number | undefined = payload[0]?.payload?.ts;

      // Quando ainda não existia nada (nenhuma compra até essa data),
      // o correto é mostrar 0 e 0% — nunca -100%.
      const investedUpToTime = typeof ts === 'number'
        ? investments.reduce((sum, inv) => {
            const purchaseTs = inv.purchaseDate
              ? new Date(inv.purchaseDate).getTime()
              : inv.createdAt.getTime();

            if (purchaseTs > ts) return sum;

            const isCrypto = inv.category === 'crypto';
            const isUSA = inv.category === 'usastocks' || inv.category === 'reits';
            const invested = (isCrypto || isUSA) ? inv.investedAmount * usdToBrl : inv.investedAmount;
            return sum + invested;
          }, 0)
        : totalInvested;

      const change = investedUpToTime > 0 ? (value - investedUpToTime) : 0;
      const changePercent = investedUpToTime > 0 ? ((change / investedUpToTime) * 100) : 0;
      const changeIsPositive = change >= 0;

      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-muted-foreground text-sm mb-1">{label}</p>
          <p className="text-primary font-mono font-semibold text-lg">
            {formatCurrency(value)}
          </p>
          <p className={`text-sm font-mono ${changeIsPositive ? 'text-success' : 'text-destructive'}`}>
            {changeIsPositive ? '+' : ''}{formatCurrency(change)} ({changeIsPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Domínio do Y (escala) para evitar "zoom" que exagera pequenas variações.
  // Se o patrimônio é ~R$300k e variou R$20k, isso deve parecer uma variação pequena.
  // Por isso, usamos escala absoluta a partir de 0 (sem simulação; apenas escala).
  const values = data.map(d => d.value).filter(v => Number.isFinite(v) && v >= 0);
  const maxValue = Math.max(...values, 0);

  // Padding pequeno só para não cortar o topo
  const paddingTop = maxValue * 0.02;

  // Escala absoluta: não "amplifica" variações pequenas
  const yDomain: [number, number] = [0, maxValue + paddingTop];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={65}
          domain={yDomain}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={lineColor} 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorValue)"
          animationDuration={2000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}