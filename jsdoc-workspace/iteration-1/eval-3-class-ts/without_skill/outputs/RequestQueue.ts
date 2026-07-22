type Task<T> = () => Promise<T>;

interface RequestQueueOptions {
  concurrency?: number;
}

interface QueueEntry<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

class RequestQueue {
  private concurrency: number;
  private running: number;
  private queue: QueueEntry<unknown>[];

  constructor(options: RequestQueueOptions = {}) {
    const { concurrency = 1 } = options;
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError(`concurrency must be a positive integer, got: ${concurrency}`);
    }
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject } as QueueEntry<unknown>);
      this.tick();
    });
  }

  get size(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.running;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  private tick(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const entry = this.queue.shift()!;
      this.running++;
      entry.task().then(
        (value) => {
          entry.resolve(value);
          this.running--;
          this.tick();
        },
        (err) => {
          entry.reject(err);
          this.running--;
          this.tick();
        }
      );
    }
  }
}

export { RequestQueue };
export type { RequestQueueOptions, Task };
