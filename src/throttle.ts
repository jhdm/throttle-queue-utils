import { Cancelable } from './common';
import { throttleWithPayload } from './throttle-with-payload';

export function throttle<T = any, R = T>(
  task: (...arg: T[]) => R | Promise<R>,
  wait?: number,
  options?: Partial<{
    leading: boolean;
    trailing: boolean;
  }>,
): Cancelable {
  return throttleWithPayload(task, wait, options);
}
