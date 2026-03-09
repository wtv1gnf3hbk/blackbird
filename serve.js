// Simple static file server with range request support (needed for video seeking on iOS)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  const file = path.join(DIR, req.url === '/' ? '/index.html' : req.url);
  const ext = path.extname(file);

  fs.stat(file, (err, stat) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }

    // Range requests for video seeking on iOS Safari
    const range = req.headers.range;
    if (range && ext === '.mp4') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': MIME[ext] || 'application/octet-stream',
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': stat.size,
      });
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Blackbird prototype → http://localhost:${PORT}`);
  // Show LAN URL for testing on phone
  const nets = require('os').networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  Phone testing → http://${net.address}:${PORT}`);
      }
    }
  }
});
