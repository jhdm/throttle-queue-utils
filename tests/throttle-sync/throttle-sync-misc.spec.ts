import { Cancelable, sleep } from '@/common';
import { throttle } from '@/throttle';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle', () => {
  const WAIT = 100;
  const DELTA = 10;
  const SLEEP_TIME = WAIT + DELTA;

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

  it('should flush', () => {
    throttled('C1');
    const result = throttled.flush();
    expect(result).toEqual(['C1']);
  });

  it('should cancel', async () => {
    const resultMock = jest.fn();
    throttled.on('result', resultMock);
    throttled('C1');

    throttled.cancel();

    expect(resultMock).toHaveBeenCalledTimes(0);
  });

  it('should throw error on leading edge', () => {
    throttled = throttle(() => {
      throw new Error('some error');
    });

    let caughtError: any;
    try {
      throttled('C1');
    } catch(error) {
      caughtError = error;
    }
    expect(caughtError).toBeDefined();
  });

  it('should emit error on timer trailing edge', async () => {
    throttled = throttle(
      () => {
        throw new Error('some error');
      },
      WAIT,
      {
        leading: false,
        trailing: true,
      });
    const errorMock = jest.fn();
    throttled.on('error', errorMock);

    let caughtError: any;
    try {
      throttled('C1');
    } catch(error) {
      caughtError = error;
    }
    await sleep(SLEEP_TIME);
    expect(errorMock).toHaveBeenCalled();
    expect(caughtError).toBeUndefined();
  });
});
