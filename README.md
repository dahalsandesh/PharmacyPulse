# PharmacyPulse (MedStore)

A modern, multi-tenant Pharmacy Management System built for pharmacies in Nepal. Designed to combat stock disparities, track expiries, handle point-of-sale FIFO billing, and provide real-time profit and damage analytics.

## Tech Stack
* **Architecture:** Monorepo
* **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth, node-cron
* **Frontend:** React 18, Vite, Tailwind CSS, Zustand, React Query (TanStack), Recharts
* **Deployment Pattern:** Vercel (Serverless backend + Static frontend)

## Features
1. **Multi-Tenancy Architecture:** Data is strictly isolated by `pharmacyId`, allowing multiple businesses to operate securely on the same SaaS instance under different subscription tiers.
2. **First-In, First-Out (FIFO) Billing:** Sales automatically deduct from the oldest `/` nearest-expiry batches first to prevent dead stock.
3. **Automated Expiry Alerts:** Daily cron jobs flag expired medicines and aggregate alerting mechanisms for 30/60/90 day expiry windows.
4. **Stock Health Intelligence:** Real-time calculation of stock status (`OutOfStock`, `Critical`, `Low`, `Normal`, `High`, `Overstock`) based on dynamic consumption algorithms.
5. **SuperAdmin Portal:** Centralized control for managing pharmacy subscriptions, activating/suspending tenants, and managing organization users.

## Project Structure
```text
PharmacyPulse/
├── backend/            # Express REST API, Mongoose Models, Services, Cron Jobs
├── frontend/           # React + Vite SPA, Zustand state, Tailwind UI
├── vercel.json         # Vercel Monorepo deployment configuration
└── README.md
```

## Running Locally

**Prerequisites:** Node v20+

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/PharmacyPulse.git
   cd PharmacyPulse
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file locally with MONGODB_URI and JWT_SECRET
   npm run seed  # Prompts development database seeding (Superadmin, demo pharmacy)
   npm run dev   # Starts backend on http://localhost:5000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   # Create a .env file locally with VITE_API_URL=http://localhost:5000/api
   npm run dev   # Starts frontend on http://localhost:5174
   ```

**Demo Credentials:**
* Super Admin: `admin@medstore.com` / `admin123`
* Pharmacy Admin: `ram@medstore.com` / `admin123`
* Pharmacy Staff: `sita@medstore.com` / `staff123`

## Phase 1 Prototype Status
This is currently a V1 Prototype. The foundational DB schema, authentication logic, stock management backend, and dashboard UI layouts are completed. Front-end modal/forms for CRUD operations (Add Medicine, Record Damage, Write new Stock) are currently in progress.
