import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { connectToDatabase } from './infrastructure/database/connect';
import { apiRoutes } from './presentation/routes';
import { logger } from './shared/utils/logger';
import { requestLogger } from './presentation/middleware/requestLogger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(requestLogger);
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectToDatabase().then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error('Failed to connect to MongoDB', { error: err });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
