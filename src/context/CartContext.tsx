import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Service } from '../lib/types';

export interface CartItem {
  service: Service;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; service: Service }
  | { type: 'REMOVE_ITEM'; serviceId: number }
  | { type: 'UPDATE_QUANTITY'; serviceId: number; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] };

const MAX_QTY = 5;

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.service.id === action.service.id);
      if (existing) {
        if (existing.quantity >= MAX_QTY) return state;
        return {
          items: state.items.map(i =>
            i.service.id === action.service.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { service: action.service, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter(i => i.service.id !== action.serviceId) };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0)
        return { items: state.items.filter(i => i.service.id !== action.serviceId) };
      if (action.quantity > MAX_QTY) return state;
      return {
        items: state.items.map(i =>
          i.service.id === action.serviceId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    case 'LOAD':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addItem: (service: Service) => void;
  removeItem: (serviceId: number) => void;
  updateQuantity: (serviceId: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('glamour-cart');
      if (saved) dispatch({ type: 'LOAD', items: JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('glamour-cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalAmount = state.items.reduce((s, i) => s + i.service.price * i.quantity, 0);
  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem: (service) => dispatch({ type: 'ADD_ITEM', service }),
        removeItem: (serviceId) => dispatch({ type: 'REMOVE_ITEM', serviceId }),
        updateQuantity: (serviceId, quantity) =>
          dispatch({ type: 'UPDATE_QUANTITY', serviceId, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
