import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    const res = await api.get('/cart');
    setItems(res.data.items);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
