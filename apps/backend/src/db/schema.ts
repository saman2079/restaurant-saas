import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "owner",
  "manager",
  "waiter",
  "chef",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

export const planEnum = pgEnum("plan", ["basic", "pro", "business"]);

export const menuItemStatusEnum = pgEnum("menu_item_status", [
  "available",
  "unavailable",
  "out_of_stock",
]);

// ─── Tenants (رستوران‌ها) ─────────────────────────────────
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    logo: varchar("logo", { length: 500 }),
    coverImage: varchar("cover_image", { length: 500 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    plan: planEnum("plan").default("basic").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    settings: jsonb("settings").default({
      primaryColor: "#FF6B35",
      currency: "تومان",
      language: "fa",
      taxPercent: 0,
      serviceChargePercent: 0,
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index("tenants_slug_idx").on(t.slug),
  }),
);

// ─── Users ────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: userRoleEnum("role").default("waiter").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    avatar: varchar("avatar", { length: 500 }),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    tenantIdx: index("users_tenant_idx").on(t.tenantId),
  }),
);

// ─── Categories (دسته‌بندی منو) ───────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  icon: varchar("icon", { length: 100 }),
  image: varchar("image", { length: 500 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Menu Items ───────────────────────────────────────────
export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }),
    description: text("description"),
    price: decimal("price", { precision: 12, scale: 0 }).notNull(),
    image: varchar("image", { length: 500 }),
    status: menuItemStatusEnum("status").default("available").notNull(),
    isPopular: boolean("is_popular").default(false),
    isFeatured: boolean("is_featured").default(false),
    preparationTime: integer("preparation_time").default(15), // دقیقه
    calories: integer("calories"),
    allergens: text("allergens").array(),
    tags: text("tags").array(),
    sortOrder: integer("sort_order").default(0),
    totalOrders: integer("total_orders").default(0),
    totalRating: decimal("total_rating", { precision: 10, scale: 2 }).default(
      "0",
    ),
    ratingCount: integer("rating_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index("menu_items_tenant_idx").on(t.tenantId),
    categoryIdx: index("menu_items_category_idx").on(t.categoryId),
  }),
);

// ─── Tables (میزها) ───────────────────────────────────────
export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  number: integer("number").notNull(),
  name: varchar("name", { length: 100 }),
  capacity: integer("capacity").default(4),
  isActive: boolean("is_active").default(true),
  qrCode: varchar("qr_code", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Orders ───────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    tableId: uuid("table_id").references(() => tables.id, {
      onDelete: "set null",
    }),
    tableNumber: integer("table_number"),
    rejectionReason: text("rejection_reason"), // ← اضافه کن
    status: orderStatusEnum("status").default("pending").notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 0 }).notNull(),
    notes: text("notes"),
    customerName: varchar("customer_name", { length: 255 }),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    isAiOrder: boolean("is_ai_order").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => ({
    tenantIdx: index("orders_tenant_idx").on(t.tenantId),
    statusIdx: index("orders_status_idx").on(t.status),
    createdAtIdx: index("orders_created_at_idx").on(t.createdAt),
  }),
);

// ─── Order Items ──────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 12, scale: 0 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 12, scale: 0 }).notNull(),
});

// ─── Reviews ──────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  menuItemId: uuid("menu_item_id")
    .references(() => menuItems.id, { onDelete: "cascade" })
    .notNull(),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── AI Conversations ─────────────────────────────────────
export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  tableId: uuid("table_id").references(() => tables.id, {
    onDelete: "set null",
  }),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  messages: jsonb("messages").default([]).notNull(),
  cart: jsonb("cart").default([]).notNull(), // ← اضافه شد
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  menuItems: many(menuItems),
  tables: many(tables),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [menuItems.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
}));
