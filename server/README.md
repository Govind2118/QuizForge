# QuizForge REST API

Express + TypeScript API backed by Firebase Authentication and Cloud Firestore.

## Why credentials are not committed

The API uses Firebase Admin SDK with Google Application Default Credentials. Keep service-account JSON outside the repository and point to it with `GOOGLE_APPLICATION_CREDENTIALS`, or deploy on Google infrastructure with an attached service account / Workload Identity. The `.gitignore` excludes `.env`, `server/secrets`, and build output.

## Firebase setup

1. Create a Firebase project.
2. Enable **Authentication → Email/Password**.
3. Enable **Cloud Firestore**.
4. Create a service account for local development and save the JSON outside committed source, for example:

   ```bash
   mkdir -p server/secrets
   # copy firebase-service-account.json into server/secrets manually
   ```

5. Copy `.env.example` to `.env` in `server/` and fill in:

   ```bash
   cp server/.env.example server/.env
   ```

6. For local development, set:

   ```env
   GOOGLE_APPLICATION_CREDENTIALS=server/secrets/firebase-service-account.json
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_WEB_API_KEY=your-web-api-key
   CORS_ORIGIN=http://localhost:5173
   ```

## Running

```bash
npm install
npm --prefix server install
npm run dev:api
npm run dev:client
```

## Checks

```bash
npm --prefix server test
npm --prefix server run build
npm --prefix server run lint
```

## REST API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Authenticated quiz owner routes

All require `Authorization: Bearer <Firebase ID token>`.

- `GET /api/quizzes`
- `POST /api/quizzes`
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id`
- `POST /api/quizzes/:id/publish`
- `DELETE /api/quizzes/:id`

### Public visitor routes

No authentication required.

- `GET /api/public/quizzes/:permalink`
- `POST /api/public/quizzes/:permalink/score`

Public quiz reads intentionally hide the real `isCorrect` values. Scoring happens on the server.

## Firestore model

### `quizzes/{quizId}`

```ts
{
  id: string;
  ownerId: string;
  title: string;
  questions: Question[];
  status: 'draft' | 'published';
  permalink?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

### `permalinks/{code}`

```ts
{
  quizId: string;
  createdAt: string;
}
```

`permalinks` is used to reserve unique six-character codes in a Firestore transaction.

## Security notes

- Firestore rules in `server/firestore/firestore.rules` deny all direct client reads/writes.
- Firestore indexes in `server/firestore/firestore.indexes.json` cover the owner quiz listing query.
- Ownership is enforced in the REST API using verified Firebase ID tokens.
- Published quizzes cannot be edited.
- Public quiz payloads do not expose correct answers.
- Quiz and answer constraints are validated server-side with Zod.
