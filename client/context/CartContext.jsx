"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCart({ items: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await api.getCart(token);
      setCart(data);
    } catch (err) {
      console.error("Failed to load cart:", err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId, quantity = 1, variant) => {
    const data = await api.addToCart({ productId, quantity, variant }, token);
    setCart(data);
  };

  const updateItem = async (productId, quantity) => {
    const data = await api.updateCartItem(productId, quantity, token);
    setCart(data);
  };

  const removeItem = async (productId) => {
    await api.removeFromCart(productId, token);
    await refreshCart();
  };

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, addItem, updateItem, removeItem, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
