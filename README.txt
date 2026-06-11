TrustExam — Refactored Project
================================

HOW TO RUN
----------

1. Backend:
   cd back
   npm install
   node server.js
   # Server starts at http://localhost:5000

2. Frontend (new terminal):
   cd ..              (root of the front/ folder)
   npm install
   npm run dev
   # Dev server starts at http://localhost:5173

3. Open http://localhost:5173 in your browser.
   - Login as Student (needs camera + screen share permission)
   - Login as Proctor (to monitor students)


WHAT CHANGED (Architecture)
-----------------------------

PROBLEM:  Both server.js (backend) and StudentExam.jsx (frontend) were God Objects —
          single files doing HTTP routing, file I/O, socket events, recording,
          timers, AI proctoring, and UI all at once.

SOLUTION: Each class/hook now has ONE responsibility. All dependencies injected
          via constructor (backend) or hook arguments (frontend).

Backend — was: 1 file (server.js, 270 lines doing everything)
Backend — now:
  server.js          — composition root only (~40 lines), wires everything together
  StudentStore.js    — in-memory student state (create, update, grade answers)
  RecordingStore.js  — recording sessions and file I/O (streams, chunking)
  SocketHandler.js   — Socket.IO event handling (join, violations, disconnect)
  Routes.js          — all Express HTTP route definitions

Frontend — was: StudentExam.jsx doing socket, timer, tab guard, AI loop, recording, UI
Frontend — now:
  useExamSocket.js   — socket connection + student state updates
  useTabGuard.js     — detects when student leaves the exam tab
  useExamTimer.js    — countdown timer for the exam
  useProctoring.js   — AI face/head detection (unchanged)
  useRecording.js    — screen + camera recording (unchanged)
  StudentExam.jsx    — UI only, composes the above hooks
  ProctorDashboard.jsx — unchanged
  App.jsx            — unchanged


UNCHANGED PUBLIC API
---------------------
- All REST endpoints:  /api/students, /api/recording/*, /recordings/:file
- All socket events:   student_join, proctor_join, ai_violation, banned, students_update
- All React props:     StudentExam({ session, onLogout }), ProctorDashboard({ session, onLogout })
- Logging and file recording behavior: identical
