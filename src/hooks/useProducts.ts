import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, ProductFormData } from '@/types/products';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Create new product
  const createProduct = async (productData: Partial<Product>) => {
    setLoading(true);
    setError(null);
    
    console.log('🔧 createProduct: Starte...', productData);
    console.log('🔧 createProduct: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔧 createProduct: Supabase Key vorhanden:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    try {
      // Prüfe ob Supabase-Client verfügbar ist
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ createProduct: Supabase error:', error);
        console.error('❌ createProduct: Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ createProduct: Erfolgreich erstellt:', data);
      
      // Add to local state
      setProducts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ createProduct: Exception:', err);
      console.error('❌ createProduct: Exception details:', JSON.stringify(err, null, 2));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === id ? data : product
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local state
      setProducts(prev => prev.filter(product => product.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get single product by ID
  const getProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const searchProducts = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`product_name.ilike.%${query}%,manufacturer.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    searchProducts,
  };
} 