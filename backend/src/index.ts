import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import { connectRedis } from './config/redis';
import authRoutes from './routes/authRoutes';
import addressRoutes from './routes/addressRoutes';
import batchRoutes from './routes/batchRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
});
app.use(limiter);

// Connect to DB & Redis
connectDB();
connectRedis();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/batch', batchRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
