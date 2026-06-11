const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createContainer, createDefaultVideosDir } = require('./di/diContainer');

const app = express();
const server = http.createServer(app);

// Единая настройка CORS для API и Сокетов
const corsOptions = {
  origin: "*", // Разрешить всё на время отладки
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false // Если origin: "*", credentials должно быть false
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));

const io = new Server(server, {
  cors: corsOptions, // Используем те же правила
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