import { Payload } from './payload';

export interface BatchPayloadOptions {
  capacity?: number
}

export class BatchPayload<T> implements Payload<T> {
  public buffer: T[] = [];

  /** Request capacity in bytes */
  public readonly capacity?: number;

  constructor(options?: BatchPayloadOptions) {
    this.capacity = options?.capacity;
  }

  public add(...args: T[]): void {
    this.buffer = this.buffer.concat(args);
  }

  public next(): T[] {
    if (this.capacity !== undefined) {
      return this.nextWithinCapacity(this.capacity);
    }
    return this.nextWithoutCapacity();
  }

  protected nextWithoutCapacity() {
    const args = this.buffer.slice(0);
    this.buffer = [];
    return args;
  }

  protected nextWithinCapacity(capacity: number) {
    let extractedSize = 0;
    let i = 0;
    for (; i < this.buffer.length; ++i) {
      const prospectiveSize = extractedSize + Buffer.from(this.buffer[i] as unknown as any[]).length;
      if (prospectiveSize > capacity) {
        break;
      }
      extractedSize = prospectiveSize;
    }
    return this.buffer.splice(0, i);
  }

  public isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}
