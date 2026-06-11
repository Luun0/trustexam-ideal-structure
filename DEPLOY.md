# Деплой TrustExam (доступ с любого устройства)

Проект состоит из **двух частей**:

| Часть | Куда деплоить | Почему |
|-------|---------------|--------|
| Frontend (React) | **Vercel** | Статический сайт, бесплатно |
| Backend (Node + Socket.IO) | **Render** | Vercel не поддерживает WebSocket и запись видео |

---

## Шаг 1 — Backend на Render (5 мин)

1. Зайди на https://render.com и войди через GitHub
2. **New → Web Service**
3. Подключи репозиторий `Luun0/trustexam-ideal-structure`
4. Настройки:
   - **Root Directory:** `back`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Нажми **Create Web Service**
6. Дождись деплоя и скопируй URL, например:
   ```
   https://trustexam-api.onrender.com
   ```

> На бесплатном плане сервер «засыпает» после 15 мин без активности. Первый запрос может занять ~30 сек.

---

## Шаг 2 — Frontend на Vercel (3 мин)

1. Зайди на https://vercel.com и войди через GitHub
2. **Add New → Project**
3. Импортируй `Luun0/trustexam-ideal-structure`
4. Настройки (Vercel определит Vite автоматически):
   - **Root Directory:** оставь пустым (корень репо)
   - **Framework Preset:** Vite
5. **Environment Variables** — добавь:
   ```
   VITE_API_URL = https://trustexam-api.onrender.com
   ```
   (подставь свой URL из Render, без слэша в конце)
6. Нажми **Deploy**

---

## Шаг 3 — Проверка

Открой URL Vercel (например `https://trustexam-ideal-structure.vercel.app`) с телефона или другого ПК.

- Войди как **Студент** или **Проктор**
- Камера и шейринг экрана работают только по **HTTPS** (Vercel даёт это автоматически)

---

## Локальная разработка (без изменений)

```bash
# Backend
cd back && npm install && node server.js

# Frontend
npm install && npm run dev
```

Локально `VITE_API_URL` не нужен — по умолчанию `http://localhost:5000`.
