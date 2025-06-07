
import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

const cache = new Map<string, CacheEntry<any>>();

export const useDataCache = <T,>(
  key: string,
  fetcher: () => T | Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes par défaut
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCachedData = useCallback((): T | null => {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expires) {
      return entry.data;
    }
    return null;
  }, [key]);

  const setCachedData = useCallback((data: T) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }, [key, ttl]);

  const fetchData = useCallback(async () => {
    // Vérifier le cache d'abord
    const cachedData = getCachedData();
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Promise.resolve(fetcher());
      setData(result);
      setCachedData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, getCachedData, setCachedData]);

  const invalidateCache = useCallback(() => {
    cache.delete(key);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidateCache
  };
};
