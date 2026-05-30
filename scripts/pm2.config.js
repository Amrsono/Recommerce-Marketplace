module.exports = {
  apps: [
    {
      name: "lotsitems-api",
      cwd: "/var/www/recommerce-marketplace/apps/api",
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },
    {
      name: "lotsitems-web",
      cwd: "/var/www/recommerce-marketplace/apps/lotsitems-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "http://lotsitems.com/api"
      }
    }
  ]
};
