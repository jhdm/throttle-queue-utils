import { AsyncCancelable } from './common';
import { SingleElementPayload } from './single-element-payload';
import { Payload } from './payload';
import { AsyncThrottlingBehavior } from './async-throttling-behavior';

export function throttleWithPayloadAsync<T, R>(
  task: (...arg: T[]) => Promise<R>,
  wait?: number,
  payload?: Payload<T>,
  options?: Partial<{
    leading: boolean;
    trailing: boolean;
  }>,
): AsyncCancelable<T, R> {
  const behavior = new AsyncThrottlingBehavior<T, R>(
    task,
    wait,
    payload || new SingleElementPayload<T>(),
    options);
  behavior.setTaskThis(this);

  const throttled = function (...args: T[]): Promise<R> | undefined {
    return behavior.call(...args);
  };

  throttled.cancel = behavior.cancel.bind(behavior);
  throttled.flush = behavior.flush.bind(behavior);
  throttled.on = function(event: string | symbol, listener: (...args: R[]) => void): AsyncCancelable<T, R> {
    behavior.on(event, listener);
    return throttled;
  };
  throttled.end = behavior.end.bind(behavior);

  return throttled;
}
