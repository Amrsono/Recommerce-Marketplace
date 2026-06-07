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
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});
