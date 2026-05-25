import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/http.js';
import { authInputSchema } from '../services/validators.js';
import { getUserSessionFromToken, loginWithEmail, registerWithEmail } from '../services/authService.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(async (req, res) => {
  const input = authInputSchema.parse(req.body);
  const session = await registerWithEmail(input.email, input.password, input.name);
  res.status(201).json(session);
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const input = authInputSchema.omit({ name: true }).parse(req.body);
  const session = await loginWithEmail(input.email, input.password);
  res.json(session);
}));

authRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await getUserSessionFromToken((req as AuthenticatedRequest).user.uid);
  res.json({ user });
}));

authRouter.post('/logout', authenticate, asyncHandler(async (_req, res) => {
  // Firebase ID tokens are stateless. The browser removes its stored token.
  // Token revocation can be added for higher-security sessions if required.
  res.status(204).send();
}));
