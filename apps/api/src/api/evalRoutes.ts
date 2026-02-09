import path from 'path';
import { Router } from 'express';
import { runEvalSuite } from '../core/evalService';

const evalRuns: ReturnType<typeof runEvalSuite>[] = [];

export function createEvalRouter(): Router {
  const router = Router();

  router.post('/v1/evals/run', (_req, res) => {
    const baseDir = path.join(process.cwd(), 'packages', 'shared', 'goldens');
    const run = runEvalSuite(baseDir);
    evalRuns.push(run);
    return res.json({ run });
  });

  router.get('/v1/evals/runs', (_req, res) => {
    return res.json({ runs: evalRuns.slice().reverse() });
  });

  return router;
}
