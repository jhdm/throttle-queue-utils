import { AsyncThrottled, sleep } from '@/common';
import { throttleAsync } from '@/throttle-async';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('throttle sync', () => {
  const WAIT = 20;
  const DELTA = 5;
  const SLEEP_TIME = WAIT + DELTA;

  describe('with leading = false, trailing = true', () => {
    let fixture: AsyncFixture;
    let throttled: AsyncThrottled;

    beforeEach(() => {
      fixture = new AsyncFixture();
      throttled = throttleAsync(
        fixture.getTask(),
        WAIT,
        { leading: false, trailing: true }
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = throttled('C1');

      expect(r1).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, C2, trailing X1', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      expect(r1).toBeUndefined();
      expect(r2).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C2');
    });

    it('should throttle with call C1, trailing X1, C2 < wait after invoke, X2', async () => {
      const resultMock = jest.fn();
      throttled.on('result', resultMock);

      const r1 = throttled('C1');

      expect(fixture.invokeCount).toBe(0);
      expect(r1).toBeUndefined();

      await sleep(SLEEP_TIME);

      const r2 = throttled('C2');

      await expect(r2).resolves.toBe('C1');
      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(SLEEP_TIME);

      await throttled.end();

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');
    });

    it('should handle negative remaining time with call C2 > wait after invoke', async () => {
      const r1 = throttled('C1');

      expect(fixture.invokeCount).toBe(0);
      expect(r1).toBeUndefined();

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(SLEEP_TIME); // > wait after invoke

      const r2 = throttled('C2');

      await expect(r2).resolves.toEqual('C1');
      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(SLEEP_TIME);
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');
    });
  });
});
