import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { WriteStream } from 'fs';
import type { RecordingType, ChunkWriteResult } from '../../../shared/types/recording';
import type { IRecordingRepository } from './IRepositories';

interface RecordingSession {
  hash: string;
  screenStream: WriteStream;
  faceStream: WriteStream;
  screenChunks: number;
  faceChunks: number;
  startTime: number;
}

export class FileRecordingRepository implements IRecordingRepository {
  private _dir: string;
  private _sessions: Record<string, RecordingSession> = {};

  constructor(videosDir: string) {
    this._dir = videosDir;
    if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
  }

  startSession(studentId: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${studentId}_${Date.now()}_${Math.random()}`)
      .digest('hex').slice(0, 16);

    const screenPath = path.join(this._dir, `${hash}_screen.webm`);
    const facePath = path.join(this._dir, `${hash}_face.webm`);

    this._sessions[studentId] = {
      hash,
      screenStream: fs.createWriteStream(screenPath),
      faceStream: fs.createWriteStream(facePath),
      screenChunks: 0,
      faceChunks: 0,
      startTime: Date.now(),
    };

    console.log(`[REC] Started ${studentId} → ${hash}`);
    return hash;
  }

  getSession(studentId: string): RecordingSession | null {
    return this._sessions[studentId] || null;
  }

  writeChunk(studentId: string, type: RecordingType, buffer: Buffer): ChunkWriteResult | null {
    const session = this._sessions[studentId];
    if (!session) return null;
    if (type === 'face') {
      session.faceStream.write(buffer);
      session.faceChunks++;
    } else {
      session.screenStream.write(buffer);
      session.screenChunks++;
    }
    return { screenChunks: session.screenChunks, faceChunks: session.faceChunks };
  }

  stopSession(studentId: string): Promise<{ hash: string; screenSize: number; faceSize: number; duration: number }> {
    return new Promise((resolve, reject) => {
      const session = this._sessions[studentId];
      if (!session) return reject(new Error('No active recording'));

      let closed = 0;
      const onClose = () => {
        closed++;
        if (closed < 2) return;

        const screenPath = path.join(this._dir, `${session.hash}_screen.webm`);
        const facePath = path.join(this._dir, `${session.hash}_face.webm`);
        const screenSize = fs.existsSync(screenPath) ? fs.statSync(screenPath).size : 0;
        const faceSize = fs.existsSync(facePath) ? fs.statSync(facePath).size : 0;
        const duration = Math.round((Date.now() - session.startTime) / 1000);

        delete this._sessions[studentId];
        console.log(`[REC] Stopped ${session.hash} (${duration}s, screen:${screenSize}b face:${faceSize}b)`);
        resolve({ hash: session.hash, screenSize, faceSize, duration });
      };

      session.screenStream.end(onClose);
      session.faceStream.end(onClose);
    });
  }

  listAll() {
    if (!fs.existsSync(this._dir)) return [];
    return fs.readdirSync(this._dir)
      .filter(f => f.endsWith('_screen.webm'))
      .map(f => {
        const hash = f.replace('_screen.webm', '');
        const screenPath = path.join(this._dir, `${hash}_screen.webm`);
        const facePath = path.join(this._dir, `${hash}_face.webm`);
        const screenStat = fs.statSync(screenPath);
        const faceStat = fs.existsSync(facePath) ? fs.statSync(facePath) : null;
        return { hash, screenPath, facePath, screenStat, faceStat };
      })
      .sort((a, b) => b.screenStat.birthtime.getTime() - a.screenStat.birthtime.getTime());
  }

  fileExists(filename: string): boolean {
    return fs.existsSync(path.join(this._dir, filename));
  }

  fileStats(filename: string): { size: number } | null {
    const p = path.join(this._dir, filename);
    return fs.existsSync(p) ? fs.statSync(p) : null;
  }

  createReadStream(filename: string, options?: { start?: number; end?: number }) {
    return fs.createReadStream(path.join(this._dir, filename), options);
  }
}
