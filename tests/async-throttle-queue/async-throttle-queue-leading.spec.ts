import { AsyncThrottleQueue } from '@/async-throttle-queue';
import { sleep } from '@/common';
import { RetryableAsyncFixture } from '../fixtures/retryable-async-fixture';

describe('AsyncThrottleQueue', () => {
  const CALL_DURATION = 5;
  const RETRY_INTERVAL = CALL_DURATION * 2;
  const WAIT = RETRY_INTERVAL * 10;
  const DELTA = RETRY_INTERVAL * 4;

  describe('with leading = true, trailing = false', () => {
    let fixture: RetryableAsyncFixture;
    let queue: AsyncThrottleQueue<string, string>;

    beforeEach(() => {
      fixture = new RetryableAsyncFixture({
        attemptNumberToSucceed: 2,
        duration: CALL_DURATION,
      });
      queue = new AsyncThrottleQueue(
        fixture.getTask(),
        WAIT,
        {
          leading: true,
          trailing: false,
          retryTimes: 3,
          retryInterval: RETRY_INTERVAL,
        },
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = queue.call('C1');

      await expect(r1).resolves.toBe('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeArgs).toBe('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
    });

    it('should throttle with call C1, C2, C3, trailing X1, C4 < wait', async () => {
      const r1 = queue.call('C1');
      const r2 = queue.call('C2');
      const r3 = queue.call('C3');

      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');
      await expect(r3).resolves.toBe('C1');

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeArgs).toBe('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);

      // > WAIT after last invoke, so is leading edge
      const r4 = queue.call('C4');
      await expect(r4).resolves.toBe('C2,C3,C4');

      expect(fixture.invokeCount).toBe(4);
      expect(fixture.errorCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2,C3,C4');
    });

    it('should throttle with call C1, C2, C3, trailing X1, C4 > wait', async () => {
      const r1 = queue.call('C1');
      const r2 = queue.call('C2');
      const r3 = queue.call('C3');

      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');
      await expect(r3).resolves.toBe('C1');

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      const r4 = queue.call('C4');

      await expect(r4).resolves.toEqual('C2,C3,C4');
      expect(fixture.invokeCount).toBe(4);
      expect(fixture.errorCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2,C3,C4');
    });
  });
});
