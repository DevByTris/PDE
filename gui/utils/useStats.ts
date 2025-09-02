/**
 * Custom hook for PDE dashboard statistics
 * Fetches real statistics from the backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { pdeApi, handleApiError } from './apiClient.ts';

interface PDEStats {
  total: number;
  running: number;
  personal: number;
  professional: number;
  development: number;
  production: number;
  inactive: number;
  archived: number;
  lastUpdated?: Date;
}

interface UseStatsReturn {
  stats: PDEStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<PDEStats>({
    total: 0,
    running: 0,
    personal: 0,
    professional: 0,
    development: 0,
    production: 0,
    inactive: 0,
    archived: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('PDE Frontend: Fetching statistics from API...');
      
      const fetchedStats = await pdeApi.getStats();
      
      setStats({
        ...fetchedStats,
        lastUpdated: new Date()
      });
      
      console.log('PDE Frontend: Statistics updated:', fetchedStats);
      
    } catch (err) {
      console.error('PDE Frontend: Failed to fetch statistics:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
}