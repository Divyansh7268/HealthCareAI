import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import visitRoutes from './routes/visits';
import './config/firebase'; // Initialize Firebase Admin on startup

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Middleware
app.use(helmet());
app.use(cors({ origin: '*' })); // Allow React Native app

// 2. Request Parsing Middleware
app.use(express.json());

// 3. Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 4. Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// 5. API Routes (v1)
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import doctorRoutes from './routes/doctor';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', authRoutes); // for /users/me since we put it in authRoutes above
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/doctor', doctorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 6. Centralized Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[VirtualCare] Backend server running on http://localhost:${PORT}`);
});
