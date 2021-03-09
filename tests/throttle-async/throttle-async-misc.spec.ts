import { AsyncThrottled, sleep } from '@/common';
import { throttleAsync } from '@/throttle-async';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('throttle async', () => {
  const CALL_DURATION = 10;
  const WAIT = CALL_DURATION * 10;
  const DELTA = CALL_DURATION * 2;
  const SLEEP_TIME = WAIT + DELTA;

  let fixture: AsyncFixture;
  let throttled: AsyncThrottled;

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

  it('should throw error on leading edge', async () => {
    const throttled = throttleAsync(
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      (_arg: string) => Promise.reject('leading edge error'),
      WAIT,
      {
        leading: true,
        trailing: false,
      }
    );
    const errorMock = jest.fn();
    throttled.on('error', errorMock);
    let caughtError: Error | undefined;
    try {
      await throttled('C1');
    } catch(error) {
      caughtError = error;
    }
    expect(caughtError).toBe('leading edge error');
  });

  it('should emit error event on trailing edge', async () => {
    throttled = throttleAsync(
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      (_arg: string) => Promise.reject('trailing edge error'),
      WAIT,
      {
        leading: false,
        trailing: true,
      }
    );

    const errorMock = jest.fn();
    throttled.on('error', errorMock);

    await throttled('C1');
    await sleep(SLEEP_TIME);
    expect(errorMock).toHaveBeenCalledWith('trailing edge error');
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
