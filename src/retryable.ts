import { sleep } from './common';

const DEFAULT_TIMES = 3;
const DEFAULT_INTERVAL_IN_MILLISECONDS = 0;

/**
 * Retry a function.
 *
 * Example:
 * function task(...args: string[]) { return args.toString(); }
 * const retryTask = retry(task);
 * const retryTask = retry(task, { times: 5, interval: 1000 });
 * retryTask('a');
 *
 * @param {Function} task - function to call
 * @param {number} [options.times=3] - number of times to attempt function.
 * @param {number | ((attempt: number) => number)} [options.interval=0] - retry interval in milliseconds; attempt starts with 1
 */
export function retryable<T, R>(
  task: (...args: T[]) => R | Promise<R>,
  options?: {
    times?: number;
    interval?: number | ((attempt: number) => number);
  },
): (...args: T[]) => Promise<R> {
  const times = options?.times || DEFAULT_TIMES;
  const interval = options?.interval || DEFAULT_INTERVAL_IN_MILLISECONDS;

  return async function (...args: T[]): Promise<R> {

    const attemptTask = async (attempt: number): Promise<R> => {
      try {
        return await task.apply(this, args);
      } catch (error) {
        if (attempt < times) {
          let ms = (typeof interval === 'function') ? interval(attempt) : interval;
          if (ms > 0) {
            await sleep(ms);
          }
          return await attemptTask(++attempt);
        }
        throw error;
      }
    };

    return await attemptTask(1);
  }.bind(this);
}
