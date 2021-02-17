import { AsyncThrottleQueue } from '@/async-throttle-queue';
import { AsyncFixture } from '../fixtures/async-fixture';

describe('AsyncThrottleQueue', () => {
  const CALL_DURATION = 10;
  const WAIT = CALL_DURATION * 10;

  let fixture: AsyncFixture;
  let queue: AsyncThrottleQueue<string, string>;

  beforeEach(() => {
    fixture = new AsyncFixture({ duration: CALL_DURATION });
  });

  it('should await flush()', async () => {
    queue = new AsyncThrottleQueue(
      fixture.getTask(),
      WAIT,
      {
        leading: false,
        trailing: true,
        capacity: 2
      },
    );

    queue.add('a', 'b', 'c');
    queue.add('d');

    const results = await queue.flush();

    const expectedResult = ['a,b', 'c,d'];
    expect(results).toEqual(expectedResult);
  });

  it('should end with finish event by capacity, with trailing edge', async () => {
    const results: string[] = [];

    queue = new AsyncThrottleQueue(
      fixture.getTask(),
      WAIT,
      {
        leading: false,
        trailing: true,
        capacity: 2
      },
    );

    queue.on('result', (result: string) => {
      results.push(result);
    });

    queue.add('a', 'b', 'c');
    queue.add('d');

    await queue.end();

    expect(results).toEqual(['a,b', 'c,d']);
  });

  it('should end after flush', async () => {
    queue = new AsyncThrottleQueue(
      fixture.getTask(),
      WAIT,
      {
        leading: false,
        trailing: true,
        capacity: 2
      },
    );

    const results: any[] = [];
    queue.on('result', (result) => {
      results.push(result);
    });
    queue.add('a', 'b', 'c');
    queue.add('d');

    const flushResults = await queue.flush();
    expect(flushResults).toEqual(['a,b', 'c,d']);

    await queue.end();

    expect(results).toEqual(['a,b', 'c,d']);
  });

});
