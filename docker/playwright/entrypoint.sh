#!/bin/bash
set -e

echo "OmniPost Playwright Service starting..."
echo "Browser contexts dir: /data/browser-contexts"

exec node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'omnipost-playwright' }));
});
server.listen(3500, () => console.log('Playwright health endpoint on :3500'));
"
