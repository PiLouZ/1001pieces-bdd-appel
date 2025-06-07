
// Utilitaires d'optimisation des performances

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

export const memoizeExpensive = <T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize: number = 50
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    
    // Nettoyer le cache si trop grand
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  }) as T;
};

export const batchOperations = <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => void,
  delay: number = 0
): void => {
  let index = 0;
  
  const processBatch = () => {
    const batch = items.slice(index, index + batchSize);
    if (batch.length > 0) {
      processor(batch);
      index += batchSize;
      
      if (index < items.length) {
        setTimeout(processBatch, delay);
      }
    }
  };
  
  processBatch();
};

// Service Worker pour mise en cache
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker enregistré:', registration);
      })
      .catch((error) => {
        console.log('Erreur Service Worker:', error);
      });
  }
};
