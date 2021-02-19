import { AsyncThrottleQueue } from '../src';

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

main().catch(console.error);
