import { Throttled, sleep } from '@/common';
import { throttle } from '@/throttle';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle sync', () => {
  const WAIT = 20;

  describe('with leading = true, trailing = false', () => {
    let fixture: SyncFixture;
    let throttled: Throttled;

    beforeEach(() => {
      fixture = new SyncFixture();
      throttled = throttle(
        fixture.getTask(),
        WAIT,
        {
          leading: true,
          trailing: false,
        },
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = throttled('C1');

      expect(r1).toBe('C1');
      expect(fixture.invokeCount).toBe(1);

      // leading difference: no timer if last call was leading invoke
      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, C2 < wait gap, trailing X1', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      expect(fixture.invokeCount).toBe(1);
      expect(r1).toBe('C1');
      expect(r2).toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, trailing X1, C2 < wait after invoke, X2', async () => {
      const r1 = throttled('C1');

      expect(fixture.invokeCount).toBe(1);
      expect(r1).toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      const r2 = throttled('C2');

      expect(r2).toEqual('C2');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');
    });

    it('should throttle with call C1, C2, trailing X1, C3 > wait after invoke, X2', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      expect(fixture.invokeCount).toBe(1);
      expect(r1).toBe('C1');
      expect(r2).toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(WAIT + 1);

      const r3 = throttled('C3');

      expect(r3).toEqual('C3');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C3');
    });
  });
});
