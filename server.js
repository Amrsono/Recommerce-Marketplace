const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const port = process.env.PORT || 3000;
const app = next({
  dev: false,
  dir: path.join(__dirname, 'apps/lotsitems-admin')
});
const handle = app.getRequestHandler();

// Lazy-loaded API app - only loaded on first API request to reduce startup memory
let apiApp = null;
let apiLoadAttempted = false;

function getApiApp() {
  if (!apiLoadAttempted) {
    apiLoadAttempted = true;
    try {
      process.env.IS_HOSTINGER_SERVER = 'true';
      apiApp = require(path.join(__dirname, 'apps/api/dist/index.js')).default;
      console.log('> Express API loaded successfully.');
    } catch (e) {
      console.error('> Failed to load Express API:', e.message);
    }
  }
  return apiApp;
}

app.prepare().then(() => {
  console.log('> Next.js ready. Express API will load on first /api request.');

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname || '';

    // Route API requests to Express
    if (pathname.startsWith('/api')) {
      const expressApp = getApiApp();
      if (expressApp) {
        req.url = parsedUrl.path || req.url;
        console.log(`[API] ${req.method} ${req.url}`);
        return expressApp(req, res);
      } else {
        console.error('[API] Express app not available');
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'API not available - check server logs' }));
        return;
      }
    }

    // All other requests go to Next.js
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});
