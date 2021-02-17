import { sleep } from '@/common';

const DEFAULT_DURATION = 5;
const DEFAULT_ATTEMPT_TO_SUCCEED = 2;

interface Counts {
  attempts: number;
  errors: number;
}

export class RetryableAsyncFixture {
  public errorCount = 0;
  public invokeCount = 0;
  public invokeArgs = '';
  private attemptNumberToSucceed: number;
  private duration: number;
  public history: string[][] = [];
  public counts: {[k: string]: Counts} = {};

  /**
   *
   * @param {number} [options.attemptNumberToSucceed=2] starts with 1
   * @param {number} [options.duration=5] simulate processing time, in milliseconds
   */
  constructor(options ?: Partial<{
    attemptNumberToSucceed: number,
    duration: number,
  }>) {
    const opts = options || {};
    this.duration = opts.duration === undefined ? DEFAULT_DURATION : opts.duration;
    this.attemptNumberToSucceed = options?.attemptNumberToSucceed || DEFAULT_ATTEMPT_TO_SUCCEED;
  }

  public getTask(): (...arg: string[]) => Promise<string> {
    return this.task.bind(this);
  }

  private async task(...args: string[]): Promise<string> {
    this.history.push(args);
    this.invokeArgs = args.toString();
    this.invokeCount += 1;

    let thisCounts: Counts;
    if (this.counts[this.invokeArgs]) {
      thisCounts = this.counts[this.invokeArgs];
    } else {
      thisCounts = { attempts: 0, errors: 0 };
      this.counts[this.invokeArgs] = thisCounts;
    }
    thisCounts.attempts += 1;
    const success = thisCounts.attempts % this.attemptNumberToSucceed === 0;

    await sleep(this.duration);

    if (success) {
      return this.invokeArgs;
    }

    thisCounts.errors += 1;
    this.errorCount += 1;

    throw new Error('simulated error');
  }
}
