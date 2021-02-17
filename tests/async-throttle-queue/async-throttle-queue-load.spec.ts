import { performance } from 'perf_hooks';
import { AsyncThrottleQueue } from '@/async-throttle-queue';
import { sleep } from '@/common';
import { RetryableAsyncFixture } from '../fixtures/retryable-async-fixture';

describe('AsyncThrottleQueue, with rapid fire load test', () => {
  const CALL_DURATION = 5;
  const RETRY_INTERVAL = CALL_DURATION * 2;
  const WAIT = RETRY_INTERVAL * 10;
  const DELTA = RETRY_INTERVAL * 4;
  let fixture: RetryableAsyncFixture;
  let queue: AsyncThrottleQueue<string, string>;

  beforeEach(() => {
    fixture = new RetryableAsyncFixture({
      attemptNumberToSucceed: 2,
      duration: CALL_DURATION
    });
    queue = new AsyncThrottleQueue(
      fixture.getTask(),
      WAIT,
      { times: 2, interval: RETRY_INTERVAL }
    );
  });

  it('should handle load within wait time', async () => {
    let result: string | Promise<string> | undefined;

    const startTime = performance.now();
    const LOAD_DURATION = WAIT - DELTA;
    let i = 1;
    for (; i <= 10000 && performance.now() - startTime < LOAD_DURATION; i++) {
      result = queue.call(`C${i}`);
    }

    await expect(result).resolves.toBe('C1');

    await sleep(WAIT + DELTA);

    expect(fixture.invokeCount).toBe(4);
    expect(fixture.errorCount).toBe(2);
    expect(fixture.history[0]).toEqual(['C1']);
    expect(fixture.history[1]).toEqual(['C1']);
    expect(fixture.history[2][0]).toBe('C2');
    expect(fixture.history[2][fixture.history[2].length - 1]).toBe(`C${i - 1}`);
    expect(fixture.history[3][0]).toBe('C2');
    expect(fixture.history[3][fixture.history[2].length - 1]).toBe(`C${i - 1}`);
  });

  it('should handle load across wait time', async () => {
    let result: string | Promise<string> | undefined;
    const startTime = performance.now();
    const maxTime = WAIT + (WAIT >> 1);

    let i = 1;
    for (; performance.now() - startTime < maxTime; i++) {
      result = queue.call(`C${i}`);
    }

    await expect(result).resolves.toBe('C1');
    expect(fixture.history[0]).toEqual(['C1']);

    await sleep(WAIT + DELTA);

    expect(fixture.invokeCount).toBe(4);
    expect(fixture.errorCount).toBe(2);

    const expectedTotalCount = i - 1;
    expect(fixture.history.length).toBe(4);
    expect(fixture.history[3].length).toBe(expectedTotalCount - 1);
    expect(fixture.history[3][0]).toBe('C2');
    expect(fixture.history[3][fixture.history[3].length - 1]).toBe(`C${i - 1}`);
  });
});
