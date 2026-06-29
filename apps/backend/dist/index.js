"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_service_1 = require("./modules/auth/auth.service");
const order_service_1 = require("./modules/orders/order.service");
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const tenant_routes_1 = __importDefault(require("./modules/tenants/tenant.routes"));
const menu_routes_1 = __importDefault(require("./modules/menu/menu.routes"));
const order_routes_1 = __importDefault(require("./modules/orders/order.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const upload_routes_1 = __importDefault(require("./modules/upload/upload.routes"));
const staff_routes_1 = __importDefault(require("./modules/staff/staff.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const cashier_routes_1 = __importDefault(require("./modules/cashier/cashier.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const tables_routes_1 = __importDefault(require("./modules/tables/tables.routes"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ─── Socket.IO ───────────────────────────────────────────
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
});
global.io = io;
(0, order_service_1.setSocketIO)(io);
io.on("connection", (socket) => {
    console.log("🔌 Socket متصل:", socket.id);
    socket.on("join-tenant", async (tenantIdOrSlug) => {
        const isUUID = /^[0-9a-f-]{36}$/.test(tenantIdOrSlug);
        let tenantId = tenantIdOrSlug;
        if (!isUUID) {
            try {
                const { db } = await Promise.resolve().then(() => __importStar(require("./config/database")));
                const { tenants } = await Promise.resolve().then(() => __importStar(require("./db/schema")));
                const { eq } = await Promise.resolve().then(() => __importStar(require("drizzle-orm")));
                const [tenant] = await db
                    .select({ id: tenants.id })
                    .from(tenants)
                    .where(eq(tenants.slug, tenantIdOrSlug));
                if (!tenant)
                    return;
                tenantId = tenant.id;
            }
            catch (e) {
                console.error("join-tenant error:", e);
                return;
            }
        }
        socket.join(`tenant:${tenantId}`);
        console.log(`✅ joined tenant:${tenantId}`);
    });
    socket.on("join-kitchen", (tenantId) => {
        socket.join(`kitchen:${tenantId}`);
    });
    socket.on("join-order", (orderId) => {
        socket.join(`order:${orderId}`);
        console.log(`✅ join-order: ${orderId}`);
    });
    socket.on("disconnect", () => {
        console.log("❌ Socket قطع شد:", socket.id);
    });
});
// ─── Middlewares ─────────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use((0, cors_1.default)({ origin: "*", credentials: true }));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/:slug/staff", staff_routes_1.default);
app.use("/api/:slug/analytics", analytics_routes_1.default);
app.use("/api/:slug/cashier", cashier_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
app.use("/api/:slug/tables", tables_routes_1.default);
// ─── Static Files ─────────────────────────────────────────
app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// ─── Swagger ──────────────────────────────────────────────
(0, swagger_1.setupSwagger)(app);
// ─── Routes ──────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", timestamp: new Date() }));
app.use("/api/auth", auth_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use("/api/super/tenants", tenant_routes_1.default);
app.use("/api/:slug/menu", menu_routes_1.default);
app.use("/api/:slug/orders", order_routes_1.default);
app.use("/api/:slug/ai", ai_routes_1.default);
// ─── Error Handlers ──────────────────────────────────────
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
// ─── Start ───────────────────────────────────────────────
async function bootstrap() {
    await (0, database_1.connectDB)();
    try {
        await auth_service_1.authService.createSuperAdmin();
    }
    catch (e) {
        console.error("⚠️ createSuperAdmin خطا:", e.message);
    }
    httpServer.listen(env_1.env.PORT, () => {
        console.log(`🚀 سرور روی پورت ${env_1.env.PORT} اجرا شد`);
        console.log(`📍 محیط: ${env_1.env.NODE_ENV}`);
    });
}
bootstrap().catch(console.error);
//# sourceMappingURL=index.js.map