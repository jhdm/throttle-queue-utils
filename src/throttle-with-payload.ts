import { Cancelable } from './common';
import { SingleElementPayload } from './single-element-payload';
import { Payload } from './payload';
import { ThrottlingBehavior } from './throttling-behavior';

export function throttleWithPayload<T, R>(
  task: (...arg: T[]) => R,
  wait?: number,
  payload?: Payload<T>,
  options?: Partial<{
    leading: boolean;
    trailing: boolean;
  }>,
): Cancelable<T, R> {
  const behavior = new ThrottlingBehavior<T, R>(
    task,
    wait,
    payload || new SingleElementPayload<T>(),
    options);
  behavior.setTaskThis(this);

  const throttled = function (...args: T[]): R | undefined {
    return behavior.call(...args);
  };

  throttled.cancel = behavior.cancel.bind(behavior);
  throttled.flush = behavior.flush.bind(behavior);
  throttled.on = function(event: string | symbol, listener: (...args: R[]) => void): Cancelable<T, R> {
    behavior.on(event, listener);
    return throttled;
  };
  throttled.end = behavior.end.bind(behavior);

  return throttled;
}
