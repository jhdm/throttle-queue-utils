import { AsyncThrottlingBehavior } from './async-throttling-behavior';
import { BatchPayload } from './batch-payload';
import { retryable } from './retryable';

export class AsyncThrottleQueue<T, R> extends AsyncThrottlingBehavior<T, R> {
  constructor(
    task: (...args: T[]) => Promise<R>,
    wait?: number,
    options?: Partial<{
      leading: boolean;
      trailing: boolean;
      capacity?: number; /** capacity in bytes */
      times?: number; /** number of attempts */
      interval?: number; /** interval between attempts */
    }>,
  ) {
    const opts = options || {};
    const retryableTask = retryable<T, R>(
      task,
      {
        times: opts.times,
        interval: opts.interval,
      }
    );
    super(
      retryableTask,
      wait,
      new BatchPayload<T>({ capacity: options?.capacity }),
      options,
    );
  }

  public add(...args: T[]) {
    super.call(...args);
  }
}