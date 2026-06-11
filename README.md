# TrustExam — Clean Architecture

Система онлайн-прокторинга с разделением на слои по принципам **High Cohesion, Low Coupling**.

## Запуск

### Backend
```bash
cd back
npm install
node server.js
# → http://localhost:5000
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

### Backend (`back/`)

```
back/
├── domain/                    # Бизнес-правила (чистая логика, без I/O)
│   ├── examConfig.js          # Константы экзамена, пороги нарушений
│   ├── AnswerGrader.js        # Автопроверка ответов
│   ├── ViolationRules.js      # Правила бана/предупреждения
│   ├── StudentFactory.js      # Создание сущности студента
│   └── CommentFactory.js      # Создание комментариев
│
├── application/               # Сценарии использования (оркестрация)
│   ├── StudentService.js      # join, verdict, score, violations…
│   ├── RecordingService.js    # start/stop/chunk/list recordings
│   └── BroadcastNotifier.js   # Рассылка students_update
│
├── infrastructure/            # Внешние зависимости
│   ├── repositories/
│   │   ├── InMemoryStudentRepository.js
│   │   └── FileRecordingRepository.js
│   └── socket/
│       └── BanGateway.js
│
├── presentation/              # Точки входа (HTTP, WebSocket)
│   ├── Routes.js              # Express-маршруты
│   └── SocketHandler.js       # Socket.IO-события
│
├── di/
│   └── diContainer.js         # Dependency Injection — сборка графа
│
└── server.js                  # Composition root (только bootstrap)
```

**SOLID:**
- **S** — каждый класс решает одну задачу (`AnswerGrader` только проверяет ответы)
- **O** — новые репозитории подключаются через DI без изменения сервисов
- **L** — репозитории взаимозаменяемы через контракт
- **I** — сервисы зависят только от нужных абстракций
- **D** — `Routes` и `SocketHandler` зависят от `StudentService`, а не от `fs`/`Map`

### Frontend (`src/`)

```
src/
├── domain/                    # Статические данные и конфигурация
│   ├── examQuestions.js
│   └── serverConfig.js
│
├── application/               # Бизнес-операции и хуки
│   ├── api/
│   │   ├── studentApi.js
│   │   └── recordingApi.js
│   └── hooks/
│       └── useProctorSocket.js
│
├── infrastructure/            # Внешние клиенты
│   └── socketClient.js
│
├── presentation/              # UI-компоненты (корень src/)
│   ├── App.jsx
│   ├── StudentExam.jsx
│   └── ProctorDashboard.jsx
│
└── use*.js                    # Хуки прокторинга, записи, таймера
```

---

## Публичный API (неизменён)

| Тип | Эндпоинт / Событие |
|-----|-------------------|
| REST | `GET /api/students`, `POST /api/students/:id/{comment,verdict,score,submit-answers}` |
| REST | `POST /api/recording/{start,chunk,stop}`, `GET /api/recordings` |
| REST | `GET /recordings/:file` (Range-стриминг) |
| Socket | `student_join`, `proctor_join`, `ai_violation`, `banned`, `students_update`, `init` |
| React | `StudentExam({ session, onLogout })`, `ProctorDashboard({ session, onLogout })` |

---

## Что было исправлено

| Было (God Object) | Стало |
|---|---|
| `server.js` (~270 строк: HTTP + Socket + FS + бизнес-логика) | `server.js` (~35 строк) + 4 слоя |
| `StudentStore.js` (хранение + грейдинг + нарушения) | `domain/` + `InMemoryStudentRepository` + `StudentService` |
| `StudentExam.jsx` (UI + socket + timer + AI + запись) | UI + 5 специализированных хуков |
| `ProctorDashboard.jsx` (UI + socket + fetch) | UI + `useProctorSocket` + API-слой |
