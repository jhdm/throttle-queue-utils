interface Counts {
  attempts: number;
  errors: number;
}

const DEFAULT_ATTEMPT_TO_SUCCEED = 2;

export class RetryableSyncFixture {
  public errorCount = 0;
  public invokeCount = 0;
  public invokeArgs = '';
  private attemptNumberToSucceed: number;
  public history: string[][] = [];
  public counts: {[k: string]: Counts} = {};

  /**
   *
   * @param {number} [options.attemptNumberToSucceed=2] starts with 1
   */
  constructor(options?: Partial<{attemptNumberToSucceed: number}>) {
    this.attemptNumberToSucceed = options?.attemptNumberToSucceed || DEFAULT_ATTEMPT_TO_SUCCEED;
  }

  public getTask(): (...arg: string[]) => string {
    return this.task.bind(this);
  }

  private task(...args: string[]): string {
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

    if (success) {
      return this.invokeArgs;
    }

    thisCounts.errors += 1;
    this.errorCount += 1;
    throw new Error('simulated error');
  }
}
