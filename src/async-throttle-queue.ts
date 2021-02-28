import { AsyncThrottlingBehavior } from './async-throttling-behavior';
import { BatchPayload } from './batch-payload';
import { retryable } from './retryable';

/**
 * Asynchronous Throttled Batch Queue
 *
 * It supports optional capacity and retry.
 *
 */
export class AsyncThrottleQueue<T, R> extends AsyncThrottlingBehavior<T, R> {
  /**
   * @template T - task input argument type
   * @template R - task return type
   *
   * @event result event handler (result: R) => void will receive task invocation result
   *
   * @param task task function
   * @param wait [wait=1000] interval between task invocations; in milliseconds
   * @param options.leading - invoke task at leading edge of interval
   * @param options.trailing - invoke task at trailing edge of interval
   * @param options.capacity - capacity in bytes
   * @param options.retryTimes - max number of attempt in retry
   * @param options.retryInterval - interval in milliseconds in retry
   */
  constructor(
    task: (...args: T[]) => Promise<R>,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      capacity?: number;
      retryTimes?: number;
      retryInterval?: number;
    },
  ) {
    const opts = {
      payload: new BatchPayload<T>({ capacity: options?.capacity }),
      ...options
    };
    const retryableTask = retryable<T, R>(
      task,
      {
        times: opts.retryTimes,
        interval: opts.retryInterval,
      }
    );
    super(retryableTask, wait, opts);
  }

  public add(...args: T[]) {
    super.call(...args);
  }
}