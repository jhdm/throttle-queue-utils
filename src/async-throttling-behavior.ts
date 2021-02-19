import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { ResolveCallback } from './common';
import { Payload } from './payload';
import { ThrottlingBehavior } from './throttling-behavior';

export class AsyncThrottlingBehavior<T = any, R = T> extends EventEmitter {
  private behavior: InternalThrottlingBehavior<T, R>;
  private flushPromise?: Promise<R[]>;

  constructor(
    task: (...args: T[]) => Promise<R>,
    wait?: number,
    payload?: Payload<T>,
    options?: Partial<{
      leading: boolean;
      trailing: boolean;
    }>,
  ) {
    super();
    this.behavior = new InternalThrottlingBehavior<T, R>(task, wait, payload, options);

    this.behavior.on('result', (result: Promise<R>) => {
      result
        .then((resultResolved: R) => this.emit('result', resultResolved))
        .catch((error) => {
          this.emit('error', error);
        });
    });

    this.behavior.on('error', (error) => this.emit('error', error));
    this.behavior.on('finish', () => this.emit('finish'));
  }

  public setTaskThis(taskThis: any) {
    this.behavior.setTaskThis(taskThis);
  }

  public call(...args: T[]): Promise<R> | undefined {
    return this.behavior.call(...args) as Promise<R> | undefined;
  }

  public cancel(): void {
    this.behavior.cancel();
  }

  public async flush(): Promise<R[]> {
    if (this.behavior.result) {
      await this.behavior.result;
    }
    this.flushPromise = Promise.all(this.behavior.flush());
    return await this.flushPromise;
  }

  public async end(callback?: (err?: any) => void): Promise<void> {
    await this.behavior.result;
    return this.behavior.end(callback);
  }
}

class InternalThrottlingBehavior<T, R> extends ThrottlingBehavior<T, Promise<R>> {
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