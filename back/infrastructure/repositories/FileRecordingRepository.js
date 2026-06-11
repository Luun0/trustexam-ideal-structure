/**
 * FileRecordingRepository — infrastructure: recording sessions and file I/O.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileRecordingRepository {
  constructor(videosDir) {
    this._dir = videosDir;
    if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
    this._sessions = {};
  }

  startSession(studentId) {
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

  getSession(studentId) {
    return this._sessions[studentId] || null;
  }

  writeChunk(studentId, type, buffer) {
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

  stopSession(studentId) {
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
      .sort((a, b) => b.screenStat.birthtime - a.screenStat.birthtime);
  }

  fileExists(filename) {
    return fs.existsSync(path.join(this._dir, filename));
  }

  fileStats(filename) {
    const p = path.join(this._dir, filename);
    return fs.existsSync(p) ? fs.statSync(p) : null;
  }

  createReadStream(filename, options) {
    return fs.createReadStream(path.join(this._dir, filename), options);
  }
}

module.exports = FileRecordingRepository;
