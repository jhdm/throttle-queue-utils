/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { RejectCallback, ResolveCallback } from './common';
import { Payload } from './payload';
import { SingleElementPayload } from './single-element-payload';

const DEFAULT_WAIT = 1000;
const DEFAULT_LEADING = true;
const DEFAULT_TRAILING = true;

/**
 * Throttling Behavior.
 *
 * ## Events:
 *
 * ### 'result' event:
 *
 * 'result' event will be trailing edge result.
 *
 * #### Example:
 *
 * throttled.on('result', (result) => { ... })
 *
 * ### 'finish' event:
 *
 * If you call throttled.end(), then it will emit 'finish' event,
 * when requests have finished processing.
 *
 * @template T - task input argument type
 * @template R - task return type, if task returns `Promise<string>`, then `R` is `string`.
 */
export class ThrottlingBehavior<T = any, R = T> extends EventEmitter {
  public readonly leading: boolean;
  public readonly trailing: boolean;
  private taskThis?: any;
  protected payload: Payload<T>;

  public result?: R;
  protected timerId?: number;
  protected timerPromise?: Promise<R>;
  protected ending = false;
  private lastInvokeTime?: number;

  /**
   *
   * @param {(...arg: T[]) => R} task - function to invoke
   * @param {number} [wait=1000] - wait time between invocations of task (in milliseconds)
   * @param {boolean} [options.leading=true] - invoke task on leading edge
   * @param {boolean} [options.trailing=true] - invoke task on trailing edge
   */
  constructor(
    private task: (...args: T[]) => R,
    protected wait = DEFAULT_WAIT,
    payload?: Payload<T>,
    options?: Partial<{
      leading: boolean;
      trailing: boolean;
    }>,
  ) {
    super();
    const opts = options || {};
    this.leading = opts.leading === undefined ? DEFAULT_LEADING : opts.leading;
    this.trailing = opts.trailing === undefined ? DEFAULT_TRAILING : opts.trailing;
    this.payload = payload || new SingleElementPayload();
  }

  public setTaskThis(taskThis: any) {
    this.taskThis = taskThis;
  }

  public call(...args: T[]): R | undefined {
    this.payload.add(...args);

    const now = performance.now();

    if (this.leading && this.shouldInvoke(now)) {
      // return this.invokeTask();
      return this.result = this.invokeTask();
    } else if (this.trailing && this.timerId === undefined) {
      this.timerPromise = this.startTimer(now);
      this.timerPromise.then(() => {
        this.timerPromise = undefined;
      });
    }

    return this.result;
  }

  public cancel(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
      this.timerPromise = undefined;
    }
  }

  /**
   * Execute all remaining payloads and return results immediately.
   */
  public flush(): R[] {
    this.cancel();
    const pendingResults: any[] = [];
    while (!this.payload.isEmpty()) {
      const result = this.task.apply(this.taskThis, this.payload.next());
      if (result !== undefined) {
        pendingResults.push(result);
        this.emit('result', result);
      }
    }
    return pendingResults;
  }

  public end(callback?: (err?: any) => void): Promise<void> | void {
    this.ending = true;
    let finishPromise: Promise<void> | undefined;
    if (callback) {
      this.on('finish', callback);
    } else {
      finishPromise = new Promise((resolve) => {
        this.on('finish', () => {
          resolve(undefined);
        });
      });
    }
    if (this.timerPromise === undefined) {
      this.emit('finish');
    }
    return finishPromise;
  }

  private shouldInvoke(time: number): boolean {
    const timeSinceLastInvoke = this.lastInvokeTime !== undefined ? time - this.lastInvokeTime : 0;
    return !this.timerId &&
      (this.lastInvokeTime === undefined || timeSinceLastInvoke > this.wait);
  }

  protected invokeTask(): R {
    this.lastInvokeTime = performance.now();
    const result = this.task.apply(this.taskThis, this.payload.next());
    this.emit('result', result);
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

  protected timerExpired(resolve: ResolveCallback): void {
    this.timerId = undefined;
    try {
      this.result = this.invokeTask();
      resolve(this.result);
      this.timerPromise = undefined;

      if (this.ending) {
        if (!this.payload.isEmpty()) {
          setTimeout(
            () => {
              this.timerPromise = this.startTimer(performance.now());
            },
            this.wait);
        } else {
          this.emit('finish');
        }
      }
    } catch(error) {
      this.emit('error', error);
    }
  }
}
