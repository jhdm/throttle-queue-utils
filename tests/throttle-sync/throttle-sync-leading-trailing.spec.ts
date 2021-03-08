import { Throttled, sleep } from '@/common';
import { throttle } from '@/.';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle sync', () => {
  const WAIT = 20;
  const DELTA = 5;

  describe('with default leading = true, trailing = true', () => {
    let fixture: SyncFixture;
    let throttled: Throttled;

    beforeEach(() => {
      fixture = new SyncFixture();
      throttled = throttle(
        fixture.getTask(),
        WAIT,
      );
    });

    it('should throttle with call C1, trailing edge X1', async () => {
      const r1 = throttled('C1');

      expect(r1).toBe('C1'); // leading difference
      expect(fixture.invokeCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, C2, trailing X1, C3 < wait, X2', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      expect(r1).toBe('C1');
      expect(r2).toBe('C1');
      expect(fixture.invokeCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      const r3 = throttled('C3');

      // within WAIT after last invoke, so returns last result
      expect(r3).toBe('C2');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(3);
      expect(fixture.invokeArgs).toBe('C3');
    });

    it('should throttle with call C1, C2, trailing X1, C3 > wait, X2', async () => {
      const r1 = throttled('C1');
      const r2 = throttled('C2');

      expect(r1).toBe('C1');
      expect(r2).toBe('C1');
      expect(fixture.invokeCount).toBe(1);

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C2');

      await sleep(WAIT + DELTA);

      const r3 = throttled('C3');

      expect(r3).toBe('C3');
      expect(fixture.invokeCount).toBe(3);
      expect(fixture.invokeArgs).toBe('C3');

      await sleep(WAIT + DELTA);

      expect(fixture.invokeCount).toBe(3);
      expect(fixture.invokeArgs).toBe('C3');
    });
  });
});
