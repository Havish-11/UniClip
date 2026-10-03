import { Router } from 'express';
import { createSession, getActiveSession } from '../services/sessionService.js';
import { Errors } from '../utils/errors.js';

export function sessionsRouter(hub) {
  const router = Router();

  // Create a temporary session -> returns the pairing code
  router.post('/', async (_req, res) => {
    const session = await createSession();
    res.status(201).json(session);
  });

  router.get('/:code', async(req,res) => {
    const session = await getActiveSession(req.params.code);
    if(!session) throw Errors.sessionNotFound();
    res.json({...session, devices: hub.size(session.code)});
  });

  return router;
}