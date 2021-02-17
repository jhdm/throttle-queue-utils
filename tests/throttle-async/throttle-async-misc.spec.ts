import { AsyncCancelable, sleep } from '@/common';
import { throttleAsync } from '@/throttle-async';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('throttle async', () => {
  const CALL_DURATION = 10;
  const WAIT = CALL_DURATION * 10;
  const DELTA = CALL_DURATION * 2;
  const SLEEP_TIME = WAIT + DELTA;

  describe('with default leading = true, trailing = true', () => {
    let fixture: AsyncFixture;
    let throttled: AsyncCancelable;

    beforeEach(() => {
      fixture = new AsyncFixture({
        duration: CALL_DURATION
      });
      throttled = throttleAsync(
        fixture.getTask(),
        WAIT,
      );
    });

    it('should emit result and finish events', async () => {
      const resultMock = jest.fn();
      const finishMock = jest.fn();
      throttled.on('result', resultMock);
      throttled.on('finish', finishMock);

      const r1 = throttled('C1');
      throttled('C2');

      await expect(r1).resolves.toBe('C1');

      await throttled.end();

      expect(resultMock).toHaveBeenCalledWith('C1');
      expect(finishMock).toHaveBeenCalledTimes(1);
    });

    it('should emit error event on leading edge', async () => {
      const throttled = throttleAsync(
        (_arg: string) => Promise.reject('some error'),
        WAIT,
        {
          leading: true,
          trailing: false,
        }
      );
      const errorMock = jest.fn();
      throttled.on('error', errorMock);
      try {
        await throttled('C1');
        await sleep(SLEEP_TIME);
      } catch(err) {
        // caught expected error
      }
      expect(errorMock).toHaveBeenCalled();
    });

    it('should emit error event on trailing edge', async () => {
      throttled = throttleAsync(
        (_arg: string) => Promise.reject('some error'),
        WAIT,
        {
          leading: false,
          trailing: true,
        }
      );
      const errorMock = jest.fn();
      throttled.on('error', errorMock);
      // try {
      await throttled('C1');
      await sleep(SLEEP_TIME);
      // await sleep(SLEEP_TIME);
      // } catch(err) {
      //   caught expected error
      // }
      expect(errorMock).toHaveBeenCalled();
    });

    it('should end() without pending invocation', async () => {
      const finishMock = jest.fn();
      throttled.on('finish', finishMock);

      const r1 = throttled('C1');
      await expect(r1).resolves.toBe('C1');

      await throttled.end();

      expect(finishMock).toHaveBeenCalledTimes(1);
    });
  });
});
