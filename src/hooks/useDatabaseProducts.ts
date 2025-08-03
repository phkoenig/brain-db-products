import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/products';

export function useDatabaseProducts(selectedCategory?: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products with optional category filter
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply category filter if selected
      if (selectedCategory) {
        query = query.contains('produkt_kategorie', [selectedCategory]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load products when component mounts or category changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  return {
    products,
    loading,
    error,
    fetchProducts,
  };
} 