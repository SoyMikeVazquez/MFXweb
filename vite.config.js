import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function galleryAdminPlugin(env = {}) {
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

        // Handle saving the full productions.json
        if (req.method === 'POST' && req.url === '/api/productions') {
          try {
            const body = await new Promise((resolve, reject) => {
              let data = [];
              req.on('data', chunk => data.push(chunk));
              req.on('end', () => resolve(Buffer.concat(data).toString()));
              req.on('error', reject);
            });

            const parsed = JSON.parse(body);
            const targetPath = './public/imagenes web/imagenes/productions.json';
            
            fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Productions updated successfully' }));
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

        // Handle contact form submission via Resend
        if (req.method === 'POST' && req.url === '/api/contact') {
          try {
            const body = await new Promise((resolve, reject) => {
              let data = [];
              req.on('data', chunk => data.push(chunk));
              req.on('end', () => resolve(Buffer.concat(data).toString()));
              req.on('error', reject);
            });

            const { name, email, message } = JSON.parse(body);

            if (!name || !email || !message) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Todos los campos son requeridos.' }));
              return;
            }

            const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
            const fromEmail = env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@maquillajefxmexico.com';
            const toEmailRaw = env.CONTACT_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'maquillajefxmexico@gmail.com';
            const recipients = toEmailRaw.split(',').map(e => e.trim()).filter(Boolean);

            if (!resendApiKey) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'RESEND_API_KEY no está configurada.' }));
              return;
            }

            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: `MFX Web <${fromEmail}>`,
                to: recipients,
                reply_to: email,
                subject: `Nuevo mensaje de contacto de ${name} - MFX Web`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #111;">
                    <h2 style="color: #8b0000; border-bottom: 2px solid #8b0000; padding-bottom: 10px;">Nuevo mensaje de contacto (MFX Web)</h2>
                    <p><strong>Nombre:</strong> ${name}</p>
                    <p><strong>Correo del remitente:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Mensaje:</strong></p>
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #8b0000; white-space: pre-wrap;">${message}</div>
                  </div>
                `,
              }),
            });

            const resendData = await resendResponse.json();

            if (!resendResponse.ok) {
              res.writeHead(resendResponse.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: resendData.message || 'Error al enviar correo con Resend.' }));
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: resendData }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Handle lead registration notification via Resend
        if (req.method === 'POST' && req.url === '/api/lead') {
          try {
            const body = await new Promise((resolve, reject) => {
              let data = [];
              req.on('data', chunk => data.push(chunk));
              req.on('end', () => resolve(Buffer.concat(data).toString()));
              req.on('error', reject);
            });

            const { nombre, correo, telefono, curso } = JSON.parse(body);

            const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
            const fromEmail = env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@maquillajefxmexico.com';
            const notifyEmail = env.CONTACT_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'maquillajefxmexico@gmail.com';

            if (resendApiKey) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: `MFX Workshops <${fromEmail}>`,
                  to: [notifyEmail],
                  reply_to: correo,
                  subject: `🔥 Nuevo Lead para Cursos MFX: ${nombre}`,
                  html: `
                    <div style="font-family: sans-serif; padding: 24px; color: #111; max-width: 600px; border: 1px solid #e5e5e5; border-radius: 8px;">
                      <h2 style="color: #8b0000; margin-top: 0;">¡Nuevo alumno interesado en Cursos MFX!</h2>
                      <p style="font-size: 15px; color: #444;">Se ha registrado un nuevo contacto a través de la landing de cursos:</p>
                      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                        <tr><td style="padding: 8px 0; font-weight: bold; width: 140px;">Nombre:</td><td style="padding: 8px 0;">${nombre}</td></tr>
                        <tr><td style="padding: 8px 0; font-weight: bold;">Correo:</td><td style="padding: 8px 0;"><a href="mailto:${correo}">${correo}</a></td></tr>
                        <tr><td style="padding: 8px 0; font-weight: bold;">Teléfono:</td><td style="padding: 8px 0;"><a href="tel:${telefono}">${telefono}</a></td></tr>
                        ${curso ? `<tr><td style="padding: 8px 0; font-weight: bold;">Curso de interés:</td><td style="padding: 8px 0;">${curso}</td></tr>` : ''}
                      </table>
                      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                        Registro guardado exitosamente en la tabla Supabase 'leads'.
                      </div>
                    </div>
                  `,
                }),
              });
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      galleryAdminPlugin(env),
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
  };
})

