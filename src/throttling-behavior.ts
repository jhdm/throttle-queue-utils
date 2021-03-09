import { performance } from 'perf_hooks';
import { RejectCallback, ResolveCallback } from './common';
import { Payload } from './payload';
import { SinglePayload } from './single-payload';

export const DEFAULT_WAIT = 1000;
const DEFAULT_LEADING = true;
const DEFAULT_TRAILING = true;

/**
 * Core Throttling Bahavior.
 *
 * @template T - task input argument type
 * @template R - task return type
 */
export class ThrottlingBehavior<T = any, R = T> {
  protected readonly leading: boolean;
  protected readonly trailing: boolean;
  protected taskThis?: any;
  protected payload: Payload<T>;

  protected result?: R;
  protected timerId?: number;
  protected timerPromise?: Promise<R>;
  protected lastInvokeTime?: number;

  /**
   *
   * @param task - function to invoke
   * @param wait - wait time between invocations of task (in milliseconds)
   * @param payload - [[Payload]], e.g. [[BatchPayload]] or [[SingleElementPayload]]
   * @param options.leading - invoke task on leading edge
   * @param options.trailing - invoke task on trailing edge
   *
   */
  constructor(
    protected task: (...args: T[]) => R,
    protected wait = DEFAULT_WAIT,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      payload?: Payload<T>,
      taskThis?: any;
    },
  ) {
    const opts = options || {};
    this.leading = opts.leading === undefined ? DEFAULT_LEADING : opts.leading;
    this.trailing = opts.trailing === undefined ? DEFAULT_TRAILING : opts.trailing;
    this.payload = options?.payload || new SinglePayload();
    this.taskThis = options?.taskThis;
  }

  /**
   * Get the last task invocation result.
   */
  public getResult(): R | undefined {
    return this.result;
  }

  /**
   * Add payload for processing.
   *
   * @param args
   * @fires result event
   */
  public call(...args: T[]): R | undefined {
    this.payload.add(...args);
    const now = performance.now();
    if (this.leading && this.shouldInvoke(now)) {
      return this.result = this.invokeTask();
    } else if (this.trailing && this.timerId === undefined) {
      this.timerPromise = this.startTimer(now);
    }

    return this.result;
  }

  /**
   * @ignore
   * @param time timestamp
   */
  private shouldInvoke(time: number): boolean {
    const timeSinceLastInvoke = this.lastInvokeTime !== undefined ? time - this.lastInvokeTime : 0;
    return !this.timerId &&
      (this.lastInvokeTime === undefined || timeSinceLastInvoke > this.wait);
  }

  protected invokeTask(): R {
    this.lastInvokeTime = performance.now();
    const result = this.task.apply(this.taskThis, this.payload.next());
    return result;
  }

  protected startTimer(time: number): Promise<any> {
    return new Promise((resolve: ResolveCallback, reject: RejectCallback) => {
      let remainingTime = this.wait;
      if (this.lastInvokeTime) {
        remainingTime = this.wait - (time - this.lastInvokeTime);
        if (remainingTime <= 0) {
          remainingTime = this.wait;
        }
      }
      this.timerId = setTimeout(
        this.timerExpired.bind(this),
        remainingTime,
        resolve,
        reject);
    });
  }

  protected timerExpired(resolve: ResolveCallback, reject: RejectCallback): void {
    this.timerId = undefined;
    try {
      this.result = this.invokeTask();
      resolve(this.result);
    } catch(error) {
      reject(error);
    } finally {
      this.timerPromise = undefined;
    }
  }
}
