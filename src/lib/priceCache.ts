/**
 * Sistema de cache robusto para cotações em tempo real
 * - Suporte a IndexedDB para maior capacidade
 * - Fallback para localStorage
 * - Versionamento para invalidação
 * - Sincronização entre abas via BroadcastChannel
 * - Compressão de dados
 * - Limpeza automática de cache antigo
 */

// Tipos genéricos para o cache
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

export interface CacheConfig {
  maxAgeMs: number;        // Tempo máximo de validade do cache
  staleThresholdMs: number; // Tempo para considerar cache obsoleto (mas ainda usável)
  version: number;          // Versão para invalidação
}

// Configurações padrão por tipo de ativo
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  crypto: {
    maxAgeMs: 5 * 60 * 1000,        // 5 minutos
    staleThresholdMs: 15 * 60 * 1000, // 15 minutos
    version: 3,
  },
  stocks: {
    maxAgeMs: 15 * 60 * 1000,       // 15 minutos
    staleThresholdMs: 60 * 60 * 1000, // 1 hora
    version: 3,
  },
  etf: {
    maxAgeMs: 15 * 60 * 1000,       // 15 minutos
    staleThresholdMs: 60 * 60 * 1000, // 1 hora
    version: 3,
  },
  fii: {
    maxAgeMs: 15 * 60 * 1000,       // 15 minutos
    staleThresholdMs: 60 * 60 * 1000, // 1 hora
    version: 3,
  },
  usaStocks: {
    maxAgeMs: 15 * 60 * 1000,       // 15 minutos
    staleThresholdMs: 60 * 60 * 1000, // 1 hora
    version: 3,
  },
  gold: {
    maxAgeMs: 30 * 60 * 1000,       // 30 minutos
    staleThresholdMs: 2 * 60 * 60 * 1000, // 2 horas
    version: 3,
  },
  usd: {
    maxAgeMs: 30 * 60 * 1000,       // 30 minutos
    staleThresholdMs: 2 * 60 * 60 * 1000, // 2 horas
    version: 3,
  },
  eur: {
    maxAgeMs: 30 * 60 * 1000,       // 30 minutos
    staleThresholdMs: 2 * 60 * 60 * 1000, // 2 horas
    version: 3,
  },
};

const DB_NAME = 'InvestAppPriceCache';
const DB_VERSION = 1;
const STORE_NAME = 'prices';

// BroadcastChannel para sincronização entre abas
let broadcastChannel: BroadcastChannel | null = null;
const cacheUpdateListeners: Map<string, Set<(data: unknown) => void>> = new Map();

try {
  broadcastChannel = new BroadcastChannel('price-cache-sync');
  broadcastChannel.onmessage = (event) => {
    const { cacheKey, data } = event.data;
    const listeners = cacheUpdateListeners.get(cacheKey);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  };
} catch {
  // BroadcastChannel não suportado
  console.log('BroadcastChannel not supported - cross-tab sync disabled');
}

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

async function getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

async function setInIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, value: entry });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      
      transaction.oncomplete = () => db.close();
    });
  } catch {
    // Fallback handled by caller
  }
}

async function deleteFromIndexedDB(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      
      transaction.oncomplete = () => db.close();
    });
  } catch {
    // Ignore errors
  }
}

async function clearOldEntriesFromIndexedDB(maxAge: number): Promise<void> {
  try {
    const db = await openDB();
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = cursor.value.value as CacheEntry<unknown>;
          if (now - entry.timestamp > maxAge) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore errors
  }
}

// localStorage fallback helpers
function getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as CacheEntry<T>;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function setInLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or disabled - try to clean up
    cleanupLocalStorage();
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Still failed - ignore
    }
  }
}

