import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 1. Update Interface to include substitution preference
interface CartItem {
  id: string; // Product ID
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  substitution: 'REFUND' | 'REPLACE';
}

// Helper type for adding items (quantity & substitution are handled internally)
type Product = Omit<CartItem, 'quantity' | 'substitution'>;

// Define the shape of the Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateSubstitution: (productId: string, policy: 'REFUND' | 'REPLACE') => void;
  clearCart: () => void;
  addItems: (products: Product[]) => void;
  itemCount: number;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to load cart from localStorage
const loadCart = (): CartItem[] => {
  try {
    const storedCart = localStorage.getItem('quickcart_cart');
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (err) {
    console.error("Failed to parse cart from localStorage", err);
    return [];
  }
};

// Create the Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCart);

  // Effect to save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quickcart_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // If item exists, just increment quantity
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If new item, add to cart with quantity 1 and default substitution
        return [...prevItems, { ...product, quantity: 1, substitution: 'REFUND' }];
      }
    });
  };

  // Bulk Add Function (For Reorder)
  const addItems = (products: Product[]) => {
    setCartItems((prevItems) => {
      const newCart = [...prevItems];

      products.forEach((product) => {
        const existingItemIndex = newCart.findIndex((item) => item.id === product.id);
        
        if (existingItemIndex > -1) {
          // Increment quantity if it already exists
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + 1
          };
        } else {
          // Add new item with quantity 1 and default substitution
          newCart.push({ ...product, quantity: 1, substitution: 'REFUND' });
        }
      });

      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const updateSubstitution = (productId: string, policy: 'REFUND' | 'REPLACE') => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, substitution: policy } : item
      )
    );
  };

  // --- FIX APPLIED HERE ---
  const clearCart = () => {
    setCartItems([]);
    // We explicitly remove ONLY the cart key. 
    // IMPORTANT: Do NOT use localStorage.clear() here, or it will delete auth tokens.
    localStorage.removeItem('quickcart_cart');
  };
  // -----------------------

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSubstitution,
        clearCart,
        addItems,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Create the custom hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};