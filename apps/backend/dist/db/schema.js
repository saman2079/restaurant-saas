"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuItemsRelations = exports.orderItemsRelations = exports.ordersRelations = exports.tenantsRelations = exports.aiConversations = exports.reviews = exports.orderItems = exports.orders = exports.tables = exports.menuItems = exports.categories = exports.users = exports.tenants = exports.menuItemStatusEnum = exports.planEnum = exports.orderStatusEnum = exports.paymentStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// ─── Enums ───────────────────────────────────────────────
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", [
    "super_admin",
    "owner",
    "manager",
    "waiter",
    "chef",
    "cashier",
]);
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)("payment_status", [
    "not_required",
    "pending",
    "paid",
    "failed",
]);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)("order_status", [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
    "awaiting_payment",
]);
exports.planEnum = (0, pg_core_1.pgEnum)("plan", ["basic", "pro", "business"]);
exports.menuItemStatusEnum = (0, pg_core_1.pgEnum)("menu_item_status", [
    "available",
    "unavailable",
    "out_of_stock",
]);
// ─── Tenants (رستوران‌ها) ─────────────────────────────────
exports.tenants = (0, pg_core_1.pgTable)("tenants", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 100 }).notNull().unique(),
    description: (0, pg_core_1.text)("description"),
    logo: (0, pg_core_1.varchar)("logo", { length: 500 }),
    coverImage: (0, pg_core_1.varchar)("cover_image", { length: 500 }),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    address: (0, pg_core_1.text)("address"),
    plan: (0, exports.planEnum)("plan").default("basic").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    settings: (0, pg_core_1.jsonb)("settings").default({
        primaryColor: "#FF6B35",
        currency: "تومان",
        language: "fa",
        taxPercent: 0,
        serviceChargePercent: 0,
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (t) => ({
    slugIdx: (0, pg_core_1.index)("tenants_slug_idx").on(t.slug),
}));
// ─── Users ────────────────────────────────────────────────
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => exports.tenants.id, {
        onDelete: "cascade",
    }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    role: (0, exports.userRoleEnum)("role").default("waiter").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    avatar: (0, pg_core_1.varchar)("avatar", { length: 500 }),
    lastLoginAt: (0, pg_core_1.timestamp)("last_login_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (t) => ({
    emailIdx: (0, pg_core_1.index)("users_email_idx").on(t.email),
    tenantIdx: (0, pg_core_1.index)("users_tenant_idx").on(t.tenantId),
}));
// ─── Categories (دسته‌بندی منو) ───────────────────────────
exports.categories = (0, pg_core_1.pgTable)("categories", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id")
        .references(() => exports.tenants.id, { onDelete: "cascade" })
        .notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    nameEn: (0, pg_core_1.varchar)("name_en", { length: 255 }),
    icon: (0, pg_core_1.varchar)("icon", { length: 100 }),
    image: (0, pg_core_1.varchar)("image", { length: 500 }),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ─── Menu Items ───────────────────────────────────────────
exports.menuItems = (0, pg_core_1.pgTable)("menu_items", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id")
        .references(() => exports.tenants.id, { onDelete: "cascade" })
        .notNull(),
    categoryId: (0, pg_core_1.uuid)("category_id").references(() => exports.categories.id, {
        onDelete: "set null",
    }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    nameEn: (0, pg_core_1.varchar)("name_en", { length: 255 }),
    description: (0, pg_core_1.text)("description"),
    price: (0, pg_core_1.decimal)("price", { precision: 12, scale: 0 }).notNull(),
    image: (0, pg_core_1.varchar)("image", { length: 500 }),
    status: (0, exports.menuItemStatusEnum)("status").default("available").notNull(),
    isPopular: (0, pg_core_1.boolean)("is_popular").default(false),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false),
    preparationTime: (0, pg_core_1.integer)("preparation_time").default(15), // دقیقه
    calories: (0, pg_core_1.integer)("calories"),
    allergens: (0, pg_core_1.text)("allergens").array(),
    tags: (0, pg_core_1.text)("tags").array(),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    totalOrders: (0, pg_core_1.integer)("total_orders").default(0),
    totalRating: (0, pg_core_1.decimal)("total_rating", { precision: 10, scale: 2 }).default("0"),
    ratingCount: (0, pg_core_1.integer)("rating_count").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (t) => ({
    tenantIdx: (0, pg_core_1.index)("menu_items_tenant_idx").on(t.tenantId),
    categoryIdx: (0, pg_core_1.index)("menu_items_category_idx").on(t.categoryId),
}));
// ─── Tables (میزها) ───────────────────────────────────────
exports.tables = (0, pg_core_1.pgTable)("tables", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id")
        .references(() => exports.tenants.id, { onDelete: "cascade" })
        .notNull(),
    number: (0, pg_core_1.integer)("number").notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }),
    capacity: (0, pg_core_1.integer)("capacity").default(4),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    qrCode: (0, pg_core_1.varchar)("qr_code", { length: 500 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ─── Orders ───────────────────────────────────────────────
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    paidAt: (0, pg_core_1.timestamp)("paid_at"),
    tenantId: (0, pg_core_1.uuid)("tenant_id")
        .references(() => exports.tenants.id, { onDelete: "cascade" })
        .notNull(),
    tableId: (0, pg_core_1.uuid)("table_id").references(() => exports.tables.id, {
        onDelete: "set null",
    }),
    tableNumber: (0, pg_core_1.integer)("table_number"),
    rejectionReason: (0, pg_core_1.text)("rejection_reason"), // ← اضافه کن
    status: (0, exports.orderStatusEnum)("status").default("pending").notNull(),
    paymentStatus: (0, exports.paymentStatusEnum)("payment_status")
        .default("not_required")
        .notNull(),
    totalAmount: (0, pg_core_1.decimal)("total_amount", { precision: 12, scale: 0 }).notNull(),
    notes: (0, pg_core_1.text)("notes"),
    customerName: (0, pg_core_1.varchar)("customer_name", { length: 255 }),
    assignedTo: (0, pg_core_1.uuid)("assigned_to").references(() => exports.users.id, {
        onDelete: "set null",
    }),
    isAiOrder: (0, pg_core_1.boolean)("is_ai_order").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
}, (t) => ({
    tenantIdx: (0, pg_core_1.index)("orders_tenant_idx").on(t.tenantId),
    statusIdx: (0, pg_core_1.index)("orders_status_idx").on(t.status),
    createdAtIdx: (0, pg_core_1.index)("orders_created_at_idx").on(t.createdAt),
}));
// ─── Order Items ──────────────────────────────────────────
exports.orderItems = (0, pg_core_1.pgTable)("order_items", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)("order_id")
        .references(() => exports.orders.id, { onDelete: "cascade" })
        .notNull(),
    menuItemId: (0, pg_core_1.uuid)("menu_item_id").references(() => exports.menuItems.id, {
        onDelete: "set null",
    }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 12, scale: 0 }).notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull().default(1),
    notes: (0, pg_core_1.text)("notes"),
    subtotal: (0, pg_core_1.decimal)("subtotal", { precision: 12, scale: 0 }).notNull(),
});
// ─── Reviews ──────────────────────────────────────────────
exports.reviews = (0, pg_core_1.pgTable)("reviews", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id")
        .references(() => exports.tenants.id, { onDelete: "cascade" })
        .notNull(),
    menuItemId: (0, pg_core_1.uuid)("menu_item_id")
        .references(() => exports.menuItems.id, { onDelete: "cascade" })
        .notNull(),
    orderId: (0, pg_core_1.uuid)("order_id").references(() => exports.orders.id, {
        onDelete: "set null",
    }),
    rating: (0, pg_core_1.integer)("rating").notNull(), // 1-5
    comment: (0, pg_core_1.text)("comment"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ─── AI Conversations ─────────────────────────────────────
exports.aiConversations = (0, pg_core_1.pgTable)("ai_conversations", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id")
        .references(() => exports.tenants.id, { onDelete: "cascade" })
        .notNull(),
    tableId: (0, pg_core_1.uuid)("table_id").references(() => exports.tables.id, {
        onDelete: "set null",
    }),
    sessionId: (0, pg_core_1.varchar)("session_id", { length: 255 }).notNull(),
    messages: (0, pg_core_1.jsonb)("messages").default([]).notNull(),
    cart: (0, pg_core_1.jsonb)("cart").default([]).notNull(), // ← اضافه شد
    orderId: (0, pg_core_1.uuid)("order_id").references(() => exports.orders.id, {
        onDelete: "set null",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// ─── Relations ────────────────────────────────────────────
exports.tenantsRelations = (0, drizzle_orm_1.relations)(exports.tenants, ({ many }) => ({
    users: many(exports.users),
    categories: many(exports.categories),
    menuItems: many(exports.menuItems),
    tables: many(exports.tables),
    orders: many(exports.orders),
}));
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one, many }) => ({
    tenant: one(exports.tenants, { fields: [exports.orders.tenantId], references: [exports.tenants.id] }),
    table: one(exports.tables, { fields: [exports.orders.tableId], references: [exports.tables.id] }),
    items: many(exports.orderItems),
}));
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.orderItems.orderId], references: [exports.orders.id] }),
    menuItem: one(exports.menuItems, {
        fields: [exports.orderItems.menuItemId],
        references: [exports.menuItems.id],
    }),
}));
exports.menuItemsRelations = (0, drizzle_orm_1.relations)(exports.menuItems, ({ one, many }) => ({
    tenant: one(exports.tenants, {
        fields: [exports.menuItems.tenantId],
        references: [exports.tenants.id],
    }),
    category: one(exports.categories, {
        fields: [exports.menuItems.categoryId],
        references: [exports.categories.id],
    }),
    reviews: many(exports.reviews),
}));
//# sourceMappingURL=schema.js.map