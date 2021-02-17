export interface Payload<T> {
  buffer: T[];

  add(...args: T[]): void;

  /**
   * Get next batch of items to process.
   */
  next(): T[];

  isEmpty(): boolean;
}
