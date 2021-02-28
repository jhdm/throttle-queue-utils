import { EventEmitter } from 'events';
import { AsyncCancelable } from './common';
import { SingleElementPayload } from './single-element-payload';
import { Payload } from './payload';
import { AsyncThrottlingBehavior } from './async-throttling-behavior';

export function throttleWithPayloadAsync<T, R>(
  task: (...arg: T[]) => Promise<R>,
  wait?: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
    payload?: Payload<T>;
    taskThis?: any;
  },
): AsyncCancelable<T, R> {
  const behavior = new AsyncThrottlingBehavior<T, R>(
    task,
    wait,
    options);

  const throttled = function (...args: T[]): Promise<R> | undefined {
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
