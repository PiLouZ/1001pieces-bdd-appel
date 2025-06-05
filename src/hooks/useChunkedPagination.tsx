
import { useState, useMemo, useCallback } from 'react';

interface UseChunkedPaginationProps<T> {
  data: T[];
  itemsPerPage: number;
  chunkSize: number;
}

export const useChunkedPagination = <T,>({ 
  data, 
  itemsPerPage, 
  chunkSize 
}: UseChunkedPaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedChunks, setLoadedChunks] = useState(new Set([1]));

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const currentChunk = Math.ceil(currentPage / chunkSize);
  const totalChunks = Math.ceil(totalPages / chunkSize);

  // Charger un chunk spécifique
  const loadChunk = useCallback((chunkNumber: number) => {
    setLoadedChunks(prev => new Set([...prev, chunkNumber]));
  }, []);

  // Données actuellement visibles
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Pages disponibles (chunks chargés)
  const availablePages = useMemo(() => {
    const pages: number[] = [];
    loadedChunks.forEach(chunk => {
      const startPage = (chunk - 1) * chunkSize + 1;
      const endPage = Math.min(chunk * chunkSize, totalPages);
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    });
    return pages.sort((a, b) => a - b);
  }, [loadedChunks, chunkSize, totalPages]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      const requiredChunk = Math.ceil(page / chunkSize);
      
      // Charger le chunk si nécessaire
      if (!loadedChunks.has(requiredChunk)) {
        loadChunk(requiredChunk);
      }
      
      setCurrentPage(page);
    }
  }, [totalPages, chunkSize, loadedChunks, loadChunk]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Précharger les chunks adjacents
  const preloadAdjacentChunks = useCallback(() => {
    if (currentChunk > 1 && !loadedChunks.has(currentChunk - 1)) {
      loadChunk(currentChunk - 1);
    }
    if (currentChunk < totalChunks && !loadedChunks.has(currentChunk + 1)) {
      loadChunk(currentChunk + 1);
    }
  }, [currentChunk, totalChunks, loadedChunks, loadChunk]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setLoadedChunks(new Set([1]));
  }, []);

  return {
    currentData,
    currentPage,
    totalPages,
    totalItems: data.length,
    itemsPerPage,
    availablePages,
    loadedChunks,
    currentChunk,
    totalChunks,
    goToPage,
    nextPage,
    prevPage,
    loadChunk,
    preloadAdjacentChunks,
    reset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};
