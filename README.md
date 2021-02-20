# Throttled Batch Queue and Utilities

> Throttled batch queue, throttle, retry, and other utilities

Throttled batch queue supports capacity, retry, and async features.  It could be used for calling rate-limited services.

This project is inspired by lodash.

## Usage

To import the package:

```typescript
import { throttle } from 'throttle-queue-utils';
```

To use synchronous throttle:

```typescript
const throttled = throttle((s: string) => s, 1000);
const a = throttled('a'); // => 'a'
```

To use async throttle:

```typescript
const throttled = throttleAsync(asyncTask, 3000);
let result = await throttled('a'); // => 'a'
```

Example async throttled queue:

```typescript
const queue = new AsyncThrottleQueue(asyncTask);

const results: string[] = [];
queue.on('result', (res) => {
  results.push(res);
});

queue.add('a');
queue.add('b');

await queue.end();
console.log(results); // => ['a', 'b']
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
