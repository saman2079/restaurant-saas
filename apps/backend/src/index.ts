import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { connectDB } from './config/database';
import { redis } from './config/redis';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { authService } from './modules/auth/auth.service';
import { setSocketIO } from './modules/orders/order.service';

// Routes
import authRoutes from './modules/auth/auth.routes';
import tenantRoutes from './modules/tenants/tenant.routes';
import menuRoutes from './modules/menu/menu.routes';
import orderRoutes from './modules/orders/order.routes';
import aiRoutes from './modules/ai/ai.routes';
import { setupSwagger } from './config/swagger';
import path from 'path';
import uploadRoutes from './modules/upload/upload.routes';





const app = express();
setupSwagger(app);
const httpServer = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setSocketIO(io);

io.on('connection', (socket) => {
  socket.on('join-tenant', (tenantId: string) => {
    socket.join(`tenant:${tenantId}`);
  });
  socket.on('join-kitchen', (tenantId: string) => {
    socket.join(`kitchen:${tenantId}`);
  });
});

// ─── Middlewares ─────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);
app.use('/api/upload', uploadRoutes);
// ─── Routes ──────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/super/tenants', tenantRoutes);
app.use('/api/:slug/menu', menuRoutes);
app.use('/api/:slug/orders', orderRoutes);
app.use('/api/:slug/ai', aiRoutes);

// ─── Error Handlers ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────
async function bootstrap() {
  await connectDB();

  try {
    await authService.createSuperAdmin();
  } catch (e: any) {
    console.error('⚠️ createSuperAdmin خطا:', e.message);
  }

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 سرور روی پورت ${env.PORT} اجرا شد`);
    console.log(`📍 محیط: ${env.NODE_ENV}`);
  });
}


bootstrap().catch(console.error);