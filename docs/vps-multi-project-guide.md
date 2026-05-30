# Multi-Project VPS Hosting Architecture Guide

This document serves as the master guide for hosting **multiple web applications** on your **Hostinger VPS** (`89.116.38.70`). 

---

## 🏗️ The Multi-Tenant Architecture

To run multiple independent projects on the same VPS, we use a modular, isolated architecture:

```mermaid
graph TD
    Client[Incoming Request] -->|Port 80/443| Nginx{Nginx Reverse Proxy}
    Nginx -->|lotsitems.com| NextJS1[lotsitems Next.js - Port 3000]
    Nginx -->|lotsitems.com/api| Express1[lotsitems Express - Port 5000]
    Nginx -->|anotherproject.com| NextJS2[project2 Next.js - Port 3001]
    Nginx -->|anotherproject.com/api| Express2[project2 Express - Port 5001]
```

### 1. Isolated File Structure `/var/www/`
Each project has its own dedicated folder in the `/var/www/` directory to prevent file conflicts:
* `/var/www/recommerce-marketplace/` (This project - Lotsitems)
* `/var/www/another-project/` (Future project)
* `/var/www/third-project/` (Future project)

### 2. Isolated Nginx Virtual Hosts
Nginx handles multiple domains using separate configuration files in `/etc/nginx/sites-available/`.
* For each new project, we create a new config file (e.g., `/etc/nginx/sites-available/another-project`).
* This keeps domains completely isolated. If one configuration has an issue, other websites remain online.

### 3. Port Allocation Registry
Each Node.js app or API must run on a unique local port. Here is our master port registry:

| Port | Service | Project | Status |
| :--- | :--- | :--- | :--- |
| **3000** | Next.js Frontend | Lotsitems (lotsitems.com) | **Active** |
| **5000** | Express API | Lotsitems (lotsitems.com/api) | **Active** |
| **5432** | PostgreSQL Database | Lotsitems (Docker local) | **Active** |
| **6379** | Redis Cache | Lotsitems (Docker local) | **Active** |
| **3001** | *Next.js Frontend* | *Future Project* | *Available* |
| **5001** | *Express API / Backend* | *Future Project* | *Available* |
| **3002** | *Next.js Frontend* | *Future Project* | *Available* |
| **5002** | *Express API / Backend* | *Future Project* | *Available* |

---

## 🚀 How to Add a New Project in the Future

When you are ready to upload a second project, follow these simple steps:

### Step A: Clone & Set Up Files
1. SSH into the server: `ssh root@89.116.38.70`.
2. Clone the code into a new folder:
   ```bash
   cd /var/www
   git clone https://github.com/USERNAME/NEW_REPO.git new-project
   ```
3. Create a unique `.env` file for the new project using different ports (e.g., Frontend on `3001`, Backend API on `5001`).

### Step B: Database Isolation
You have two options for hosting the database of a new project:
1. **Shared PostgreSQL instance**: Connect the new project to the existing local Postgres Docker container, but use a new database name (e.g., `postgresql://postgres:postgres@localhost:5432/new_project_db`).
2. **Dedicated Docker container**: Run a separate PostgreSQL container mapped to a different port (e.g., port `5433`).

### Step C: Configure PM2
Update the new project's PM2 config to specify its unique port and name:
```javascript
// new-project/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "new-project-web",
      script: "npm",
      args: "run start",
      env: { PORT: 3001 }
    }
  ]
}
```
Run `pm2 start ecosystem.config.js` and save the process list: `pm2 save`.

### Step D: Set Up Nginx & SSL
1. Create a new Nginx server configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/new-project
   ```
2. Paste the virtual host structure, routing the domain to the new ports:
   ```nginx
   server {
       listen 80;
       server_name newproject.com www.newproject.com;

       location / {
           proxy_pass http://127.0.0.1:3001; # Next.js on Port 3001
           proxy_set_header Host $host;
           # ... standard headers
       }
   }
   ```
3. Enable it and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/new-project /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
4. Secure it with SSL:
   ```bash
   sudo certbot --nginx -d newproject.com -d www.newproject.com
   ```
