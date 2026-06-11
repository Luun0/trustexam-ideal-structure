/**
 * DI Container — composition root: wires all layers together.
 */

const path = require('path');

const InMemoryStudentRepository = require('../infrastructure/repositories/InMemoryStudentRepository');
const FileRecordingRepository = require('../infrastructure/repositories/FileRecordingRepository');
const BanGateway = require('../infrastructure/socket/BanGateway');
const BroadcastNotifier = require('../application/BroadcastNotifier');
const StudentService = require('../application/StudentService');
const RecordingService = require('../application/RecordingService');
const SocketHandler = require('../presentation/SocketHandler');
const Routes = require('../presentation/Routes');

function createContainer({ io, videosDir }) {
  const studentRepository = new InMemoryStudentRepository();
  const recordingRepository = new FileRecordingRepository(videosDir);
  const banGateway = new BanGateway(io);
  const broadcastNotifier = new BroadcastNotifier(io, studentRepository);

  const studentService = new StudentService(
    studentRepository,
    broadcastNotifier,
    banGateway
  );

  const recordingService = new RecordingService(
    recordingRepository,
    studentService
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

function createDefaultVideosDir() {
  return path.join(__dirname, '..', 'recordings');
}

module.exports = { createContainer, createDefaultVideosDir };
