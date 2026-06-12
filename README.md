# TrustExam — Clean Architecture + TypeScript

Система онлайн-прокторинга с разделением на слои по принципам **High Cohesion, Low Coupling**.

## Запуск

### Backend
```bash
cd back
npm install
npm run build
npm start
# → http://localhost:5000
```

Разработка с hot-reload:
```bash
cd back
npm run dev
```

### Frontend
```bash
npm install
npm run dev
# → http://localhost:5173
```

Откройте http://localhost:5173:
- **Студент** — камера + шейринг экрана
- **Проктор** — мониторинг, оценки, записи

---

## Архитектура

### Shared (`shared/types/`)

Общие TypeScript-контракты для frontend и backend:
- `student.ts` — Student, Comment, GradeResult
- `recording.ts` — RecordingListItem, StopRecordingResult
- `socket.ts` — ServerToClientEvents, ClientToServerEvents
- `chat.ts` — ChatMessage
- `session.ts` — Session (логин)

### Backend (`back/`)

```
back/
├── domain/                    # Бизнес-правила (чистая логика, без I/O)
│   ├── examConfig.ts
│   ├── AnswerGrader.ts
│   ├── ViolationRules.ts
│   ├── StudentFactory.ts
│   └── CommentFactory.ts
│
├── application/               # Сценарии использования (оркестрация)
│   ├── StudentService.ts
│   ├── RecordingService.ts
│   └── BroadcastNotifier.ts
│
├── infrastructure/            # Внешние зависимости
│   ├── repositories/
│   │   ├── IRepositories.ts       # Интерфейсы (контракты)
│   │   ├── InMemoryStudentRepository.ts
│   │   └── FileRecordingRepository.ts
│   └── socket/
│       └── BanGateway.ts
│
├── presentation/              # Точки входа (HTTP, WebSocket)
│   ├── Routes.ts
│   └── SocketHandler.ts
│
├── di/
│   └── diContainer.ts         # Dependency Injection — сборка графа
│
└── server.ts                  # Composition root (только bootstrap)
```

**SOLID:**
- **S** — каждый класс решает одну задачу
- **O** — новые репозитории подключаются через DI без изменения сервисов
- **L** — репозитории взаимозаменяемы через `IStudentRepository` / `IRecordingRepository`
- **I** — сервисы зависят только от нужных абстракций
- **D** — `Routes` и `SocketHandler` зависят от сервисов, а не от `fs`/`Map`

### Frontend (`src/`)

```
src/
├── domain/                    # Статические данные и конфигурация
│   ├── examQuestions.ts
│   └── serverConfig.ts
│
├── application/               # Бизнес-операции и хуки
│   ├── api/
│   │   ├── studentApi.ts
│   │   └── recordingApi.ts
│   └── hooks/
│       ├── useProctorSocket.ts
│       ├── useExamSocket.ts
│       ├── useExamTimer.ts
│       ├── useTabGuard.ts
│       ├── useProctoring.ts
│       └── useRecording.ts
│
├── infrastructure/            # Внешние клиенты
│   └── socketClient.ts
│
├── presentation/              # UI-компоненты
│   ├── App.tsx
│   ├── StudentExam.tsx
│   ├── ProctorDashboard.tsx
│   ├── StudentChat.tsx
│   └── ProctorChat.tsx
│
└── main.tsx
```

---

## TypeScript

| Часть | Как собирается |
|-------|----------------|
| Backend | `tsc` → `back/dist/back/server.js` |
| Frontend | Vite + `tsc --noEmit` (проверка типов) |
| Shared | Импортируется через `@shared/*` (frontend) и относительные пути (backend) |

---

## Публичный API (неизменён)

| Тип | Эндпоинт / Событие |
|-----|-------------------|
| REST | `GET /api/students`, `POST /api/students/:id/{comment,verdict,score,submit-answers}` |
| REST | `POST /api/recording/{start,chunk,stop}`, `GET /api/recordings` |
| REST | `GET /recordings/:file` (Range-стриминг) |
| Socket | `student_join`, `proctor_join`, `ai_violation`, `banned`, `students_update`, `init`, `chat_message` |
| React | `StudentExam({ session, onLogout })`, `ProctorDashboard({ session, onLogout })` |

---

## Что было исправлено

| Было (God Object) | Стало |
|---|---|
| `server.js` (~270 строк) | `server.ts` (~35 строк) + 4 слоя |
| `StudentStore.js` | `domain/` + `InMemoryStudentRepository` + `StudentService` |
| `StudentExam.jsx` (UI + socket + timer + AI + запись) | UI + 5 специализированных хуков |
| `ProctorDashboard.jsx` (UI + socket + fetch) | UI + `useProctorSocket` + API-слой |
| JavaScript без типов | TypeScript + shared contracts |
