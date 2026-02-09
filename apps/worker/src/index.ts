import { startBullWorker } from './infra/bullWorker';
import { env } from './infra/env';

async function main(): Promise<void> {
  const { worker, events, connection } = startBullWorker();

  const shutdown = async () => {
    await worker.close();
    await events.close();
    await connection.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // eslint-disable-next-line no-console
  console.log(`Worker listening on queue ${env.redisQueueKey}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start worker process', error);
  process.exit(1);
});
