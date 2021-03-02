import { sleep } from '@/common';

const DEFAULT_DURATION = 10;

export class AsyncFixture {
  invokeCount = 0;
  invokeArgs = '';
  private duration: number;
  public history: string[][] = [];

  constructor(options ?: {
    duration?: number
  }) {
    const opts = options || {};
    this.duration = opts.duration === undefined ? DEFAULT_DURATION : opts.duration;
  }

  public getTask(): (arg: string) => Promise<string> {
    return this.task.bind(this);
  }

  private async task(...args: string[]): Promise<string> {
    this.invokeCount += 1;
    this.history.push(args);
    const invokeArgs = args.toString();
    this.invokeArgs = invokeArgs;
    await sleep(this.duration);
    return invokeArgs;
  }
}