import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, Product } from '@/types/social-os';
import { toast } from 'sonner';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems(data as CartItem[]);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setIsAdding(productId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to add items to cart');
        return;
      }

      // Check if item already exists
      const existingItem = cartItems.find(item => item.product_id === productId);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: quantity,
          });

        if (error) throw error;
      }

      toast.success('Item added to cart');
      await fetchCartItems();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAdding(null);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.discount_price || item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  return {
    cartItems,
    loading,
    isAdding,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };
}
