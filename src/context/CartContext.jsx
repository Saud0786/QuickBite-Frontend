import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { cartApi } from '../api/cart.api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);       // full cart object from backend
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Derived helpers
  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const total = cart?.totalPrice ?? 0;

  // ── Fetch cart on user login ──────────────────────────────────────────────
  useEffect(() => {
    if (user?.userId) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const fetchCart = useCallback(async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const res = await cartApi.getCart(user.userId);
      setCart(res.data ?? null);
    } catch (err) {
      // 404 means no cart yet — that's fine
      if (err?.response?.status !== 404) {
        console.error('Failed to fetch cart', err);
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Add item ──────────────────────────────────────────────────────────────
  const addItem = async (restaurantId, item, quantity = 1, customization = '') => {
    if (!user?.userId) {
      toast.error('Please sign in to add items to cart.');
      return false;
    }

    // If cart exists and belongs to a different restaurant, switch automatically.
    if (cart && cart.restaurantId && cart.restaurantId !== restaurantId && cart.items?.length > 0) {
      try {
        const res = await cartApi.changeRestaurant(user.userId, restaurantId);
        setCart(res.data);
        toast('Cart switched to the selected restaurant.', { icon: '🛒' });
      } catch (err) {
        toast.error('Failed to switch restaurant.');
        return false;
      }
    }

    try {
      const res = await cartApi.addItem(user.userId, {
        restaurantId,
        menuItemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity,
        customization,
      });
      setCart(res.data);
      toast.success(`${item.name} added to cart!`);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to add item.';
      toast.error(msg);
      return false;
    }
  };

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItem = async (menuItemId, itemName) => {
    if (!user?.userId) return;
    try {
      const res = await cartApi.removeItem(user.userId, menuItemId);
      setCart(res.data);
      toast.success(`${itemName || 'Item'} removed.`);
    } catch (err) {
      toast.error('Failed to remove item.');
    }
  };

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateQuantity = async (menuItemId, quantity) => {
    if (!user?.userId) return;
    try {
      const res = await cartApi.updateQuantity(user.userId, menuItemId, quantity);
      setCart(res.data);
    } catch (err) {
      toast.error('Failed to update quantity.');
    }
  };

  // ── Clear cart ────────────────────────────────────────────────────────────
  const clearCart = async () => {
    if (!user?.userId) return;
    try {
      await cartApi.clearCart(user.userId);
      setCart(null);
      toast.success('Cart cleared.');
    } catch (err) {
      toast.error('Failed to clear cart.');
    }
  };

  // ── Apply promo ───────────────────────────────────────────────────────────
  const applyPromo = async (promoCode) => {
    if (!user?.userId) return false;
    try {
      const res = await cartApi.applyPromo(user.userId, promoCode);
      setCart(res.data);
      toast.success('Promo code applied! 🎉');
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid promo code.';
      toast.error(msg);
      return false;
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getItemQuantity = (menuItemId) => {
    return cart?.items?.find(i => i.menuItemId === menuItemId)?.quantity ?? 0;
  };

  const isInCart = (menuItemId) => getItemQuantity(menuItemId) > 0;

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      cartOpen,
      setCartOpen,
      itemCount,
      total,
      fetchCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      applyPromo,
      getItemQuantity,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
