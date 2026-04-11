# Ordera - Multi-Tenant Restaurant POS Ecosystem

Ordera is a modern, high-performance platform designed to manage restaurant operations, from master branding at the organization level to daily sales at the branch level.

---

## 🚀 Progress Log & Development History

### **Timestamp: 2026-04-11 (POS, Financial Reporting & Dashboards 100% Complete)**

Today, we finalized the core business logic of the ecosystem, enabling full end-to-end restaurant operations from ordering to real-time financial analytics.

### 🍱 Dashboard & Business Intelligence
*   **Real-Time Analytics**: Built a robust dashboard engine using MongoDB aggregation pipelines for instant business insights.
*   **Key Metrics**: Tracks Total Revenue, Order Counts, and Brand Growth (New Customers) with period-over-period comparisons.
*   **Hourly Performance**: Visualizes sales trends with human-readable hourly labels (e.g., "9 AM", "12 PM").
*   **Staff & Menu Insights**: Automatically identifies "Best Employees" by revenue and "Trending Dishes" by volume.

### 📝 POS Ordering & Lifecycle
*   **Comprehensive Order Engine**: Supports **Dine-In**, **Takeaway**, and **Delivery** workflows.
*   **Live Status Tracking**: Manages the order lifecycle from `PENDING` to `COMPLETED` or `CANCELLED`.
*   **Data Integrity**: Implements "Order Snapshots"—once an item is added to an order, its price and name are locked in, protecting historical reports from future menu price changes.

### 💰 Billing, Payments & Tips
*   **Automated Billing**: Generates immutable bills linked to active orders.
*   **Flexible Payments**: Supports Cash, Card, and Digital Transfers.
*   **Gratuity & Splits**: Built-in support for customer tips (Percentage or Fixed) and future-ready split-billing logic.

### 👥 Customer Identity (CRM)
*   **Guest Profiles**: Dedicated customer collection to track guest preferences, contact info, and total spend.
*   **Multi-Tenant Isolation**: Customers are scoped to organizations, ensuring data privacy and preventing cross-client data leaks.

---

### **Timestamp: 2026-04-10 (Identity, Menu & Messaging Domains 100% Complete)**

Successfully decoupled the core identity logic, implemented the real-time messaging engine, and established the menu management framework.

### 🔑 Identity & Access Management
*   **Organization Architecture**: Master tenant management with individual timezones (IANA), currency symbols, and slugs.
*   **Branch Management**: Nested branch system with POS-specific hardware settings (receipt footers, payment preferences).
*   **Advanced User Profiles**: Employee profiles with shift tracking and "Single-Device Limit" session security.

### 💬 Internal Team Messaging (Real-Time)
*   **WebSocket Engine**: Socket.io-based gateway for instantaneous department coordination (Kitchen, Front of House, Management).
*   **Scoped Channels**: Support for both Group Threads and secure 1-on-1 Direct Messaging.

---

## 🛠️ API Reference (Core Endpoints)

### **Identity & Auth**
- `POST /auth/login` - Secure JWT login
- `GET /organizations` - Master tenant profiles
- `GET /branches` - Branch specific settings

### **Menu & Inventory**
- `GET /menu/categories` - Menu structure
- `GET /menu/items` - Catalog & Stock management

### **POS Operations**
- `GET /orders` - Active/Historical orders
- `POST /orders` - Create new order
- `POST /orders/:id/items` - Add items to order
- `PATCH /orders/:id/status` - Progress order lifecycle
- `POST /bills` - Generate bill from order
- `PATCH /bills/:id/pay` - Process payment & apply tips

### **Insights**
- `GET /dashboard/stats?period=today` - Real-time business intelligence
- `POST /ai/query` - AI-powered business analytics

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas (or local instance)

### 2. Seeding the Database
To populate the database with test organizations, users, menu items, and **transactional history**:
```bash
cd ordera-api
npx ts-node src/seed.ts
```

### 3. Test Accounts
Once seeded, you can log in with:
- **Sales ID**: `OWNER001`, `MGR001`, `WAIT001`
- **Password**: `password123`

---

## 📈 Roadmap (Backend Phase Complete)
- [x] Phase 1: Identity & Access Management
- [x] Phase 2: Menu & Inventory Domain
- [x] Phase 3: POS Ordering Logic
- [x] Phase 4: Financial Reporting & Dashboards
- [ ] Phase 5: Frontend Web (Next.js) Integration
- [ ] Phase 6: Mobile Tablet POS
