/**
 * TrustExam — Backend (Clean Architecture)
 *
 * Composition root only. All logic lives in dedicated layers:
 *   domain/          — entities, business rules (pure)
 *   application/     — use-case orchestration (services)
 *   infrastructure/  — persistence, file I/O, socket gateway
 *   presentation/    — HTTP routes, Socket.IO event mapping
 *   di/              — dependency injection container
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { createContainer, createDefaultVideosDir } = require('./di/diContainer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e8,
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100mb' }));

const container = createContainer({
  io,
  videosDir: createDefaultVideosDir(),
});

container.socketHandler.register();
app.use('/', container.routes.router);

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 TrustExam: http://localhost:${PORT}`));
