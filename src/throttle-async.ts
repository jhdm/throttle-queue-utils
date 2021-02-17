import { AsyncCancelable } from './common';
import { SingleElementPayload } from './single-element-payload';
import { throttleWithPayloadAsync } from './throttle-with-payload-async';

export function throttleAsync<T = any, R = T>(
  task: (...arg: T[]) => Promise<R>,
  wait?: number,
  options?: Partial<{
    leading: boolean;
    trailing: boolean;
  }>,
): AsyncCancelable<T, R> {
  return throttleWithPayloadAsync<T, R>(task, wait, new SingleElementPayload(), options);
}
