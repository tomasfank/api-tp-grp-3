import express, { Application } from 'express';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { UnsupportedMediaError } from './errors';

const app: Application = express();

// Reject non-JSON content types on mutating routes
app.use((req, _res, next) => {
  const method = req.method;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType && !contentType.includes('application/json')) {
      return next(new UnsupportedMediaError());
    }
  }
  next();
});

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TODO: mount resource routers here as they are implemented
// app.use('/api/auth', authRouter);
// app.use('/api/services', servicesRouter);
// app.use('/api/categories', categoriesRouter);
// app.use('/api/business-info', businessInfoRouter);
// app.use('/api/contacts', contactsRouter);
// app.use('/api/admin/contacts', adminContactsRouter);

// 404 for unregistered routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
