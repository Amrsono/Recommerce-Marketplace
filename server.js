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

app.prepare().then(() => {
  // Import the compiled Express API app
  let apiApp;
  try {
    process.env.IS_HOSTINGER_SERVER = 'true';
    apiApp = require(path.join(__dirname, 'apps/api/dist/index.js')).default;
    console.log('> Express API loaded successfully.');
  } catch (e) {
    console.error('> Failed to load Express API. Ensure it is built.', e.message);
  }

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname || '';
    
    console.log(`[Server] ${req.method} ${req.url} -> pathname: ${pathname} apiApp: ${!!apiApp}`);
    
    // Route API requests to the Express app
    if (pathname.startsWith('/api') && apiApp) {
      req.url = parsedUrl.path || req.url; // Normalize URL for Express
      console.log(`[Server] Routing to Express: ${req.method} ${req.url}`);
      return apiApp(req, res);
    }
    
    // Otherwise route to Next.js
    console.log(`[Server] Routing to Next.js: ${req.method} ${pathname}`);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});
