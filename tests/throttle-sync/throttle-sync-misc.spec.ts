import { Throttled, sleep } from '@/common';
import { throttle } from '@/throttle';
import { SyncFixture } from '../fixtures/sync-fixture';

describe('throttle', () => {
  const WAIT = 100;
  const DELTA = 10;
  const SLEEP_TIME = WAIT + DELTA;

  let fixture: SyncFixture;
  let throttled: Throttled<string, string>;

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
    throttled = throttle((...args: string[]) => {
      throw new Error(`some error ${args}`);
    });

    let caughtError: any;
    try {
      throttled('C1');
    } catch(error) {
      caughtError = error;
    }
    expect(caughtError).toEqual(new Error('some error C1'));
  });

  it('should emit error on timer trailing edge', async () => {
    throttled = throttle(
      (...args: string[]) => {
        throw new Error(`some error ${args}`);
      },
      WAIT,
      {
        leading: false,
        trailing: true,
      });
    const errorMock = jest.fn();

    throttled.on('error', errorMock);

    throttled('C1');
    expect(errorMock).not.toHaveBeenCalled();

    await sleep(SLEEP_TIME);

    await throttled.end();

    expect(errorMock).toHaveBeenCalled();
  });
});
