import { performance } from 'perf_hooks';
import { AsyncCancelable, sleep } from '@/common';
import { throttleAsync } from '@/throttle-async';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('throttle async with rapid fire load test', () => {
  const WAIT = 1000;
  const DELTA = 1;
  let fixture: AsyncFixture;
  let throttled: AsyncCancelable;

  beforeEach(() => {
    fixture = new AsyncFixture();
    throttled = throttleAsync(
      fixture.getTask(),
      WAIT,
      { leading: true, trailing: true }
    );
  });

  it('should handle load within wait time', async () => {
    let result: string | Promise<string> | undefined;
    const startTime = performance.now();
    const maxTime = WAIT - DELTA;

    for (let i = 1; i <= 10000 && performance.now() - startTime < maxTime; i++) {
      result = throttled(`C${i}`);
    }

    await expect(result).resolves.toBe('C1');
    expect(fixture.invokeCount).toBe(1);

    await sleep(WAIT + DELTA);

    expect(fixture.invokeCount).toBe(2);
    expect(fixture.invokeArgs).toBe('C10000');
  });

  it('should handle load across wait time', async () => {
    let result: string | Promise<string> | undefined;
    const startTime = performance.now();
    const maxTime = WAIT + (WAIT >> 1);

    let i = 1;
    for (; performance.now() - startTime < maxTime; i++) {
      result = throttled(`C${i}`);
    }

    await expect(result).resolves.toBe('C1');
    expect(fixture.history[0]).toEqual(['C1']);

    await sleep((WAIT << 1) + DELTA);
    await throttled.end();

    expect(fixture.invokeCount).toBe(2);
    expect(fixture.invokeArgs).toBe(`C${i - 1}`);
  });
});
