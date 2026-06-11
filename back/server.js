const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createContainer, createDefaultVideosDir } = require('./di/diContainer');

const app = express();
const server = http.createServer(app);

// Единая конфигурация безопасности
const corsOptions = {
  origin: "https://trustexam-ideal-structure.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));

// Инициализация Socket.io с теми же правилами
const io = new Server(server, {
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