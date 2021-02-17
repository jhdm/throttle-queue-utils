import { AsyncThrottleQueue } from '@/async-throttle-queue';
import { sleep } from '@/common';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('AsyncThrottleQueue', () => {
  const CALL_DURATION = 10;
  const WAIT = CALL_DURATION * 10;
  const DELTA = CALL_DURATION * 4;
  const SLEEP_TIME = WAIT + DELTA;

  describe('capacity test', () => {
    let fixture: AsyncFixture;
    let queue: AsyncThrottleQueue<string, string>;

    beforeEach(() => {
      fixture = new AsyncFixture({ duration: CALL_DURATION });
    });

    it('should split payload by capacity', async () => {
      const results: string[] = [];

      queue = new AsyncThrottleQueue(
        fixture.getTask(),
        WAIT,
        {
          leading: true,
          trailing: true,
          capacity: 2
        },
      );
      queue.on('result', (result: string) => {
        results.push(result);
      });

      const r1 = queue.call('a', 'b', 'c');
      const r2 = queue.call('d');

      await expect(r1).resolves.toBe('a,b');
      await expect(r2).resolves.toBe('a,b');

      await sleep(SLEEP_TIME);

      expect(results).toEqual(['a,b', 'c,d']);
    });
  });
});
