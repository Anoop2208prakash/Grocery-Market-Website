import { createContext, useContext, useState, type ReactNode} from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string; // We need description for the modal
  imageUrl?: string;
  totalStock?: number; // Helpful to show stock status
}

interface ProductModalContextType {
  isOpen: boolean;
  selectedProduct: Product | null;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

export const ProductModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const closeProductModal = () => {
    setIsOpen(false);
    setTimeout(() => setSelectedProduct(null), 200); // Clear after animation
  };

  return (
    <ProductModalContext.Provider value={{ isOpen, selectedProduct, openProductModal, closeProductModal }}>
      {children}
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => {
  const context = useContext(ProductModalContext);
  if (context === undefined) {
    throw new Error('useProductModal must be used within a ProductModalProvider');
  }
  return context;
};