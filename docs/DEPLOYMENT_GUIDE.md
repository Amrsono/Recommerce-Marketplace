# 🚀 Lotsitems VPS Deployment Guide

> This guide documents the complete process for deploying the Lotsitems Marketplace
> to a VPS (Virtual Private Server), including the one-time setup, how auto-deploy
> works, and how to deploy manually if needed. All terminal commands are written
> for **PowerShell (Windows)**.

---

## 📐 Architecture Overview

```
Internet
   │
   ▼
lotsitems.com (port 80)
   │
   ▼
Nginx (reverse proxy)
   ├── /        → Next.js frontend  (127.0.0.1:3000)
   └── /api     → Express API       (127.0.0.1:5000)
   
Both processes managed by PM2 on the VPS.
Database: PostgreSQL (port 5432)
```

| Service        | Internal Port | Public URL                        |
|----------------|--------------|-----------------------------------|
| Next.js (web)  | 3000         | `http://lotsitems.com/`           |
| Express (API)  | 5000         | `http://lotsitems.com/api`        |
| PostgreSQL     | 5432         | Internal only                     |

---

## 🔑 Default Admin Credentials

| Field    | Value             |
|----------|-------------------|
| Email    | `admin@test.com`  |
| Password | `password123`     |

> These are auto-seeded by the API on startup via the `ensureAdmin()` function.

---

## ⚡ How Auto-Deploy Works (GitHub Actions)

Every time you `git push` to the `main` branch, GitHub Actions automatically:

1. SSHs into the VPS
2. Runs `git pull` to get latest code
3. Writes the production `.env` file (since `.env` is gitignored)
4. Installs dependencies
5. Runs Prisma migrations
6. Rebuilds the Next.js app (with correct `NEXT_PUBLIC_API_URL` baked in)
7. Reloads PM2 processes

Workflow file: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

---

## 🛠️ One-Time VPS Setup

These steps only need to be done **once** when setting up a new VPS.

### 1. Install Node.js, PM2, and Nginx

SSH into your VPS, then run:

```bash
# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install Git
sudo apt-get install -y git
```

### 2. Clone the Repository

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Amrsono/Recommerce-Marketplace.git recommerce-marketplace
cd recommerce-marketplace
```

### 3. Set Up Nginx Config

```bash
# Copy the nginx config
sudo cp scripts/nginx.conf /etc/nginx/sites-available/lotsitems
sudo ln -s /etc/nginx/sites-available/lotsitems /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Set Up PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE lotsitems;"
sudo -u postgres psql -c "CREATE USER lotsitems WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lotsitems TO lotsitems;"
```

### 5. Create the API .env File

```bash
cat > /var/www/recommerce-marketplace/apps/api/.env << 'EOF'
DATABASE_URL=postgresql://lotsitems:yourpassword@localhost:5432/lotsitems
NODE_ENV=production
PORT=5000
JWT_SECRET=your_jwt_secret_here
EOF
```

### 6. Create the Frontend .env File

> ⚠️ CRITICAL: `NEXT_PUBLIC_*` variables are baked in at **build time**.
> This file must be present BEFORE running `npm run build`.

```bash
echo "NEXT_PUBLIC_API_URL=http://lotsitems.com/api" > /var/www/recommerce-marketplace/apps/lotsitems-admin/.env
```

### 7. Install, Build & Start

```bash
cd /var/www/recommerce-marketplace

npm install
npm run generate --workspace=database
npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss
npm run build

pm2 start scripts/pm2.config.js --env production
pm2 save
pm2 startup  # Follow the printed command to enable PM2 on reboot
```

---

## 🔁 One-Time GitHub Actions Setup

This enables push-to-deploy from your local machine.

### Step 1 — Generate SSH Key on VPS

```bash
# Run on your VPS
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Print the private key — copy this entire output
cat ~/.ssh/github_actions
```

### Step 2 — Add Secrets to GitHub

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name    | Value                                      |
|----------------|--------------------------------------------|
| `VPS_HOST`     | `lotsitems.com`                            |
| `VPS_USER`     | `root` (or your SSH username)              |
| `VPS_SSH_KEY`  | The full private key printed in Step 1     |
| `VPS_PORT`     | `22`                                       |

### Step 3 — Done!

From now on, every `git push` to `main` triggers auto-deploy.
Watch it live: **GitHub Repo → Actions tab**

---

## 💻 Manual Deploy (from your Windows PC via PowerShell)

Use this when you want to push changes without waiting for GitHub Actions,
or if Actions is not yet configured.

### Push code changes

```powershell
# Stage and commit your changes
git add .
git commit -m "your message here"
git push origin main
```

### Then on the VPS (SSH in and run):

```bash
cd /var/www/recommerce-marketplace
echo "NEXT_PUBLIC_API_URL=http://lotsitems.com/api" > apps/lotsitems-admin/.env
bash scripts/deploy-vps.sh
```

Or step by step:

```bash
cd /var/www/recommerce-marketplace
git pull origin main
echo "NEXT_PUBLIC_API_URL=http://lotsitems.com/api" > apps/lotsitems-admin/.env
npm install
npm run generate --workspace=database
npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss
npm run build
pm2 reload scripts/pm2.config.js
pm2 save
```

---

## 🐛 Troubleshooting

### "Login failed: Failed to fetch"

**Cause:** `NEXT_PUBLIC_API_URL` is set to `localhost` and baked into the build.

**Fix:**
```bash
# On VPS
echo "NEXT_PUBLIC_API_URL=http://lotsitems.com/api" > apps/lotsitems-admin/.env
npm run build --workspace=apps/lotsitems-admin
pm2 reload scripts/pm2.config.js
```

---

### PM2 process not found

```bash
pm2 list                        # See what's running
pm2 start scripts/pm2.config.js # Start fresh
pm2 reload scripts/pm2.config.js # Reload existing
pm2 restart all                  # Restart everything
```

---

### Check application logs

```bash
pm2 logs lotsitems-api   # API logs
pm2 logs lotsitems-web   # Frontend logs
pm2 logs                 # All logs
pm2 monit                # Live dashboard
```

---

### Nginx not routing correctly

```bash
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload after changes
sudo cat /var/log/nginx/error.log # Check errors
```

---

### Database migration issues

```bash
cd /var/www/recommerce-marketplace
npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss
```

---

## 📁 Key File Locations

| File | Purpose |
|------|---------|
| `scripts/nginx.conf` | Nginx reverse proxy config |
| `scripts/pm2.config.js` | PM2 process manager config (ports, env vars) |
| `scripts/deploy-vps.sh` | Manual deploy script |
| `.github/workflows/deploy.yml` | GitHub Actions auto-deploy workflow |
| `apps/lotsitems-admin/.env` | Frontend env vars (**gitignored**, must be set on VPS manually) |
| `apps/api/.env` | API env vars (**gitignored**, must be set on VPS manually) |

---

## ⚠️ Important Rules

1. **Never commit `.env` files** — they are gitignored for security.
2. **Always rebuild after changing `NEXT_PUBLIC_*`** — these are baked in at build time, not runtime.
3. **`pm2 save` after any process changes** — ensures processes restart after a VPS reboot.
4. **The API runs on port 5000 internally** — Nginx exposes it publicly at `/api`.
5. **The frontend runs on port 3000 internally** — Nginx exposes it publicly at `/`.

---

*Last Updated: May 2026*
