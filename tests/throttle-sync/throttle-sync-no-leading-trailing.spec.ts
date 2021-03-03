import { Throttled, sleep } from '@/common';
import { throttle } from '@/throttle';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle sync', () => {
  const WAIT = 10;

  describe('with leading = false, trailing = false', () => {
    let fixture: SyncFixture;
    let throttled: Throttled;

    beforeEach(() => {
      fixture = new SyncFixture();
      throttled = throttle(
        fixture.getTask(),
        WAIT,
        {
          leading: false,
          trailing: false,
        }
      );
    });

    it('should has no results', async () => {
      const r1 = throttled('C1');

      expect(r1).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(0);
      expect(fixture.invokeArgs).toBe('');
    });
  });
});
