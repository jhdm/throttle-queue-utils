import { performance } from 'perf_hooks';
import { Throttled, sleep } from '@/common';
import { throttle } from '@/throttle';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle sync with rapid fire load test', () => {
  const WAIT = 500;
  const DELTA = 1;
  let fixture: SyncFixture;
  let throttled: Throttled;

  beforeEach(() => {
    fixture = new SyncFixture();
    throttled = throttle(fixture.getTask(), WAIT);
  });

  it('should handle load within wait time', async () => {
    let result: string | Promise<string> | undefined;

    const startTime = performance.now();
    for (let i = 1; i <= 10000 && performance.now() - startTime < WAIT - DELTA; i++) {
      result = throttled(`C${i}`);
    }

    expect(result).toBe('C1');
    expect(fixture.invokeCount).toBe(1);

    await sleep(WAIT + DELTA);

    expect(fixture.invokeCount).toBe(2);
    expect(fixture.history[1]).toEqual(['C10000']);
  });

  it('should handle load across wait time', async () => {
    let result: string | Promise<string> | undefined;
    const startTime = performance.now();

    let i = 1;
    const LOAD_DURACTION = WAIT + (WAIT >> 1);
    for (; performance.now() - startTime < LOAD_DURACTION; i++) {
      result = throttled(`C${i}`);
    }

    expect(result).toBe('C1');
    expect(fixture.history.length).toBe(1);
    expect(fixture.history[0]).toEqual(['C1']);

    await sleep((WAIT << 1) + DELTA);

    expect(fixture.invokeCount).toBe(2);
    expect(fixture.history.length).toBe(2);
    expect(fixture.history[1]).toEqual([`C${i - 1}`]);
  });
});
