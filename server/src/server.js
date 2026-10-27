import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sseRoutes from './routes/sseRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite client (port 5173 by default)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BookLeaf Author Support & Communication Portal API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/author', authorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sse', sseRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handling Middleware (Meaningful errors, no generic 500 crashes)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected internal server error occurred.',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BookLeaf Support API Server running on http://localhost:${PORT}`);
  console.log(`📡 Real-Time SSE endpoints active at /api/sse`);
});
