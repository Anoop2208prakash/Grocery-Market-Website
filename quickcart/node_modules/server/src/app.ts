import express from 'express';
import cors from 'cors';
import path from 'path'; // Make sure 'path' is imported
import authRoutes from './api/auth/auth.routes';
import productRoutes from './api/products/product.routes';
import categoryRoutes from './api/categories/category.routes';
import orderRoutes from './api/orders/order.routes';
import deliveryRoutes from './api/delivery/delivery.routes';
import userRoutes from './api/users/user.routes';
import locationRoutes from './api/location/location.routes';
import uploadRoutes from './api/upload/upload.routes';
import walletRoutes from './api/wallet/wallet.routes';
import invoiceRoutes from './api/invoice/invoice.routes';
import bannerRoutes from './api/banners/banner.routes';
import darkStoreRoutes from './api/darkStore/darkStore.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- THIS IS THE FIX ---
// We use process.cwd() which is 'quickcart/server'
// and join it with 'public/uploads'
const uploadsPath = path.join(process.cwd(), './public/uploads');
app.use('/uploads', express.static(uploadsPath));
// --- END FIX ---

// --- API Routes ---
app.get('/api', (req, res) => {
  res.send('QuickCart API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/darkstores', darkStoreRoutes);

export default app;