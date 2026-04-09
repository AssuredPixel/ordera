# Ordera - Multi-Tenant Restaurant POS Ecosystem

Ordera is a modern, high-performance platform designed to manage restaurant operations, from master branding at the organization level to daily sales at the branch level.

---

## 🚀 Progress Log & Development History

### **Timestamp: 2026-04-10 (Identity Domain 100% Complete)**

Tonight, we successfully decoupled the core identity logic and established a professional, multi-tenant foundation.

### 🔑 Identity & Access Management
*   **Organization Architecture**: Implemented master tenant management. Each organization supports its own timezone (IANA standard), currency symbols, and branding slugs.
*   **Branch Management**: Built a nested branch system where each organization can manage multiple locations. Each branch now tracks its own address and POS-specific hardware settings (cash/card preferences, receipt footers).
*   **Advanced User Profiles**: Upgraded users from simple accounts to full employee profiles.
    *   **Shift Tracking**: Real-time monitoring of orders served and revenue generated per shift.
    *   **Session Security**: A "Single-Device Limit" is now enforced. Logging in on a new device automatically deactivates all other active sessions.
    *   **Preferences**: Individual employee settings for language, theme, and region.

### 🛡️ Authentication & Security
*   **Passport.js Standards**: Refactored the entire API to use industry-standard Passport JWT strategies.
*   **Hardened Secrets**: Secured the project with a 64-character complex JWT Secret stored in environment variables.
*   **Scoped Data Isolation**: Enforced a strict rule across the backend: **No data can be fetched without an Organization ID.** This ensures absolute privacy between different businesses on the platform.

### 🛠️ Data & Automation
*   **Multi-Tenancy Seeder**: Created a standalone seed script (`src/seed.ts`) that populates the system with three diverse test organizations (Demo Restaurant, Lagos Lounge, Pizza Place) for robust testing.

### 📱 User Experience (UX)
*   **Professional Toasts**: Replaced intrusive browser/mobile alerts with modern, non-blocking toast notifications.
    *   **Web**: Using `sonner` for elegant success/error feedback.
    *   **Mobile**: Using `react-native-toast-message` with bottom-screen positioning for better accessibility.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas (or local instance)

### 2. Seeding the Database
To populate the database with the test organizations and user roles:
```bash
cd ordera-api
npx ts-node src/seed.ts
```

### 3. Test Accounts
Once seeded, you can log in with:
- **Sales ID**: `OWNER001`, `MGR001`, `WAIT001`, etc.
- **Password**: `password123`

---

## 📈 Roadmap
- [x] Phase 1: Identity & Access Management (DONE)
- [ ] Phase 2: Menu & Inventory Domain
- [ ] Phase 3: POS Ordering Logic
- [ ] Phase 4: Financial Reporting & Dashboards
