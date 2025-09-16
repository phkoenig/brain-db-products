"use client";

import { useState, useEffect } from 'react';

interface F16Status {
  status: string;
  project: string;
  portal: string;
  version: string;
  features: string[];
}

export function useF16() {
  const [status, setStatus] = useState<F16Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/zepta/f16/status');
        if (!response.ok) {
          throw new Error('Failed to fetch F16 status');
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return {
    status,
    loading,
    error
  };
}
