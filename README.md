# Ordera - Multi-Tenant Restaurant POS Ecosystem

Ordera is a modern, high-performance platform designed to manage restaurant operations, from master branding at the organization level to daily sales at the branch level.

---

## 🚀 Progress Log & Development History

### **Timestamp: 2026-04-14 (Frontend Web — Dashboard, Operational Modules & AI Assistant)**

Completed the full frontend implementation for the Ordera web dashboard including real-time chat, billing workflows, a comprehensive settings suite, and an AI-powered operations assistant.

### 🧭 Dashboard (ordera-web)
- **Live Analytics UI**: Implemented the dashboard page with revenue charts (Recharts), hourly bar graphs, and a pie chart for revenue-by-type breakdown — all connected to `GET /dashboard/stats`.
- **Session Hydration Fix**: Resolved the persistent "Loading..." bug in the layout header by adding a `useEffect` to re-fetch `/auth/me` on page reload, safely re-populating the Zustand auth store.
- **Food & Drinks — Category & Item Screens**: Built the Category grid (`/food-drinks`) and Item detail grid (`/food-drinks/[category]`). Item detail panel renders as a full-height **overlay** (not shrinking the grid).

### 💬 Messages (Real-Time Chat)
- **Socket.IO Singleton** (`lib/socket.ts`): Establishes a single authenticated connection to the `/messages` namespace using the JWT cookie. Reused across the app lifecycle.
- **Three-Column Layout**: Sidebar → Thread list (with Teams/Personal sections, unread badges, timestamps) → Chat view.
- **Live Events**: `join-thread`, `message:send`, `message:receive`, `typing:start`, `typing:stop` all wired with optimistic UI updates.
- **Paginated History**: `GET /messages/threads/:id/history` loaded on mount; scroll-up loads more.

### 🧾 Bills & Payments
- **Split-Pane Layout**: Left panel lists bills with status filter pills (All / Active / Paid / Cancelled). Right panel shows full bill detail.
- **Bill Detail Panel**: Shows table number, guest count, customer name, payment method, itemised order lines, subtotal, tax, tip, and total.
- **Charge Modal**: Slide-over modal for processing payment. Supports Cash/Card toggle and optional tip (% or fixed). Dispatches `POST /bills/:id/charge` and invalidates React Query cache on success.

### ⚙️ Settings Module (`/settings/[section]`)
Six fully-implemented sub-pages behind a shared layout with active-section highlighting:

| Section | What it does |
|---|---|
| **Profile** | Two-column form (name, email, phone, DOB, location, gender). `PATCH /users/me` on save. |
| **Notifications** | 5×2 toggle matrix (type × Push/Email channel). `PATCH /users/me/notification-preferences`. |
| **Appearance** | Light/Dark theme toggle (persisted to `localStorage`). Font size stepper. |
| **Checkout** | Card/Cash/Transfer toggles. Save history toggle. `PATCH /branches/:id/settings`. |
| **Security** | Active session list with device & location info. `DELETE /auth/sessions/:id` to revoke. |
| **Language** | Region & language dropdowns. Predictive AI text toggle. |

### 🤖 Ordera Intelligence (AI Assistant Panel)
- **Global Zustand Toggle** (`stores/ui.ts`): `isAiPanelOpen` state drives the panel show/hide across all pages.
- **`Ctrl+K` / `⌘K` Shortcut**: Registered as a global `keydown` listener in the dashboard layout.
- **Slide-Over Panel**: Fixed right panel, `60vw` width, `z-50`, with dimmed backdrop. Includes header with "Ordera Intelligence" branding, suggestion chips empty state, and a full chat thread view.
- **Streaming Response**: Uses `fetch` + `ReadableStream` to stream tokens from `POST /ai/query` directly into the AI bubble as they arrive.
- **Amount Highlighting**: A regex parser wraps currency-formatted numbers (e.g., `₦5,000`, `$30.00`) in `#C97B2A` styled `<strong>` tags inside AI responses.

---

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
*   **Data Integrity**: Implements "Order Snapshots" — once an item is added to an order, its price and name are locked in, protecting historical reports from future menu price changes.

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
- `GET /auth/me` - Re-hydrate session from JWT
- `DELETE /auth/sessions/:id` - Revoke a device session
- `GET /organizations` - Master tenant profiles
- `GET /branches` - Branch specific settings

### **Menu & Inventory**
- `GET /menu/categories` - Menu structure
- `GET /menu/categories/:id/items` - Items by category
- `GET /menu/items` - Catalog & Stock management

### **POS Operations**
- `GET /orders` - Active/Historical orders
- `POST /orders` - Create new order
- `POST /orders/:id/items` - Add items to order
- `PATCH /orders/:id/status` - Progress order lifecycle

### **Bills & Payments**
- `GET /bills` - List bills (filterable by status)
- `POST /bills` - Generate bill from order
- `POST /bills/:id/charge` - Process payment with optional tip

### **Messaging**
- `GET /messages/threads` - List threads for logged-in user
- `GET /messages/threads/:id/history` - Paginated message history
- WebSocket events: `join-thread`, `message:send`, `message:receive`, `typing:start`, `typing:stop`

### **Insights & AI**
- `GET /dashboard/stats?period=today` - Real-time business intelligence
- `POST /ai/query` - AI-powered business analytics (streaming)
- `GET /ai/usage` - Token usage report (Manager+ only)

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
All seeded users share the password `password123`. Log in via `/{orgSlug}/login`:

| Org              | Slug  | Role   | Sales ID   | Email |
| Demo Restaurant | `demo` | Owner | `OWNER001` | `owner001@demo.com` |
| Demo Restaurant | `demo` | Manager | `MGR001` | `mgr001@demo.com` |
| Demo Restaurant | `demo` | Supervisor | `SUP001` | `sup001@demo.com` |
| Demo Restaurant | `demo` | Waiter | `WAIT001` | `wait001@demo.com` |
| Demo Restaurant | `demo` | Kitchen | `KITC001` | `kitc001@demo.com` |
| Lagos Lounge    | `lagos`| Owner | `OWNER001` | `owner001@lagos.com` |
| Pizza Place      | `pizza` | Owner | `OWNER001` | `owner001@pizza.com` |

> The **Demo Restaurant** (`/demo`) has the richest data — orders, bills, chat threads, and menu items all seeded.

---

## 📈 Roadmap

- [x] Phase 1: Identity & Access Management
- [x] Phase 2: Menu & Inventory Domain
- [x] Phase 3: POS Ordering Logic
- [x] Phase 4: Financial Reporting & Dashboards (Backend)
- [x] Phase 5: Frontend Web (Next.js) — Dashboard, Food & Drinks, Messages, Bills, Settings, AI Assistant
- [ ] Phase 6: Mobile Tablet POS
- [ ] Phase 7: Production Deployment & CORS Config
