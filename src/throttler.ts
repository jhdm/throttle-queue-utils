import { EventEmitter } from 'events';
import { ResolveCallback } from './common';
import { DEFAULT_WAIT, ThrottlingBehavior } from './throttling-behavior';
import { Payload } from './payload';

/**
 * Throttler.
 *
 * @template T - task input argument type
 * @template R - task return type
 */
export class Throttler<T = any, R = T> extends ThrottlingBehavior<T,R> {
  private eventEmitter: EventEmitter;
  protected ending = false;

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
    task: (...args: T[]) => R,
    wait = DEFAULT_WAIT,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      payload?: Payload<T>,
      taskThis?: any;
    },
  ) {
    super(task, wait, options);
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Cancel any pending timer.
   */
  public cancel(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
      this.timerPromise = undefined;
    }
  }

  /**
   * Execute all remaining payloads immediately and return results.
   */
  public flush(): R[] {
    this.cancel();
    const pendingResults: any[] = [];
    while (!this.payload.isEmpty()) {
      const result = this.task.apply(this.taskThis, this.payload.next());
      if (result !== undefined) {
        pendingResults.push(result);
        this.eventEmitter.emit('result', result);
      }
    }
    return pendingResults;
  }

  /**
   * End of input.
   *
   * It will emit 'finish' event, when task processing has finished.
   *
   * @param callback
   * @fires finish event
   */
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
      this.eventEmitter.emit('finish');
    }
    return finishPromise;
  }

  public on(event: string | symbol, listener: (...args: any[]) => void): EventEmitter {
    return this.eventEmitter.on(event, listener);
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }

  protected invokeTask(): R {
    const result = super.invokeTask();
    this.eventEmitter.emit('result', result);
    return result;
  }

  protected timerExpired(resolve: ResolveCallback): void {
    try {
      super.timerExpired(resolve);
      if (this.ending) {
        if (!this.payload.isEmpty()) {
          setTimeout(
            () => {
              this.timerPromise = this.startTimer(performance.now());
            },
            this.wait);
        } else {
          this.eventEmitter.emit('finish');
        }
      }
    } catch(error) {
      this.eventEmitter.emit('error', error);
    }
  }
}
