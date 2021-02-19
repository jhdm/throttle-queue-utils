# Throttled Batch Queue and Utilities

> Throttled batch queue, throttle, retry, and other utilities

Throttled batch queue supports capacity, retry, and async features.  It could be used for calling rate-limited services.

This project is inspired by lodash.

## Examples

### Throttle (sync)

```typescript
import { throttle } from 'throttle-queue-utils';

const throttled = throttle((s: string) => s, 1000);
const a = throttled('a'); // => 'a'
```

### Throttle (async)

```typescript
import { throttleAsync } from 'throttle-queue-utils';

async function task(s: string) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(s), 10);
  });
}

async function main(): Promise<void> {
  const throttled = throttleAsync(task, 3000);
  let result = await throttled('a'); // => 'a'
}
```

### Async Throttled Queue Example

```typescript
import { AsyncThrottleQueue } from 'throttle-queue-utils';

async function main(): Promise<void> {
  const queue = new AsyncThrottleQueue(task);
  const results: string[] = [];

  queue.on('result', (res) => {
    results.push(res);
  });

  queue.add('a');
  queue.add('b');

  await queue.end();

  console.log(results); // => ['a', 'b']
}

async function task(s: string) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(s), 10);
  });
}
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
