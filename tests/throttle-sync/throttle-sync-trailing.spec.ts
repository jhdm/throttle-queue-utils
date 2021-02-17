import { Cancelable, sleep } from '@/common';
import { throttle } from '@/throttle';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle sync', () => {
  const WAIT = 20;

  describe('with leading = false, trailing = true', () => {
    let fixture: SyncFixture;
    let throttled: Cancelable;

    beforeEach(() => {
      fixture = new SyncFixture();
      throttled = throttle(
        fixture.getTask(),
        WAIT,
        {
          leading: false,
          trailing: true,
        }
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = throttled('C1');

      expect(r1).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, C2, trailing X1', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      expect(r1).toBeUndefined();
      expect(r2).toBeUndefined();
      expect(fixture.invokeCount).toBe(0);

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C2');
    });

    it('should throttle with call C1, trailing X1, C2 < wait after invoke, X2', async () => {
      const r1 = throttled('C1');

      expect(fixture.invokeCount).toBe(0);
      expect(r1).toBeUndefined();

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      const r2 = throttled('C2');

      expect(r2).toBe('C1');
      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');
    });

    it('should handle negative remaining time with call C2 > wait after invoke', async () => {
      const r1 = throttled('C1');

      expect(fixture.invokeCount).toBe(0);
      expect(r1).toBeUndefined();

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(WAIT + 1); // > wait after invoke

      const r2 = throttled('C2');

      expect(r2).toEqual('C1');
      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(WAIT + 1);
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');
    });
  });
});
