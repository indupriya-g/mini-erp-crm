# Mini ERP + CRM Operations Portal

A lightweight internal operations portal for a wholesale/distribution business — built for the Full Stack Developer case study assignment. It covers customer relationship management (CRM), product & inventory tracking, and a sales challan (delivery/sales slip) workflow with stock validation.

**Live Demo:** https://mini-erp-crm-beta.vercel.app
**Backend API:** https://mini-erp-backend.onrender.com

> ⚠️ The backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after a period of inactivity may take 30–60 seconds to respond while the server wakes up — this is expected behavior, not a bug.

---

## Test Credentials

All test users share the password: **`password123`**

| Role | Email |
|------|-------|
| Admin | admin@test.com |
| Sales | sales@test.com |
| Warehouse | warehouse@test.com |
| Accounts | accounts@test.com |

---

## Features

**Authentication & Roles**
- JWT-based login
- Four roles: Admin, Sales, Warehouse, Accounts
- Protected routes (frontend) and protected APIs (backend middleware)

**Customer CRM**
- Add / edit / search customers
- Customer detail page with follow-up notes history
- Status tracking: Lead, Active, Inactive

**Product & Inventory**
- Add / edit products with SKU, price, category, location
- Stock movement log (IN / OUT) with reason and timestamp
- Low-stock alert flagging based on a per-product minimum threshold

**Sales Challan**
- Create challans as Draft or Confirmed
- Multi-product line items with quantity
- Automatic challan numbering (`CH-0001`, `CH-0002`, ...)
- Stock is only deducted on Confirm — never on Draft
- Insufficient-stock protection: rejects the entire challan (no partial updates) if any line item exceeds available stock
- Product details (name, SKU, price) are **snapshotted** into the challan at creation time, so historical challans remain accurate even if the product record changes later

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, TypeScript, Express.js |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken), bcrypt for password hashing |
| Deployment | Vercel (frontend), Render (backend), Neon (database) |

---

## Architecture

```
React (Vercel)
      │  REST API calls (Axios) + JWT in Authorization header
      ▼
Express.js API (Render)
      │  Prisma ORM
      ▼
PostgreSQL (Neon)
```

- The frontend never talks to the database directly — all data access goes through the Express REST API.
- Every protected API route runs through an `authMiddleware` that validates the JWT before the route handler executes.
- Role-based restrictions are enforced with a `requireRole(...)` middleware where applicable.
- All multi-step database writes that must succeed or fail together (e.g., confirming a challan: deduct stock + log a stock movement + update challan status) are wrapped in Prisma `$transaction` calls, so the database is never left in a half-updated state.

---

## Database Schema

| Table | Purpose |
|---|---|
| `User` | Employee accounts, one per role |
| `Customer` | CRM records |
| `FollowUp` | Notes tied to a customer (one customer → many follow-ups) |
| `Product` | Catalog + current stock level |
| `StockMovement` | Audit log of every stock change (IN/OUT), tied to a product |
| `Challan` | Sales challan header (customer, status, challan number) |
| `ChallanItem` | Line items on a challan, with a frozen snapshot of product name/SKU/price at time of sale |

Relationships:
- `Customer` 1—* `FollowUp`
- `Customer` 1—* `Challan`
- `Product` 1—* `StockMovement`
- `Product` 1—* `ChallanItem`
- `Challan` 1—* `ChallanItem`

Full schema definition: [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma)

---

## API Documentation

A full Postman collection with success and failure examples for every endpoint is included at [`docs/Mini-ERP-CRM.postman_collection.json`](./docs/Mini-ERP-CRM.postman_collection.json).

Summary of endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Log in, returns JWT |
| GET | `/customers` | List customers (search, status filter, pagination) |
| GET | `/customers/:id` | Get one customer with follow-ups |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| POST | `/customers/:id/follow-ups` | Add a follow-up note |
| GET | `/products` | List products (search, low-stock filter, pagination) |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product (stock not directly editable here) |
| GET | `/products/:id/stock-movements` | Stock movement history for a product |
| POST | `/products/:id/stock-movements` | Record a manual IN/OUT stock movement |
| GET | `/challans` | List challans (status filter, pagination) |
| GET | `/challans/:id` | Get one challan with items |
| POST | `/challans` | Create a challan (Draft or Confirmed) |
| PUT | `/challans/:id/confirm` | Confirm a Draft challan |

All endpoints except `/auth/login` require a `Authorization: Bearer <token>` header. All return proper HTTP status codes (`400` validation errors, `401` auth errors, `404` not found, `500` server errors) with a JSON `message` field.

---

## Installation & Running Locally

### Prerequisites
- Node.js v18+
- A free [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL instance)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="any-long-random-string"
```

```bash
npx prisma migrate dev
npm run seed        # creates the 4 test users
npm run dev          # starts the dev server on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev          # starts on http://localhost:5173
```

---

## Environment Variables

| Variable | Used in | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Secret key for signing/verifying JWTs |
| `PORT` | backend | Port the Express server listens on |
| `VITE_API_URL` | frontend | Base URL the frontend uses for all API calls |

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Database | Neon (free tier) | Managed PostgreSQL, always-on |
| Backend | Render (free tier) | Build: `npm install && npx prisma generate && npm run build` · Start: `npm start` · Root directory: `backend` |
| Frontend | Vercel (free tier) | Root directory: `frontend` · Env var `VITE_API_URL` set to the live Render backend URL |

Deployment steps are also documented inline in the project's build history / commit messages.

---

## Assumptions Made

- Since the assignment allowed a choice between Express and NestJS, and PostgreSQL or MySQL, I chose **Express + PostgreSQL** for a simpler, faster learning curve within the time limit.
- Prisma was used as the ORM (not specified in the assignment) to reduce raw SQL boilerplate and get safe, typed database access quickly.
- "Delete" was intentionally **not implemented** for customers/products — real-world business records are typically deactivated (status change) rather than deleted, to preserve historical accuracy in past challans and reports.
- Challan numbers are generated by counting existing challans (`CH-0001`, `CH-0002`, ...). This is simple and sufficient for this assignment's scale; a production system at high concurrency would use a database sequence instead.
- AWS deployment was intentionally skipped, as explicitly marked optional/bonus in the assignment — free-tier Render/Vercel/Neon were used instead to avoid unnecessary cost and setup time.

## Known Limitations

- No automated test suite (unit/integration tests) — testing was done manually via Postman and the UI due to the 48-hour time constraint.
- No pagination UI controls on the frontend yet (backend supports it; frontend currently fetches a fixed page size).
- Render's free tier causes a cold-start delay after inactivity.
- Role-based **frontend** restrictions (e.g., hiding certain buttons per role) are minimal — the backend correctly enforces role checks on protected actions, but the UI does not yet fully tailor its visible options per role.
- No challan cancellation flow (Cancelled status exists in the schema but no API/UI implements it yet).
