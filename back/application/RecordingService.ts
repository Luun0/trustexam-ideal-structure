import type { RecordingListItem, StopRecordingResult, RecordingType } from '../../shared/types/recording';
import type { IRecordingRepository } from '../infrastructure/repositories/IRepositories';
import type { StudentService } from './StudentService';

export class RecordingService {
  constructor(
    private _recording: IRecordingRepository,
    private _students: StudentService,
  ) {}

  startSession(studentId: string): string {
    const hash = this._recording.startSession(studentId);
    this._students.attachRecording(studentId, hash);
    return hash;
  }

  writeChunk(studentId: string, type: RecordingType, buffer: Buffer) {
    return this._recording.writeChunk(studentId, type, buffer);
  }

  async stopSession(studentId: string): Promise<StopRecordingResult> {
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

  listAll(): RecordingListItem[] {
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

  fileExists(filename: string): boolean {
    return this._recording.fileExists(filename);
  }

  fileStats(filename: string) {
    return this._recording.fileStats(filename);
  }

  createReadStream(filename: string, options?: { start?: number; end?: number }) {
    return this._recording.createReadStream(filename, options);
  }
}
