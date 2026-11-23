# Salon Queue Management System — Vibe Coding Prompts & Submission Report

**Project Title:** Glamour Queue — Salon Queue Management System
**Live Demo:** [https://salon-queue-rnam.onrender.com](https://salon-queue-rnam.onrender.com)
**Staff Login Password:** `salon123`
**GitHub Repository:** [https://github.com/vedantpjoshi/salon-queue](https://github.com/vedantpjoshi/salon-queue)
**Submission For:** MSc IT — Vibe Coding Lab Final Project



---

## Part 1: Step-by-Step Vibe Coding Prompts (In Order of Execution)

### Prompt 1: Project Setup & Architecture Scaffolding

> **Prompt:**
> Implement Step 1 only. Adapt the canteen queue guide into a salon queue management system named "Glamour Queue". Set up React + Vite + TypeScript + Tailwind CSS frontend, Express backend, SQLite (`sql.js`) with optional PostgreSQL (`pg`), and Socket.IO. Create a clean modular folder structure with `docs/` containing `01-brief.md`, `02-screens.md`, and `03-flows-rules.md`, plus `AGENTS.md` in the root. Configure concurrent local development scripts, add a backend health-check endpoint (`/api/health`), and verify that frontend and backend both compile cleanly. List changed files and test commands.

### Prompt 2: Customer Service Menu & Bag Screens

> **Prompt:**
> Build the Customer Menu (`/`) and Cart/Bag (`/cart`) screens from `docs/02-screens.md`. Populate with 20 realistic Indian salon services across 4 categories (Hair, Skin, Nails, Spa) with ₹ prices, durations in minutes, and service tier tags (Quick, Standard, Premium). Implement live search, category filters, add/remove services, quantity controls, sticky cart bar showing item count and total amount, and customer name + 10-digit phone number validation. Enforce a maximum quantity of 5 per service. Ensure mobile-first responsive layout with a warm luxury salon aesthetic (`#6b4b8b` violet accent, `#fffdfb` background).

### Prompt 3: Booking Placement & Live Token Status

> **Prompt:**
> Implement booking placement and the Token Status screen (`/token/:id`) according to `docs/02-screens.md` and `docs/03-flows-rules.md`. Persist bookings in SQLite, generate sequential daily token numbers starting at 1 each morning, calculate totals and durations on the backend, and validate service availability. Build `/token/:id` featuring an oversized token display (`#42`), customer details, animated progress step indicator (Placed → In Progress → Completed), live estimated wait time, and device-bound cancellation allowed only while status is `Placed`. Test duplicate requests, page refreshes, and invalid IDs.

### Prompt 4: Stylist Floor Board

> **Prompt:**
> Build the Stylist Board at `/stylist`. Create 3 columns: `NEW REQUESTS` (Placed), `IN PROGRESS` (InProgress), and `READY / COMPLETED` (Completed). For each client card, display token number, customer name, booked services with quantities, and elapsed time since booking. Implement one-click forward actions: "Start Service" → "Mark Ready" → "Check Out Guest". Enforce strict forward-only status transitions on the backend. Use Socket.IO so actions instantly broadcast to customer tracking pages and the waiting TV display. Visually highlight cards older than 20 minutes with a warning border.

### Prompt 5: Full-Screen Now Serving TV Display

> **Prompt:**
> Build `/display` as a dedicated full-screen Now Serving display designed for a 1080p TV in the salon waiting lounge. Use a high-contrast dark slate background with three distinct columns: `Waiting` (with "Next Up" highlighted), `In Service`, and `Ready to Collect`. Display large readable token numbers, show total counts per lane, auto-sync in real time via Socket.IO with a fallback 10-second polling interval, and animate newly-ready tokens with a flashing glow for 5 seconds. Automatically remove tokens when checked out.

### Prompt 6: Admin Service & Control Studio

> **Prompt:**
> Build `/admin` as the Salon Manager & Service Studio. Implement password-protected access (default `salon123`) using session cookies. Build full CRUD controls for salon offerings: service name, category, price in ₹, duration in minutes, tier, and instant live availability toggles. Add today's summary cards: Today's Guests, Total Revenue, Completed Services, and Top Service. Broadcast catalog changes through Socket.IO so customer menus reflect sold-out/unavailable states immediately without page reload.

### Prompt 7: QA Audit, Edge Cases & Deployment Preparation

> **Prompt:**
> Perform a complete end-to-end audit using `docs/03-flows-rules.md`. Verify customer booking, daily token reset, device-scoped cancellation, 10-digit phone validation, stylist floor transitions, TV live sync, admin CRUD, and time restrictions (9 AM – 8 PM salon hours). Ensure production resilience: allow the server to gracefully run SQLite when `DATABASE_URL` is omitted and cloud PostgreSQL when provided. Run production TypeScript type-check and Vite build. Provide the final PASS/FAIL test report.

---

## Part 2: QA Audit & Test Results (PASS/FAIL)

| #            | Test Scenario                          | Description / Steps                                                                   | Result         | Evidence                                                                                                                       |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **1**  | Customer browses & adds services       | User filters by category (Hair/Skin/Nails/Spa), searches "Haircut", adjusts quantity. | **PASS** | Items add to cart; quantities persist in `localStorage`; category filters update instantaneously.                            |
| **2**  | Booking submission & Token generation  | Customer enters name + 10-digit phone number and taps "Book Appointment".             | **PASS** | Order stored in DB; daily token generated sequentially (#1, #2, ...); user navigated to `/token/:id`.                        |
| **3**  | Daily Token Reset                      | First order placed on a new date resets token counter to 1.                           | **PASS** | SQL query `COALESCE(MAX(token_number), 0) WHERE date(created_at) = date('now')` verified.                                    |
| **4**  | Real-time Stylist Board sync           | Booking placed on customer phone immediately appears on `/stylist`.                 | **PASS** | Socket event `order:new` broadcast; card renders under "NEW REQUESTS" column without reload.                                 |
| **5**  | Forward-only Status Transition         | Stylist clicks "Start Service" → "Mark Ready" → "Check Out Guest".                  | **PASS** | Transitions Placed → InProgress → Completed → CheckedOut work smoothly; backend blocks invalid reverse transitions.         |
| **6**  | Customer Page Live Update              | Customer viewing `/token/:id` sees status change automatically.                     | **PASS** | Socket event `order:updated` updates step ring; screen turns emerald upon completion with device vibration.                  |
| **7**  | TV Display Now Serving                 | Token moves across `/display` lanes and flashes when ready.                         | **PASS** | Token appears in "Ready to Collect" with `animate-blink` CSS for 5 seconds; disappears upon checkout.                        |
| **8**  | Device-Scoped Cancellation             | Customer can cancel only while `Placed` and only from booking device.               | **PASS** | Cancellation token stored in client storage; backend matches via `timingSafeEqual`; disappears from queue upon cancellation. |
| **9**  | Reverse Transition Blocked             | Attempting to move an order from Completed back to InProgress.                        | **PASS** | Server responds with HTTP 400 (`Cannot transition from "Completed" to "InProgress"`).                                        |
| **10** | Form Validation (Empty Fields & Phone) | Submitting booking with empty name or non-10-digit phone number.                      | **PASS** | Client displays inline red errors; backend validates regex `/^\d{10}$/` and returns HTTP 400.                                |
| **11** | Quantity Limits                        | Attempting to add more than 5 of a single service.                                    | **PASS** | Plus button disables at 5 on frontend; backend enforces `quantity <= 5` check.                                               |
| **12** | Unavailable Offering Handling          | Admin marks "Gold Facial" unavailable.                                                | **PASS** | Item greys out on `/` immediately; Add button disabled; cannot be added to cart.                                             |
| **13** | Salon Operating Hours Restriction      | Bookings placed after 7:45 PM (closing at 8:00 PM).                                   | **PASS** | Client shows "Currently closed"; backend refuses booking with HTTP 400.                                                        |
| **14** | Admin Authentication                   | Accessing `/admin` without credentials.                                             | **PASS** | Unauthenticated visitors see login screen; password `salon123` creates signed session cookie.                                |
| **15** | Persistence on Refresh & Restart       | Refreshing browser during active order or restarting server.                          | **PASS** | Orders and services persist in SQLite/PostgreSQL; client retrieves state on reload.                                            |
| **16** | Production Build & Type Check          | Run `npm run typecheck` and `npm run build`.                                      | **PASS** | 0 TypeScript errors; Vite packages client chunks and CSS in under 27 seconds.                                                  |

---

## Part 3: Complete List of Implemented Features

1. **Service Catalog & Booking Portal (`/`)**:

   * 20 authentic Indian salon services categorized under Hair, Skin, Nails, and Spa.
   * Real-time category filtering, full-text search, and duration/tier badges.
   * Floating Bag summary bar displaying live item count and total ₹ price.
   * Real-time availability indicator showing live walk-in status and operating hours.
2. **Interactive Bag & Validation (`/cart`)**:

   * Per-item quantity increment, decrement, and removal controls.
   * Automatic calculation of total ₹ amount and aggregate estimated service duration.
   * Strict customer validation (name required, strictly 10-digit phone number required).
3. **Live Token Tracking (`/token/:id`)**:

   * Oversized high-contrast token number.
   * 3-stage visual progress tracker (Placed → In Progress → Completed).
   * Live countdown and queue position estimate ("X guests ahead").
   * One-click booking cancellation protected by client-side cryptographic device tokens.
4. **Stylist Floor Kanban Board (`/stylist`)**:

   * 3 distinct operational lanes: New Requests, In Progress, Ready / Completed.
   * Client summary cards displaying service breakdown, total bill, and elapsed time.
   * Visual warning highlight for tickets waiting longer than 20 minutes.
   * One-click forward status transitions broadcast instantly via WebSockets.
5. **Now Serving Waiting Lounge TV Display (`/display`)**:

   * Full-screen 1080p layout with dark theme designed for wall-mounted displays.
   * High-contrast live columns: Waiting (with NEXT UP badge), In Service, and Ready to Collect.
   * 5-second glowing animation for newly completed tokens.
   * Dual-layer update system (WebSocket push + 10s polling safety net).
6. **Admin Studio & Control Room (`/admin`)**:

   * Secure password authentication (`salon123`).
   * Real-time daily KPI statistics: Total Guests, Revenue (₹), Completed Visits, and Top Offering.
   * Full service CRUD modal (Create, Edit name/category/price/duration/tier, and Delete).
   * Instant availability toggle switch that updates all customer screens in real time.

---

## Part 4: Commands to Run & Localhost URLs

### Commands to Start Locally

```powershell
# 1. Navigate to the project directory
cd "d:\MSC SEM_!\Cpp\final_proj\salon-queue"

# 2. Install all dependencies (already completed)
npm install

# 3. Start both frontend and backend concurrently in development mode
npm run dev

# 4. Or compile and run in production mode
npm run build
npm start
```

### Localhost URLs for All 6 Screens

| Screen Name                | Localhost URL                                                 | Purpose                                 |
| -------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| **1. Services Menu** | [http://localhost:5173/](http://localhost:5173/)               | Customer browsing & service selection   |
| **2. Cart / Bag**    | [http://localhost:5173/cart](http://localhost:5173/cart)       | Order review, details entry & booking   |
| **3. Token Status**  | [http://localhost:5173/token/1](http://localhost:5173/token/1) | Live guest tracking with token number   |
| **4. Stylist Board** | [http://localhost:5173/stylist](http://localhost:5173/stylist) | Staff Kanban board for station workflow |
| **5. TV Display**    | [http://localhost:5173/display](http://localhost:5173/display) | Full-screen Now Serving TV screen       |
| **6. Admin Studio**  | [http://localhost:5173/admin](http://localhost:5173/admin)     | Manager dashboard & service manager     |

---

## Part 5: Half-Page AI Vibe Coding Reflection

### What the AI Agent Got Wrong & How It Was Resolved

During Step 1 and the native dependency installation, the AI agent originally specified `better-sqlite3` as the database engine based on the canteen lab prompt. On the local Windows development machine, `better-sqlite3` attempted to compile native C++ addons via `node-gyp` and failed with `Error: Could not find any Visual Studio installation to use`.

**How it was noticed:**
The terminal output from `npm install` threw an `EPERM` / `node-gyp rebuild` error, preventing the server from starting. Furthermore, in production deployment on Render, compiling native binaries can often lead to architecture mismatches and slow build times.

**How the prompt and architecture were corrected:**Rather than wrestling with native build toolchains, the database layer was refactored to use **`sql.js`** (pure JavaScript WebAssembly SQLite) for local development, coupled with **`pg` (node-postgres)** for production deployment via Supabase. A unified query abstraction layer (`AppDatabase` in `server/db.ts`) was implemented with async methods (`.all()`, `.get()`, `.run()`, `.transaction()`). This enabled:

1. Zero native C++ compilation requirements on Windows.
2. 100% portable file-based SQLite persistence in `salon.db`.
3. Out-of-the-box compatibility with cloud PostgreSQL when `DATABASE_URL` is configured in Render.

---

## Part 6: Known Limitations & Edge Cases Handled

* **Ephemeral Filesystem on Free Hosting**: When running on Render Free without a PostgreSQL `DATABASE_URL`, SQLite writes to disk in `/tmp` which resets on server sleep. This is resolved by connecting a free Supabase PostgreSQL instance via `DATABASE_URL`.
* **Browser Sleep**: Mobile browsers that go into background sleep may pause WebSocket connections; the app includes auto-reconnect logic and window focus event listeners to resync immediately upon waking.
* **Single Salon Branch**: Currently architected for a single physical salon location with up to 5 simultaneous stations.
