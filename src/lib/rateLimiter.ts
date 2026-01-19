/**
 * Rate Limiter para proteger contra excesso de chamadas à APIs externas
 * Implementa: throttling, queue de requisições, retry com backoff
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retries: number;
  priority: number;
}

interface RateLimiterConfig {
  maxConcurrent: number;      // Máximo de requisições simultâneas
  minInterval: number;        // Intervalo mínimo entre requisições (ms)
  maxRetries: number;         // Máximo de tentativas por requisição
  retryDelay: number;         // Delay base para retry (ms)
  maxQueueSize: number;       // Tamanho máximo da fila
  timeout: number;            // Timeout por requisição (ms)
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxConcurrent: 3,           // Yahoo Finance tolera ~3 simultâneas
  minInterval: 350,           // ~3 req/seg para evitar bloqueio
  maxRetries: 3,
  retryDelay: 1000,
  maxQueueSize: 100,
  timeout: 15000,
};

class RateLimiter {
  private config: RateLimiterConfig;
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private lastRequestTime = 0;
  private isProcessing = false;
  private requestCount = 0;
  private errorCount = 0;
  private lastErrorTime = 0;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Adiciona uma requisição à fila com rate limiting
   */
  async execute<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Rate limiter queue full'));
        return;
      }

      const request: QueuedRequest<T> = {
        execute: fn,
        resolve,
        reject,
        retries: 0,
        priority,
      };

      // Inserir por prioridade (maior prioridade primeiro)
      const insertIndex = this.queue.findIndex(r => r.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIndex, 0, request);
      }

      this.processQueue();
    });
  }

  /**
   * Processa a fila de requisições respeitando os limites
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      // Verificar se está em período de backoff por muitos erros
      if (this.shouldBackoff()) {
        const backoffTime = this.getBackoffTime();
        console.log(`[RateLimiter] Backoff por ${backoffTime}ms devido a erros`);
        await this.delay(backoffTime);
      }

      // Aguardar slot disponível
      while (this.activeRequests >= this.config.maxConcurrent) {
        await this.delay(50);
      }

      // Respeitar intervalo mínimo entre requisições
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.minInterval) {
        await this.delay(this.config.minInterval - timeSinceLastRequest);
      }

      const request = this.queue.shift();
      if (!request) continue;

      this.activeRequests++;
      this.lastRequestTime = Date.now();
      this.requestCount++;

      this.executeRequest(request);
    }

    this.isProcessing = false;
  }

  /**
   * Executa uma requisição individual com timeout e retry
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    try {
      const result = await this.withTimeout(
        request.execute(),
        this.config.timeout
      );
      
      // Sucesso - resetar contagem de erros
      this.errorCount = Math.max(0, this.errorCount - 1);
      request.resolve(result);
    } catch (error) {
      this.errorCount++;
      this.lastErrorTime = Date.now();

      const isRateLimitError = this.isRateLimitError(error);
      
      if (request.retries < this.config.maxRetries) {
        // Retry com backoff exponencial
        const retryDelay = this.config.retryDelay * Math.pow(2, request.retries);
        const extraDelay = isRateLimitError ? 2000 : 0; // Extra delay para rate limit
        
        console.log(
          `[RateLimiter] Retry ${request.retries + 1}/${this.config.maxRetries} em ${retryDelay + extraDelay}ms`
        );
        
        await this.delay(retryDelay + extraDelay);
        
        request.retries++;
        
        // Re-adicionar à fila com prioridade reduzida
        this.queue.push({ ...request, priority: request.priority - 1 });
        this.processQueue();
      } else {
        console.error('[RateLimiter] Max retries exceeded:', error);
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Adiciona timeout a uma promise
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
      ),
    ]);
  }

  /**
   * Verifica se o erro é relacionado a rate limiting
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('blocked') ||
        message.includes('throttle')
      );
    }
    return false;
  }

  /**
   * Verifica se deve aplicar backoff por excesso de erros
   */
  private shouldBackoff(): boolean {
    // Se mais de 5 erros nos últimos 30 segundos
    const recentErrors = this.errorCount > 5;
    const recentTime = Date.now() - this.lastErrorTime < 30000;
    return recentErrors && recentTime;
  }

  /**
   * Calcula tempo de backoff baseado em erros
   */
  private getBackoffTime(): number {
    // Backoff exponencial baseado no número de erros
    return Math.min(this.errorCount * 1000, 10000);
  }

  /**
   * Utility para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna estatísticas do rate limiter
   */
  getStats(): {
    queueSize: number;
    activeRequests: number;
    totalRequests: number;
    errorCount: number;
    isBackingOff: boolean;
  } {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests,
      totalRequests: this.requestCount,
      errorCount: this.errorCount,
      isBackingOff: this.shouldBackoff(),
    };
  }

  /**
   * Limpa a fila de requisições
   */
  clear(): void {
    const pending = this.queue.splice(0);
    pending.forEach(req => req.reject(new Error('Queue cleared')));
  }

  /**
   * Reseta as estatísticas
   */
  reset(): void {
    this.errorCount = 0;
    this.requestCount = 0;
    this.lastErrorTime = 0;
  }
}

