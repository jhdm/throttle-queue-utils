/* eslint-disable @typescript-eslint/no-explicit-any */
import { retryable } from '@/retryable';
import { RetryableAsyncFixture } from '../fixtures/retryable-async-fixture';

describe('retry async', () => {
  it('should succeed on first attempt', async () => {
    const fixture = new RetryableAsyncFixture({attemptNumberToSucceed: 1});
    const retryableTask = retryable(fixture.getTask());

    const result = await retryableTask('a', 'b');

    expect(fixture.invokeCount).toBe(1);
    expect(fixture.errorCount).toBe(0);
    expect(result).toBe('a,b');
  });

  it('should succeed on third attempt', async () => {
    const fixture = new RetryableAsyncFixture({attemptNumberToSucceed: 3});
    const retryableTask = retryable(fixture.getTask());

    const result = await retryableTask('c', 'd');

    expect(fixture.invokeCount).toBe(3);
    expect(fixture.errorCount).toBe(2);
    expect(result).toBe('c,d');
  });

  it('should return error when reached default max 3 attempts', async () => {
    const fixture = new RetryableAsyncFixture({attemptNumberToSucceed: 4});
    const retryableTask = retryable(fixture.getTask());

    let errorMessage = '';
    try {
      await retryableTask('a');
    } catch (error) {
      errorMessage = error && error.message ? error.message : error;
    }

    expect(fixture.invokeCount).toBe(3);
    expect(fixture.errorCount).toBe(3);
    expect(errorMessage).toEqual('simulated error');
  });

  it('should return error when reached explicit max 2 attempts', async () => {
    const fixture = new RetryableAsyncFixture({attemptNumberToSucceed: 4});
    const retryableTask = retryable(fixture.getTask(), {times: 2});

    let errorMessage = '';
    try {
      await retryableTask('b');
    } catch (error) {
      errorMessage = error && error.message ? error.message : error;
    }

    expect(fixture.invokeCount).toBe(2);
    expect(fixture.errorCount).toBe(2);
    expect(errorMessage).toEqual('simulated error');
  });
});
