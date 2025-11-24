import { AppRouter } from './router/router';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { LocationProvider } from './contexts/LocationContext';
import './assets/scss/main.scss';
import { ProductModalProvider } from './contexts/ProductModalContext';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <LocationProvider>
            <ProductModalProvider> {/* <-- 2. Wrap CartProvider */}
              <CartProvider>
                <AppRouter />
              </CartProvider>
            </ProductModalProvider>
          </LocationProvider>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;