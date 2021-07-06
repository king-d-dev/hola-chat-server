import { Application } from 'express';
import { requireAuth } from '../middlewares/require-auth';
import { errorHandler } from '../middlewares/error-handler';
import { notFoundHandler } from '../middlewares/not-found-handler';
import chatRoutes from './chat';

export default function (app: Application) {
  app.use('/chats', requireAuth, chatRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // general error handler
  app.use(errorHandler);
}
