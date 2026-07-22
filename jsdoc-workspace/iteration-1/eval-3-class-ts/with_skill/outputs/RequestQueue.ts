type Task<T> = () => Promise<T>;

interface QueueEntry<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

/** Queues async tasks and processes them with a configurable maximum concurrency. */
class RequestQueue {
  private concurrency: number;
  private running: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queue: QueueEntry<any>[];

  /**
   * Creates a new RequestQueue with the given concurrency limit.
   * Throws if concurrency is not a positive integer.
   */
  constructor(concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError(`concurrency must be a positive integer, got ${concurrency}`);
    }
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  /**
   * Adds a task to the queue and returns a promise that resolves or rejects
   * with the task's result once it has been executed.
   */
  add<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.drain();
    });
  }

  /** Returns the number of tasks currently waiting to be started. */
  get pending(): number {
    return this.queue.length;
  }

  /** Returns the number of tasks currently executing. */
  get active(): number {
    return this.running;
  }

  /** Pulls tasks off the queue and starts them until the concurrency limit is reached. */
  private drain(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const entry = this.queue.shift()!;
      this.running++;
      entry
        .task()
        .then(entry.resolve)
        .catch(entry.reject)
        .finally(() => {
          this.running--;
          this.drain();
        });
    }
  }
}

export { RequestQueue };
export type { Task };
