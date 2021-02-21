# Throttled Batch Queue and Utilities

> Throttled batch queue, throttle, retry, and other utilities

`throttle` and `throttleAsync` functions provide throttling of tasks, that is, call the task at no less than specified interval length of time.

Throttled batch queue (`AsyncThrottledQueue`) supports throttling, capacity, retry, and asynchronous features.  It could be used for calling rate-limited services.

This project is inspired by lodash.

## Usage

To import the package:

```typescript
import { throttle } from 'throttle-queue-utils';
```

In order to illustrate what it looks like, let's look at some basic examples below.

### Throttle

To throttle task at three-second intervals, for example:

```typescript
const options = { leading: true, trailing: true };
const throttled = throttle(task, 3000, options);
let result = throttled('a'); // => 'a'
```

The leading edge and trailing edge options are `true`, by default.

For the purpose of these examples, let's asusme that the task or async task functions echo back the input.  Then the return value above would be `'a'`.

Asynchronous throttle is similar, but takes a task that returns a `Promise`:

```typescript
const throttled = throttleAsync(asyncTask);
let result = await throttled('a'); // => 'a'
```

### Asynchronous Throttled Batch

The asynchronous throttled batch queue (`AsyncThrottleQueue`) example below will execute
specified `asyncTask` function at three-second intervals.  You can `add`
items to be processed.

#### Example:

```typescript
const options = { capacity: 65536 };
const queue = new AsyncThrottleQueue(asyncTask, 3000, options);

const results: string[] = [];
queue.on('result', (res) => {
  results.push(res);
});

queue.add('a');
queue.add('b');

await queue.end();
console.log(results); // => ['a', 'b']
```

This example specifies an optional `capacity` in bytes.  If not specified, it will process all remaining payload at the next execution time.

The optional `'result'` event listener receives task results.

The optional `end()` method indicates the end of input to the queue.  With no parameter, it returns a `Promise`, and you can `await` it to synchronize with the end of processing.  It could be used to synchronize with the end of unit test, for example,

```typescript
it('should ...', async () => {
  // ...
  await queue.end();
});
```

It could also takes a callback function, instead:

```typescript
it('should ...', (done) => {
  // ...
  queue.end(done);
});
```

Please see examples folder for more examples.

## Development

### Installing Dependencies

```
yarn install
```

### Build

```
yarn run build
```

### Running Unit Tests

```
yarn run test
```