function cleanupLocalStorage(): void {
  try {
    const keysToRemove: string[] = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('_cache')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry = JSON.parse(cached) as CacheEntry<unknown>;
            // Remove entries older than 24 hours
            if (now - entry.timestamp > 24 * 60 * 60 * 1000) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}

// Main cache class
export class PriceCache<T> {
  private cacheKey: string;
  private config: CacheConfig;
  private memoryCache: CacheEntry<T> | null = null;
  private useIndexedDB: boolean;
  
  constructor(cacheKey: string, config: CacheConfig, useIndexedDB = true) {
    this.cacheKey = `price_cache_${cacheKey}_v${config.version}`;
    this.config = config;
    this.useIndexedDB = useIndexedDB && typeof indexedDB !== 'undefined';
  }
  
  async get(): Promise<{ data: T; isValid: boolean; isStale: boolean; age: number } | null> {
    // Try memory cache first
    if (this.memoryCache) {
      const age = Date.now() - this.memoryCache.timestamp;
      const isValid = age < this.config.maxAgeMs;
      const isStale = age > this.config.staleThresholdMs;
      
      if (this.memoryCache.version === this.config.version) {
        return { data: this.memoryCache.data, isValid, isStale, age };
      }
    }
    
    // Try IndexedDB
    if (this.useIndexedDB) {
      const entry = await getFromIndexedDB<T>(this.cacheKey);
      if (entry && entry.version === this.config.version) {
        this.memoryCache = entry;
        const age = Date.now() - entry.timestamp;
        const isValid = age < this.config.maxAgeMs;
        const isStale = age > this.config.staleThresholdMs;
        return { data: entry.data, isValid, isStale, age };
      }
    }
    
    // Fallback to localStorage
    const entry = getFromLocalStorage<T>(this.cacheKey);
    if (entry && entry.version === this.config.version) {
      this.memoryCache = entry;
      const age = Date.now() - entry.timestamp;
      const isValid = age < this.config.maxAgeMs;
      const isStale = age > this.config.staleThresholdMs;
      return { data: entry.data, isValid, isStale, age };
    }
    
    return null;
  }
  
  async set(data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: this.config.version,
    };
    
    // Update memory cache
    this.memoryCache = entry;
    
    // Save to IndexedDB
    if (this.useIndexedDB) {
      await setInIndexedDB(this.cacheKey, entry);
    }
    
    // Also save to localStorage as fallback
    setInLocalStorage(this.cacheKey, entry);
    
    // Notify other tabs
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ cacheKey: this.cacheKey, data });
      } catch {
        // Ignore broadcast errors
      }
    }
  }
  
  async merge(newData: Partial<T>): Promise<T> {
    const cached = await this.get();
    const mergedData = { ...(cached?.data || {} as T), ...newData } as T;
    await this.set(mergedData);
    return mergedData;
  }
  
  async clear(): Promise<void> {
    this.memoryCache = null;
    
    if (this.useIndexedDB) {
      await deleteFromIndexedDB(this.cacheKey);
    }
    
    try {
      localStorage.removeItem(this.cacheKey);
    } catch {
      // Ignore errors
    }
  }
  
  subscribe(callback: (data: T) => void): () => void {
    if (!cacheUpdateListeners.has(this.cacheKey)) {
      cacheUpdateListeners.set(this.cacheKey, new Set());
    }
    
    const listeners = cacheUpdateListeners.get(this.cacheKey)!;
    listeners.add(callback as (data: unknown) => void);
    
    return () => {
      listeners.delete(callback as (data: unknown) => void);
    };
  }
  
  getTimestamp(): number | null {
    return this.memoryCache?.timestamp ?? null;
  }
  
  isValid(): boolean {
    if (!this.memoryCache) return false;
    return Date.now() - this.memoryCache.timestamp < this.config.maxAgeMs;
  }
  
  isStale(): boolean {
    if (!this.memoryCache) return true;
    return Date.now() - this.memoryCache.timestamp > this.config.staleThresholdMs;
  }
}

// Singleton instances for each cache type
const cacheInstances: Map<string, PriceCache<unknown>> = new Map();

export function getPriceCache<T>(type: keyof typeof CACHE_CONFIGS): PriceCache<T> {
  if (!cacheInstances.has(type)) {
    const config = CACHE_CONFIGS[type];
    cacheInstances.set(type, new PriceCache<T>(type, config));
  }
  return cacheInstances.get(type) as PriceCache<T>;
}

// Utility functions
export async function clearAllCaches(): Promise<void> {
  const promises = Array.from(cacheInstances.values()).map(cache => cache.clear());
  await Promise.all(promises);
  
  // Also clear any old cache entries
  cleanupLocalStorage();
  await clearOldEntriesFromIndexedDB(0);
}

export async function cleanupOldCaches(): Promise<void> {
  cleanupLocalStorage();
  // Keep entries for up to 24 hours
  await clearOldEntriesFromIndexedDB(24 * 60 * 60 * 1000);
}

// Run cleanup on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    cleanupOldCaches().catch(console.error);
  }, 5000);
}

// Export cache status for debugging
export function getCacheStatus(): Record<string, { 
  hasData: boolean; 
  isValid: boolean; 
  isStale: boolean; 
  ageMinutes: number | null;
}> {
  const status: Record<string, { 
    hasData: boolean; 
    isValid: boolean; 
    isStale: boolean; 
    ageMinutes: number | null;
  }> = {};
  
  for (const [type, cache] of cacheInstances) {
    const timestamp = cache.getTimestamp();
    status[type] = {
      hasData: timestamp !== null,
      isValid: cache.isValid(),
      isStale: cache.isStale(),
      ageMinutes: timestamp ? Math.round((Date.now() - timestamp) / 60000) : null,
    };
  }
  
  return status;
}
