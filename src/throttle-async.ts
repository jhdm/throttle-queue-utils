import { EventEmitter } from 'events';
import { AsyncThrottlingBehavior } from './async-throttling-behavior';
import { AsyncCancelable } from './common';

export function throttleAsync<T = any, R = T>(
  task: (...arg: T[]) => Promise<R>,
  wait?: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
  },
): AsyncCancelable<T, R> {
  const behavior = new AsyncThrottlingBehavior<T, R>(
    task,
    wait,
    options);

  const throttled = function (...args: T[]): Promise<R> | undefined {
    return behavior.call(...args);
  };

  throttled.on = function(event: string | symbol, listener: (...args: R[]) => void): EventEmitter {
    return behavior.on(event, listener);
  };

  throttled.cancel = behavior.cancel.bind(behavior);
  throttled.flush = behavior.flush.bind(behavior);
  throttled.end = behavior.end.bind(behavior);

  return throttled;
}
