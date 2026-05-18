# Make Use Marketplace: Vercel Migration Guide

This document summarizes the steps to migrate the Web and API apps to Vercel using the **2-Project Monorepo Strategy**.

## 1. Vercel Project Setup (Dashboard)

You need to create two separate projects in Vercel. Both will point to the same GitHub repository.

### Project A: `used4cash-web` (Frontend)
1.  **Import** the repository in Vercel.
2.  **Project Name**: `used4cash-web`
3.  **Root Directory**: `apps/used4cash-admin` (Important!)
4.  **Framework Preset**: `Next.js`
5.  **Build Command**: `npm run build`
6.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The URL of Project B (e.g., `https://used4cash-api.vercel.app/api`)
    *   `DATABASE_URL`: Your Neon/Postgres connection string (Required for `prisma generate`)

---

## 2. Monorepo Configuration (Vercel Dashboard)
To prevent the "Prisma schema not found" error during build:
1.  Go to **Settings** > **General**.
2.  Locate **Root Directory** and ensure it is set to `apps/used4cash-admin`.
3.  **CRITICAL**: Ensure that **"Include source files from outside of the Root Directory"** is enabled. This allows the build process to reach `../../packages/database`.

---

### Project B: `used4cash-api` (Backend)
1.  **Import** the repository again in Vercel.
2.  **Project Name**: `used4cash-api`
3.  **Root Directory**: `apps/api` (Important!)
4.  **Framework Preset**: `Other` (Vercel will detect `vercel.json`)
5.  **Build Command**: `npm run build`
6.  **Environment Variables**:
    *   `DATABASE_URL`: (Auto-linked via Vercel Postgres)
    *   `POSTGRES_PRISMA_URL`: (Auto-linked via Vercel Postgres)

---

## 2. Provisioning the Database

1.  In the Vercel Dashboard, go to the **Storage** tab.
2.  Click **Create** > **Postgres**.
3.  Choose a region close to you.
4.  **Connect** the database to **both** `used4cash-web` and `used4cash-api` projects. This automatically injects the `POSTGRES_*` environment variables.

---

## 3. Initial Database Setup

Since we are deploying fresh from GitHub:
1.  Open your terminal in the `packages/database` directory.
2.  Ensure you have the Vercel Postgres connection string in your local `.env`.
3.  Run:
    ```bash
    npx prisma db push
    npx prisma db seed
    ```
*This will create the tables and populate the admin account (`admin@test.com`) and sample data.*

---

## 4. Technical Details
- **Prisma Singleton**: Optimized in `apps/api/src/db.ts` to prevent connection exhaustion.
- **Monorepo**: Root `package.json` manages workspaces.
- **Serverless API**: `apps/api/vercel.json` routes all `/api` traffic to the Express handler.
