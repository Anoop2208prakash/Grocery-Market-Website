// client/src/App.tsx
import { AppRouter } from './router/router';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; // <-- 1. IMPORT
import './assets/scss/main.scss';

function App() {
  return (
    <AuthProvider>
      <CartProvider> {/* <-- 2. WRAP THE ROUTER */}
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;