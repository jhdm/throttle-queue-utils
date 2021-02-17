
export class SyncFixture {
  public invokeCount = 0;
  public invokeArgs = '';
  public history: string[][] = [];

  public getTask(): (...arg: string[]) => string {
    return this.task.bind(this);
  }

  private task(...args: string[]): string {
    this.history.push(args);
    this.invokeCount += 1;
    this.invokeArgs = args.toString();
    return this.invokeArgs;
  }
}
