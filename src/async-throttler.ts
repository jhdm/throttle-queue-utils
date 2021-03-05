import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { ResolveCallback } from './common';
import { Payload } from './payload';
import { Throttler } from './throttler';

export class AsyncThrottler<T = any, R = T> {
  private behavior: InternalThrottlingBehavior<T, R>;
  protected eventEmitter: EventEmitter;
  private flushPromise?: Promise<R[]>;

  /**
   *
   * @param task - function to invoke
   * @param wait - wait time between invocations of task (in milliseconds)
   * @param payload
   * @param options.leading - invoke task on leading edge
   * @param options.trailing - invoke task on trailing edge
   */
  constructor(
    task: (...args: T[]) => Promise<R>,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      payload?: Payload<T>;
      taskThis?: any;
    },
  ) {
    this.behavior = new InternalThrottlingBehavior<T, R>(task, wait, options);
    this.eventEmitter = new EventEmitter();

    this.behavior.on('result', (result: Promise<R>) => {
      result
        .then((resultResolved: R) => this.eventEmitter.emit('result', resultResolved))
        .catch((error) => {
          this.eventEmitter.emit('error', error);
        });
    });

    this.behavior.on('error', (error) => this.eventEmitter.emit('error', error));
    this.behavior.on('finish', () => this.eventEmitter.emit('finish'));
  }

  public call(...args: T[]): Promise<R> | undefined {
    return this.behavior.call(...args) as Promise<R> | undefined;
  }

  public cancel(): void {
    this.behavior.cancel();
  }

  public async flush(): Promise<R[]> {
    await this.behavior.getResult();
    this.flushPromise = Promise.all(this.behavior.flush());
    return await this.flushPromise;
  }

  public end(callback?: (err?: any) => void): void | Promise<void> {
    if (callback) {
      this.behavior.end(callback);
    }
    return this.behavior.end();
  }

  public on(event: string | symbol, listener: (...args: any[]) => void): EventEmitter {
    return this.eventEmitter.on(event, listener);
  }
}

class InternalThrottlingBehavior<T, R> extends Throttler<T, Promise<R>> {
  protected timerExpired(resolve: ResolveCallback): void {
    this.timerId = undefined;
    try {
      this.result = this.invokeTask();
      this.result
        .then((resultResolved) => {
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

          resolve(resultResolved);
        }).catch((error) => {
          this.emit('error', error);
        });
    } catch(error) {
      this.emit('error', error);
    }
  }
}