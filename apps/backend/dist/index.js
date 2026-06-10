"use strict";
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
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_service_1 = require("./modules/auth/auth.service");
const order_service_1 = require("./modules/orders/order.service");
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const tenant_routes_1 = __importDefault(require("./modules/tenants/tenant.routes"));
const menu_routes_1 = __importDefault(require("./modules/menu/menu.routes"));
const order_routes_1 = __importDefault(require("./modules/orders/order.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const swagger_1 = require("./config/swagger");
const app = (0, express_1.default)();
(0, swagger_1.setupSwagger)(app);
const httpServer = (0, http_1.createServer)(app);
// ─── Socket.IO ───────────────────────────────────────────
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});
(0, order_service_1.setSocketIO)(io);
io.on('connection', (socket) => {
    socket.on('join-tenant', (tenantId) => {
        socket.join(`tenant:${tenantId}`);
    });
    socket.on('join-kitchen', (tenantId) => {
        socket.join(`kitchen:${tenantId}`);
    });
});
// ─── Middlewares ─────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: '*', credentials: true }));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Routes ──────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/super/tenants', tenant_routes_1.default);
app.use('/api/:slug/menu', menu_routes_1.default);
app.use('/api/:slug/orders', order_routes_1.default);
app.use('/api/:slug/ai', ai_routes_1.default);
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
        console.error('⚠️ createSuperAdmin خطا:', e.message);
    }
    httpServer.listen(env_1.env.PORT, () => {
        console.log(`🚀 سرور روی پورت ${env_1.env.PORT} اجرا شد`);
        console.log(`📍 محیط: ${env_1.env.NODE_ENV}`);
    });
}
bootstrap().catch(console.error);
//# sourceMappingURL=index.js.map