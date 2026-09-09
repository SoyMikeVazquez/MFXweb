import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function galleryAdminPlugin() {
  return {
    name: 'gallery-admin-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle saving the full images_canonical.json
        if (req.method === 'POST' && req.url === '/api/gallery') {
          try {
            const body = await new Promise((resolve, reject) => {
              let data = [];
              req.on('data', chunk => data.push(chunk));
              req.on('end', () => resolve(Buffer.concat(data).toString()));
              req.on('error', reject);
            });

            const parsed = JSON.parse(body);
            const targetPath = './public/imagenes web/imagenes/images_canonical.json';
            
            fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Gallery updated successfully' }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Handle getting views
        if (req.method === 'GET' && req.url === '/api/views') {
          try {
            const viewsPath = './data/views.json';
            let views = {};
            if (fs.existsSync(viewsPath)) {
              views = JSON.parse(fs.readFileSync(viewsPath, 'utf-8'));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, views }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Handle incrementing a view count
        if (req.method === 'POST' && req.url === '/api/views') {
          try {
            const body = await new Promise((resolve, reject) => {
              let data = [];
              req.on('data', chunk => data.push(chunk));
              req.on('end', () => resolve(Buffer.concat(data).toString()));
              req.on('error', reject);
            });

            const { filename } = JSON.parse(body);
            if (!filename) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing filename' }));
              return;
            }

            const viewsPath = './data/views.json';
            let views = {};
            if (fs.existsSync(viewsPath)) {
              views = JSON.parse(fs.readFileSync(viewsPath, 'utf-8'));
            }

            views[filename] = (views[filename] || 0) + 1;
            fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2), 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, views: views[filename] }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Handle uploading a new image file and updating images_canonical.json
        if (req.method === 'POST' && req.url === '/api/upload') {
          try {
            const body = await new Promise((resolve, reject) => {
              let data = [];
              req.on('data', chunk => data.push(chunk));
              req.on('end', () => resolve(Buffer.concat(data).toString()));
              req.on('error', reject);
            });

            const { filename, base64Data, hover_caption, categories } = JSON.parse(body);
            if (!filename || !base64Data) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing filename or base64Data' }));
              return;
            }

            // Extract pure base64 content if it's a data URL
            let base64 = base64Data;
            if (base64.includes(';base64,')) {
              base64 = base64.split(';base64,')[1];
            }

            const buffer = Buffer.from(base64, 'base64');
            const destDir = './public/imagenes web/imagenes';
            const destPath = path.join(destDir, filename);

            // Write image to disk
            fs.writeFileSync(destPath, buffer);

            if (JSON.parse(body).raw) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                data: {
                  src_url: `/imagenes web/imagenes/${filename}`,
                  filename
                }
              }));
              return;
            }

            // Load and update images_canonical.json
            const jsonPath = path.join(destDir, 'images_canonical.json');
            let gallery = [];
            if (fs.existsSync(jsonPath)) {
              gallery = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            }

            // Calculate new order (max order + 1 or 1)
            const maxOrder = gallery.reduce((max, img) => {
              const o = typeof img.order === 'number' ? img.order : parseInt(img.order) || 0;
              return o > max ? o : max;
            }, 0);

            const newEntry = {
              src_url: `/imagenes web/imagenes/${filename}`,
              filename: filename,
              hover_caption: hover_caption || filename.split('.')[0],
              categories: categories || [],
              order: maxOrder + 1
            };

            gallery.push(newEntry);
            fs.writeFileSync(jsonPath, JSON.stringify(gallery, null, 2), 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: newEntry }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    galleryAdminPlugin(),
  ],
  server: {
    watch: {
      ignored: ['**/data/**'],
    },
  },
  build: {
    outDir: 'out',
    emptyOutDir: true,
  },
})

