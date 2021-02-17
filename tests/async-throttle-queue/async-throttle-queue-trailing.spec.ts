import { AsyncThrottleQueue } from '@/async-throttle-queue';
import { sleep } from '@/common';
import { RetryableAsyncFixture } from '../fixtures/retryable-async-fixture';

describe('AsyncThrottleQueue', () => {
  const CALL_DURATION = 4;
  const RETRY_INTERVAL = CALL_DURATION * 2;
  const WAIT = RETRY_INTERVAL * 20;
  const DELTA = RETRY_INTERVAL * 7;
  const SLEEP_TIME = WAIT + DELTA;

  describe('with leading = false, trailing = true', () => {
    let fixture: RetryableAsyncFixture;
    let queue: AsyncThrottleQueue<string, string>;

    function getResultPromise(): Promise<string> {
      return new Promise((resolve) => {
        queue.on('result', (result: string) => {
          resolve(result);
        });
      });
    }

    beforeEach(() => {
      fixture = new RetryableAsyncFixture({
        attemptNumberToSucceed: 2,
        duration: CALL_DURATION,
      });
      queue = new AsyncThrottleQueue(
        fixture.getTask(),
        WAIT,
        {
          leading: false,
          trailing: true,
          times: 3,
          interval: RETRY_INTERVAL,
        },
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = queue.call('C1');

      expect(r1).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      // Must wait for first result, i.e. trailing edge to finish
      await getResultPromise();

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, C2, trailing X1', async () => {
      const r1 = queue.call('C1');
      const r2 = queue.call('C2');

      expect(r1).toBeUndefined();
      expect(r2).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      // Must wait for first result, i.e. trailing edge to finish
      await getResultPromise();

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1,C2');
    });

    it('should throttle with call C1, C2, trailing X1, C3 < wait after invoke, X2', async () => {
      const r1 = queue.call('C1');
      const r2 = queue.call('C2');

      expect(fixture.invokeCount).toBe(0);
      expect(r1).toBeUndefined();
      expect(r2).toBeUndefined();

      // Must wait for first result, i.e. trailing edge to finish
      await getResultPromise();

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1,C2');

      const r3 = queue.call('C3');

      await expect(r3).resolves.toBe('C1,C2');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1,C2');

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(4);
      expect(fixture.errorCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C3');
    });

    it('should handle negative remaining time with call C2 > wait after invoke', async () => {
      const r1 = queue.call('C1');

      expect(fixture.invokeCount).toBe(0);
      expect(r1).toBeUndefined();

      // Must wait for first result, i.e. trailing edge to finish
      await getResultPromise();

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(SLEEP_TIME); // > wait after invoke

      const r2 = queue.call('C2');

      await expect(r2).resolves.toEqual('C1');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.errorCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(SLEEP_TIME);

      expect(fixture.invokeCount).toBe(4);
      expect(fixture.errorCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');
    });
  });
});
