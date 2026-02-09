import { ConversationEventRepository, QueueClient } from '../core/ports';
import { QueueEventEnvelope } from '../core/types';

export interface WorkerConfig {
  maxRetries: number;
  baseBackoffMs: number;
  queuePollBlockMs: number;
  enableSimulationMode?: boolean;
}

export class ConversationWorker {
  private running = false;

  constructor(
    private readonly queueClient: QueueClient,
    private readonly repository: ConversationEventRepository,
    private readonly config: WorkerConfig,
  ) {}

  async start(): Promise<void> {
    this.running = true;

    while (this.running) {
      await this.runOnce();
    }
  }

  stop(): void {
    this.running = false;
  }

  async runOnce(): Promise<void> {
    const envelope = await this.queueClient.pop(this.config.queuePollBlockMs);
    if (!envelope) {
      return;
    }

    await this.processEnvelope(envelope);
  }

  private async processEnvelope(envelope: QueueEventEnvelope): Promise<void> {
    let lastError: unknown = null;
    const simulationMode = this.config.enableSimulationMode ?? false;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        if (simulationMode && shouldForceFailure(envelope)) {
          throw new Error('simulation_forced_failure');
        }

        await this.repository.insert(envelope.event);
        return;
      } catch (error) {
        lastError = error;

        if (attempt < this.config.maxRetries) {
          const backoff = this.config.baseBackoffMs * 2 ** (attempt - 1);
          await sleep(backoff);
        }
      }
    }

    await this.queueClient.pushDlq({
      failed_at: new Date().toISOString(),
      retries: this.config.maxRetries,
      error: errorMessage(lastError),
      event: envelope.event,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'unknown_error';
}

function shouldForceFailure(envelope: QueueEventEnvelope): boolean {
  return envelope.event.metadata.simulate_failure === true;
}
