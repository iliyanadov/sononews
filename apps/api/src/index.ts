import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import jobsRouter from './routes/jobs';
import alertsRouter from './routes/alerts';
import draftsRouter from './routes/drafts';
import imagesRouter from './routes/images';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/images', imagesRouter);

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
