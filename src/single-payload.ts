import { Payload } from './payload';

export class SinglePayload<T> implements Payload<T> {
  public buffer: T[] = [];

  public add(...args: T[]): void {
    this.buffer = args;
  }

  public next(): T[] {
    const args = this.buffer.slice(0);
    this.buffer = [];
    return args;
  }

  public isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}