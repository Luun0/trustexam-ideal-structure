/**
 * Routes — presentation layer: maps HTTP requests to application services.
 */

const express = require('express');

class Routes {
  constructor(studentService, recordingService) {
    this._students = studentService;
    this._recording = recordingService;
    this.router = express.Router();
    this._register();
  }

  _register() {
    const r = this.router;

    r.get('/recordings/:file', (req, res) => {
      const { file } = req.params;
      if (!this._recording.fileExists(file)) {
        return res.status(404).json({ error: 'Not found' });
      }
      const stat = this._recording.fileStats(file);
      const fileSize = stat.size;
      const range = req.headers.range;

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'video/webm');
      res.setHeader('Accept-Ranges', 'bytes');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': end - start + 1,
        });
        this._recording.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Length': fileSize });
        this._recording.createReadStream(file).pipe(res);
      }
    });

    r.get('/api/students', (req, res) => {
      res.json(this._students.getAll());
    });

    r.post('/api/students/:id/comment', (req, res) => {
      const ok = this._students.addComment(req.params.id, {
        author: req.body.author || 'Проктор',
        text: req.body.text,
      });
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    });

    r.post('/api/students/:id/verdict', (req, res) => {
      const ok = this._students.setVerdict(req.params.id, req.body.verdict);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    });

    r.post('/api/students/:id/score', (req, res) => {
      const ok = this._students.setScore(req.params.id, req.body.score);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    });

    r.post('/api/students/:id/submit-answers', (req, res) => {
      const result = this._students.submitAnswers(req.params.id, req.body.answers || {});
      if (!result) return res.status(404).json({ error: 'Not found' });
      res.json(result);
    });

    r.post('/api/recording/start', (req, res) => {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ error: 'studentId required' });
      const hash = this._recording.startSession(studentId);
      res.json({ hash });
    });

    r.post('/api/recording/chunk',
      express.raw({ type: 'video/webm', limit: '20mb' }),
      (req, res) => {
        const studentId = req.headers['x-student-id'];
        const type = req.headers['x-recording-type'];
        const result = this._recording.writeChunk(studentId, type, Buffer.from(req.body));
        if (!result) return res.status(404).json({ error: 'No active recording' });
        res.json({ success: true, type, ...result });
      }
    );

    r.post('/api/recording/stop', async (req, res) => {
      const { studentId } = req.body;
      try {
        const data = await this._recording.stopSession(studentId);
        res.json(data);
      } catch (err) {
        res.status(404).json({ error: err.message });
      }
    });

    r.get('/api/recordings', (req, res) => {
      res.json(this._recording.listAll());
    });
  }
}

module.exports = Routes;
