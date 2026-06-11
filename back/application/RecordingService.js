/**
 * RecordingService — application layer: orchestrates recording use cases.
 */

class RecordingService {
  constructor(recordingRepository, studentService) {
    this._recording = recordingRepository;
    this._students = studentService;
  }

  startSession(studentId) {
    const hash = this._recording.startSession(studentId);
    this._students.attachRecording(studentId, hash);
    return hash;
  }

  writeChunk(studentId, type, buffer) {
    return this._recording.writeChunk(studentId, type, buffer);
  }

  async stopSession(studentId) {
    const data = await this._recording.stopSession(studentId);
    this._students.setRecordingDuration(studentId, data.duration);
    return {
      hash: data.hash,
      screenUrl: `/recordings/${data.hash}_screen.webm`,
      faceUrl: `/recordings/${data.hash}_face.webm`,
      screenSize: data.screenSize,
      faceSize: data.faceSize,
      duration: data.duration,
    };
  }

  listAll() {
    return this._recording.listAll().map(({ hash, screenStat, faceStat }) => {
      const student = this._students.findByRecordingHash(hash);
      return {
        hash,
        screenUrl: `/recordings/${hash}_screen.webm`,
        faceUrl: faceStat ? `/recordings/${hash}_face.webm` : null,
        screenSize: screenStat.size,
        faceSize: faceStat?.size || 0,
        created: screenStat.birthtime,
        studentName: student?.name || 'Неизвестно',
        studentId: student?.id || null,
      };
    });
  }

  fileExists(filename) {
    return this._recording.fileExists(filename);
  }

  fileStats(filename) {
    return this._recording.fileStats(filename);
  }

  createReadStream(filename, options) {
    return this._recording.createReadStream(filename, options);
  }
}

module.exports = RecordingService;
