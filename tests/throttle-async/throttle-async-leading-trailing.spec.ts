import { AsyncCancelable, sleep } from '@/common';
import { throttleAsync } from '@/throttle-async';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('throttle async', () => {
  const CALL_DURATION = 10;
  const WAIT = CALL_DURATION * 10;
  const DELTA = CALL_DURATION * 2;
  const SLEEP_TIME  = WAIT + DELTA;

  describe('with default leading = true, trailing = true', () => {
    let fixture: AsyncFixture;
    let throttled: AsyncCancelable;

    beforeEach(() => {
      fixture = new AsyncFixture({
        duration: CALL_DURATION
      });
      throttled = throttleAsync(
        fixture.getTask(),
        WAIT,
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = throttled('C1');

      await expect(r1).resolves.toBe('C1');
      expect(fixture.invokeCount).toBe(1);

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await throttled.end();
    });

    it('should throttle with call C1, C2, trailing X1, C3 < wait, X2', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');
      expect(fixture.invokeCount).toBe(1);

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      const r3 = throttled('C3');

      // within WAIT after last invoke, so returns last result
      await expect(r3).resolves.toBe('C2');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(3);
      expect(fixture.invokeArgs).toBe('C3');

      await throttled.end();
    });

    it('should throttle with call C1, C2, trailing X1, C3 > wait, X2', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');
      expect(fixture.invokeCount).toBe(1);

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      await sleep(SLEEP_TIME);

      const r3 = throttled('C3');

      await expect(r3).resolves.toBe('C3');
      expect(fixture.invokeCount).toBe(3);
      expect(fixture.invokeArgs).toBe('C3');

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(3);
      expect(fixture.invokeArgs).toBe('C3');

      await throttled.end();
    });
  });
});
