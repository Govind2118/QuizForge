# QuizForge

QuizForge is a React + TypeScript quiz builder SPA with an Express + Firebase REST API backend. Authenticated users can create, preview, publish, and delete quizzes; anonymous visitors can open published quiz links and receive a server-scored result.

**Here is a demo of the submission: https://www.loom.com/share/e0b7e931a0694d7ca363c128a05b0e30**

## Project structure

```text
.
├── src/              # React SPA
├── server/           # Express REST API + Firebase Admin SDK
├── .env              # Frontend API URL, ignored by git
├── server/.env       # Backend config, ignored by git
└── package.json
```

## Run locally

### 1. Install dependencies

```bash
npm install
npm --prefix server install
```

### 2. Configure the frontend

Create this file at the project root:

```text
.env
```

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 3. Configure the backend

Create this file inside `server/`:

```text
server/.env
```

Fill in your Firebase project values. Do not commit `.env` files or service-account files.

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
GOOGLE_APPLICATION_CREDENTIALS=server/secrets/firebase-service-account.json
```

Keep the Firebase Admin service-account JSON here for local development:

```text
server/secrets/firebase-service-account.json
```

### 4. Start both apps

```bash
npm run dev:api
npm run dev:client
```

Frontend: http://localhost:5173  
Backend health check: http://localhost:4000/health

## Build and test

```bash
npm run build
npm run lint
npm run test:api
```

## REST API summary

Authenticated routes use `Authorization: Bearer <Firebase ID token>`.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/quizzes`
- `POST /api/quizzes`
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id`
- `POST /api/quizzes/:id/publish`
- `DELETE /api/quizzes/:id`
- `GET /api/public/quizzes/:permalink`
- `POST /api/public/quizzes/:permalink/score`

## Production-readiness notes

- The API is UI-agnostic and can be consumed by the React SPA, a mobile app, or any other REST client.
- Firebase Admin credentials are loaded through Application Default Credentials via `GOOGLE_APPLICATION_CREDENTIALS` locally; in production, prefer an attached service account, Workload Identity, or a secret manager.
- Firestore rules and indexes are tracked through `firebase.json` and `server/firestore/`.
- Public quiz responses hide correct answers. Scoring is performed server-side.
- API responses include `X-Request-Id` for support/debugging correlation.
- Auth, public quiz attempts, and general API requests have separate rate limits.
