import { EventEmitter } from 'events';
import { Cancelable } from './common';
import { ThrottlingBehavior } from './throttling-behavior';

export function throttle<T = any, R = T>(
  task: (...arg: T[]) => R,
  wait?: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
  },
): Cancelable<T, R> {
  const behavior = new ThrottlingBehavior<T, R>(task, wait, options);
  const throttled = function (...args: T[]): R | undefined {
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
