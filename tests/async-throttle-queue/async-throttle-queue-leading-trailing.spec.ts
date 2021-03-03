import { AsyncThrottleQueue } from '@/async-throttle-queue';
import { sleep } from '@/common';
import { RetryableAsyncFixture } from '../fixtures/retryable-async-fixture';

describe('Throttle batch async', () => {
  const CALL_DURATION = 5;
  const RETRY_INTERVAL = CALL_DURATION * 2;
  const WAIT = RETRY_INTERVAL * 10;
  const DELTA = RETRY_INTERVAL * 4;

  describe('with default leading = true, trailing = true', () => {
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
          retryTimes: 3,
          retryInterval: RETRY_INTERVAL,
        },
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = queue.call('C1');

      await expect(r1).resolves.toBe('C1');
      expect(fixture.invokeArgs).toEqual('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toEqual('C1');
    });

    it('should throttle with call C1, C2, C3, trailing X1, C4 < wait', async () => {
      const r1 = queue.call('C1'); // leading edge => invoke
      const r2 = queue.call('C2'); // queued and start timer
      const r3 = queue.call('C3'); // queued

      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');
      await expect(r3).resolves.toBe('C1');
      expect(fixture.invokeArgs).toEqual('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);

      // Wait for trailing edge
      await sleep(WAIT + DELTA);

      expect(fixture.invokeArgs).toEqual('C2,C3');
      expect(fixture.invokeCount).toBe(4);
      expect(fixture.errorCount).toBe(2);

      // Within last invoke, so not leading edge
      const r4 = queue.call('C4');

      await expect(r4).resolves.toBe('C2,C3');
      expect(fixture.invokeCount).toBe(4);
      expect(fixture.invokeArgs).toEqual('C2,C3');
    });

    it('should throttle with call C1, C2, trailing X1, C3 > wait, X2', async () => {
      queue.call('C1');
      const r2 = queue.call('C2');

      await expect(r2).resolves.toBe('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toEqual('C1');

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(4);
      expect(fixture.errorCount).toBe(2);
      expect(fixture.invokeArgs).toEqual('C2');

      await sleep(WAIT + DELTA);

      const r3 = queue.call('C3');

      await expect(r3).resolves.toBe('C3');
      expect(fixture.invokeCount).toBe(6);
      expect(fixture.errorCount).toBe(3);
      expect(fixture.invokeArgs).toEqual('C3');
    });
  });
});