// Instâncias singleton para diferentes APIs
const rateLimiters: Record<string, RateLimiter> = {};

/**
 * Obtém ou cria um rate limiter para uma API específica
 */
export function getRateLimiter(
  apiName: string,
  config?: Partial<RateLimiterConfig>
): RateLimiter {
  if (!rateLimiters[apiName]) {
    rateLimiters[apiName] = new RateLimiter(config);
  }
  return rateLimiters[apiName];
}

// Configurações pré-definidas para APIs conhecidas
export const API_CONFIGS = {
  yahooFinance: {
    maxConcurrent: 2,        // Yahoo é sensível a concurrent requests
    minInterval: 500,        // 2 req/seg max
    maxRetries: 3,
    retryDelay: 2000,
    maxQueueSize: 50,
    timeout: 20000,
  },
  coingecko: {
    maxConcurrent: 5,        // CoinGecko é mais tolerante
    minInterval: 200,        // 5 req/seg
    maxRetries: 2,
    retryDelay: 1000,
    maxQueueSize: 100,
    timeout: 15000,
  },
  bcb: {
    maxConcurrent: 3,        // Banco Central do Brasil
    minInterval: 300,
    maxRetries: 2,
    retryDelay: 1000,
    maxQueueSize: 30,
    timeout: 10000,
  },
  exchangeRate: {
    maxConcurrent: 2,
    minInterval: 500,
    maxRetries: 2,
    retryDelay: 1000,
    maxQueueSize: 20,
    timeout: 10000,
  },
} as const;

// Rate limiters pré-configurados
export const yahooRateLimiter = getRateLimiter('yahoo', API_CONFIGS.yahooFinance);
export const coingeckoRateLimiter = getRateLimiter('coingecko', API_CONFIGS.coingecko);
export const bcbRateLimiter = getRateLimiter('bcb', API_CONFIGS.bcb);
export const exchangeRateLimiter = getRateLimiter('exchangeRate', API_CONFIGS.exchangeRate);

/**
 * Obtém estatísticas de todos os rate limiters
 */
export function getAllRateLimiterStats(): Record<string, ReturnType<RateLimiter['getStats']>> {
  const stats: Record<string, ReturnType<RateLimiter['getStats']>> = {};
  for (const [name, limiter] of Object.entries(rateLimiters)) {
    stats[name] = limiter.getStats();
  }
  return stats;
}

/**
 * Limpa todos os rate limiters
 */
export function clearAllRateLimiters(): void {
  Object.values(rateLimiters).forEach(limiter => limiter.clear());
}

export { RateLimiter };
export type { RateLimiterConfig };
