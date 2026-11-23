import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { initDB } from './db';
import { setupRoutes } from './routes';
import { setupSocket } from './socket';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. Falling back to local SQLite (sql.js). Set DATABASE_URL in Render for cloud PostgreSQL.');
  }

  // Initialize database (async because sql.js loads WASM)
  await initDB();

  // Setup API routes
  setupRoutes(app, io);

  // Setup Socket.IO
  setupSocket(io);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Glamour Queue server running on http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
