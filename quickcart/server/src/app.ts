// server/src/app.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './api/auth/auth.routes';
import productRoutes from './api/products/product.routes';
import categoryRoutes from './api/categories/category.routes';
import orderRoutes from './api/orders/order.routes'; // <-- 1. IMPORT THIS
import deliveryRoutes from './api/delivery/delivery.routes';

const app = express();

// --- Global Middleware ---
app.use(cors()); // Allow cross-origin requests (from our React app)
app.use(express.json()); // Allow app to accept JSON body
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get('/api', (req, res) => {
  res.send('QuickCart API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes); // <-- 2. ADD THIS LINE
app.use('/api/delivery', deliveryRoutes);

// --- (We will add an error handler middleware later) ---

export default app;