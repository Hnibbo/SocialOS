import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/social-os';
import { toast } from 'sonner';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;

      setProducts(data as Product[]);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(product => product.category)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (id: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return data as Product;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  };

  const searchProducts = async (query: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%,tags.cs.{${query}}`);

      if (error) throw error;
      
      return data as Product[];
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  };

  const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .eq('category', category);

      if (error) throw error;
      
      return data as Product[];
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      return [];
    }
  };

  return {
    products,
    loading,
    categories,
    fetchProducts,
    fetchProductById,
    searchProducts,
    fetchProductsByCategory,
  };
}
