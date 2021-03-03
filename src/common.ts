import { EventEmitter } from "events";

export async function sleep(wait: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, wait));
}

export interface Throttled<T = any, R = T> {
  (...args: T[]): R | undefined;
  cancel(): void;
  flush(): R[];
  on(event: string | symbol, listener: (...args: R[]) => void): EventEmitter;
  end: (callback?: (err?: any) => void) => Promise<void> | void;
}

export interface AsyncThrottled<T = any, R = T> {
  (...args: T[]): Promise<R> | undefined;
  cancel(): void;
  flush(): Promise<R[]>;
  on(event: string | symbol, listener: (...args: R[]) => void): EventEmitter;
  end: (callback?: (err?: any) => void) => Promise<void> | void;
}

export type ResolveCallback<R = any> = (value?: R | PromiseLike<R> | undefined) => void;
export type RejectCallback = (reason?: any) => void;
