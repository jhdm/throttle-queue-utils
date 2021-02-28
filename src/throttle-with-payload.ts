import { EventEmitter } from 'events';
import { Cancelable } from './common';
import { SingleElementPayload } from './single-element-payload';
import { Payload } from './payload';
import { ThrottlingBehavior } from './throttling-behavior';

export function throttleWithPayload<T, R>(
  task: (...arg: T[]) => R,
  wait?: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
    payload?: Payload<T>;
    taskThis?: any;
  },
): Cancelable<T, R> {
  const behavior = new ThrottlingBehavior<T, R>(
    task,
    wait,
    options);

  const throttled = function (...args: T[]): R | undefined {
    return behavior.call(...args);
  };

  throttled.cancel = behavior.cancel.bind(behavior);
  throttled.flush = behavior.flush.bind(behavior);
  throttled.on = function(event: string | symbol, listener: (...args: R[]) => void): EventEmitter {
    return behavior.on(event, listener);
  };
  throttled.end = behavior.end.bind(behavior);

  return throttled;
}
