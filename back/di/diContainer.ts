import path from 'path';
import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '../../shared/types/socket';
import { InMemoryStudentRepository } from '../infrastructure/repositories/InMemoryStudentRepository';
import { FileRecordingRepository } from '../infrastructure/repositories/FileRecordingRepository';
import { BanGateway } from '../infrastructure/socket/BanGateway';
import { BroadcastNotifier } from '../application/BroadcastNotifier';
import { StudentService } from '../application/StudentService';
import { RecordingService } from '../application/RecordingService';
import { SocketHandler } from '../presentation/SocketHandler';
import { Routes } from '../presentation/Routes';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function createContainer({ io, videosDir }: { io: AppServer; videosDir: string }) {
  const studentRepository = new InMemoryStudentRepository();
  const recordingRepository = new FileRecordingRepository(videosDir);
  const banGateway = new BanGateway(io);
  const broadcastNotifier = new BroadcastNotifier(io, studentRepository);

  const studentService = new StudentService(
    studentRepository,
    broadcastNotifier,
    banGateway,
  );

  const recordingService = new RecordingService(
    recordingRepository,
    studentService,
  );

  const socketHandler = new SocketHandler(io, studentService);
  const routes = new Routes(studentService, recordingService);

  return {
    studentRepository,
    recordingRepository,
    banGateway,
    broadcastNotifier,
    studentService,
    recordingService,
    socketHandler,
    routes,
  };
}

export function createDefaultVideosDir(): string {
  return process.env.VIDEOS_DIR || path.join(process.cwd(), 'recordings');
}
