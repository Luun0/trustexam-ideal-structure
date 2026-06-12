import express, { Router, Request, Response } from 'express';
import type { StudentService } from '../application/StudentService';
import type { RecordingService } from '../application/RecordingService';
import type { RecordingType } from '../../shared/types/recording';

export class Routes {
  readonly router: Router;
  private _students: StudentService;
  private _recording: RecordingService;

  constructor(studentService: StudentService, recordingService: RecordingService) {
    this._students = studentService;
    this._recording = recordingService;
    this.router = express.Router();
    this._register();
  }

  private _register(): void {
    const r = this.router;

    r.get('/recordings/:file', (req: Request, res: Response) => {
      const { file } = req.params;
      if (!this._recording.fileExists(file)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const stat = this._recording.fileStats(file)!;
      const fileSize = stat.size;
      const range = req.headers.range;

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

    r.get('/api/students', (_req, res) => res.json(this._students.getAll()));

    r.get('/api/recordings', (_req, res) => {
      res.json(this._recording.listAll());
    });

    r.post('/api/students/:id/comment', (req, res) => {
      const ok = this._students.addComment(req.params.id, req.body);
      ok ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
    });

    r.post('/api/students/:id/verdict', (req, res) => {
      const ok = this._students.setVerdict(req.params.id, req.body.verdict);
      ok ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
    });

    r.post('/api/students/:id/score', (req, res) => {
      const ok = this._students.setScore(req.params.id, req.body.score);
      ok ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
    });

    r.post('/api/students/:id/submit-answers', (req, res) => {
      const result = this._students.submitAnswers(req.params.id, req.body.answers);
      result ? res.json(result) : res.status(404).json({ error: 'Not found' });
    });

    r.post('/api/recording/start', (req, res) => {
      const { studentId } = req.body;
      const hash = this._recording.startSession(studentId);
      res.json({ hash });
    });

    r.post('/api/recording/chunk', express.raw({ type: 'video/webm', limit: '20mb' }), (req, res) => {
      const studentId = req.headers['x-student-id'] as string;
      const type = req.headers['x-recording-type'] as RecordingType;
      const result = this._recording.writeChunk(studentId, type, Buffer.from(req.body));
      result ? res.json({ success: true, ...result }) : res.status(404).json({ error: 'No session' });
    });

    r.post('/api/recording/stop', async (req, res) => {
      const data = await this._recording.stopSession(req.body.studentId);
      res.json(data);
    });
  }
}
