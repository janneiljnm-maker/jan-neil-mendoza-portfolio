import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.argv[2] || 3000);
const root = new URL('./', import.meta.url);
const types = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
  ttf: 'font/ttf',
};

const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!/^(index\.html|styles\.css|animation\.js|portfolio\.js|Pics\/ezgif-frame-\d{3}\.jpg|assets\/(jan-neil-mendoza-resume\.pdf|manrope-regular\.ttf|manrope-bold\.ttf|unbounded-semibold\.ttf))$/.test(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const data = await readFile(new URL(file, root));
    const extension = file.split('.').pop();
    response.writeHead(200, {
      'Content-Type': types[extension],
      'Content-Length': data.length,
      'Cache-Control': ['jpg', 'ttf'].includes(extension) ? 'public, max-age=3600' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Unable to load file');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local preview: http://localhost:${port}`);
});
