import { AsyncCancelable, sleep } from '@/common';
import { throttleAsync } from '@/throttle-async';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('throttle async', () => {
  const WAIT = 20;

  describe('with leading = true, trailing = false', () => {
    let fixture: AsyncFixture;
    let throttled: AsyncCancelable;

    beforeEach(() => {
      fixture = new AsyncFixture();
      throttled = throttleAsync(
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

      await expect(r1).resolves.toBe('C1');
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
      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');
    });

    it('should throttle with call C1, trailing X1, C2 < wait after invoke, X2', async () => {
      const r1 = throttled('C1');

      expect(fixture.invokeCount).toBe(1);
      await expect(r1).resolves.toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      const r2 = throttled('C2');

      await expect(r2).resolves.toEqual('C2');
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
      await expect(r1).resolves.toBe('C1');
      await expect(r2).resolves.toBe('C1');

      await sleep(WAIT + 1);

      expect(fixture.invokeCount).toBe(1);
      expect(fixture.invokeArgs).toBe('C1');

      await sleep(WAIT + 1);

      const r3 = throttled('C3');

      await expect(r3).resolves.toEqual('C3');
      expect(fixture.invokeCount).toBe(2);
      expect(fixture.invokeArgs).toBe('C3');
    });
  });
});
