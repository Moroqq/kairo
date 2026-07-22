import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import corsPlugin from '@fastify/cors';
import { registerAccountRoutes } from './routes/accounts.js';
import { registerPairingRoutes } from './routes/pairing.js';
import { registerRecoveryRoutes } from './routes/recovery.js';
import { registerSyncRoutes } from './routes/sync.js';
import { registerAiRoutes } from './routes/ai.js';
import './db.js'; // инициализирует схему при старте

const app = Fastify({ logger: true });

await app.register(corsPlugin, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
await app.register(websocketPlugin);

app.get('/health', async () => ({ ok: true }));

registerAccountRoutes(app);
registerPairingRoutes(app);
registerRecoveryRoutes(app);
registerSyncRoutes(app);
registerAiRoutes(app);

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '0.0.0.0';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
