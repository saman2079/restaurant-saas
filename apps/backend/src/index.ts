import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import path from "path";

import { env } from "./config/env";
import { connectDB } from "./config/database";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { authService } from "./modules/auth/auth.service";
import { setSocketIO } from "./modules/orders/order.service";
import { setupSwagger } from "./config/swagger";

import authRoutes from "./modules/auth/auth.routes";
import tenantRoutes from "./modules/tenants/tenant.routes";
import menuRoutes from "./modules/menu/menu.routes";
import orderRoutes from "./modules/orders/order.routes";
import aiRoutes from "./modules/ai/ai.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import staffRoutes from "./modules/staff/staff.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import cashierRoutes from "./modules/cashier/cashier.routes";
import profileRoutes from "./modules/profile/profile.routes";
import tablesRoutes from "./modules/tables/tables.routes";

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

(global as any).io = io;
setSocketIO(io);

io.on("connection", (socket) => {
  console.log("🔌 Socket متصل:", socket.id);

  socket.on("join-tenant", async (tenantIdOrSlug: string) => {
    // اگه UUID بود مستقیم join کن، اگه slug بود از دیتابیس بگیر
    const isUUID = /^[0-9a-f-]{36}$/.test(tenantIdOrSlug);

    if (isUUID) {
      socket.join(`tenant:${tenantIdOrSlug}`);
      console.log(`✅ join-tenant (id): ${tenantIdOrSlug}`);
    } else {
      // slug هست، از Redis یا DB بگیر
      try {
        const { db } = await import("./config/database");
        const { tenants } = await import("./db/schema");
        const { eq } = await import("drizzle-orm");
        const [tenant] = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.slug, tenantIdOrSlug));

        if (tenant) {
          socket.join(`tenant:${tenant.id}`);
          console.log(
            `✅ join-tenant (slug→id): ${tenantIdOrSlug} → ${tenant.id}`,
          );
        }
      } catch (e) {
        console.error("join-tenant error:", e);
      }
    }
  });

  socket.on("join-kitchen", (tenantId: string) => {
    socket.join(`kitchen:${tenantId}`);
  });

  socket.on("join-order", (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`✅ join-order: ${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket قطع شد:", socket.id);
  });
});

// ─── Middlewares ─────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/:slug/staff", staffRoutes);
app.use("/api/:slug/analytics", analyticsRoutes);
app.use("/api/:slug/cashier", cashierRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/:slug/tables", tablesRoutes);

// ─── Static Files ─────────────────────────────────────────
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads")),
);

// ─── Swagger ──────────────────────────────────────────────
setupSwagger(app);

// ─── Routes ──────────────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/super/tenants", tenantRoutes);
app.use("/api/:slug/menu", menuRoutes);
app.use("/api/:slug/orders", orderRoutes);
app.use("/api/:slug/ai", aiRoutes);

// ─── Error Handlers ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────
async function bootstrap() {
  await connectDB();

  try {
    await authService.createSuperAdmin();
  } catch (e: any) {
    console.error("⚠️ createSuperAdmin خطا:", e.message);
  }

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 سرور روی پورت ${env.PORT} اجرا شد`);
    console.log(`📍 محیط: ${env.NODE_ENV}`);
  });
}

bootstrap().catch(console.error);
