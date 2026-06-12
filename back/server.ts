import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createContainer, createDefaultVideosDir } from './di/diContainer';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '../shared/types/socket';

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e8,
});

const container = createContainer({
  io,
  videosDir: createDefaultVideosDir(),
});

container.socketHandler.register();
app.use('/', container.routes.router);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 TrustExam: port ${PORT}`));
