// In real app, import from npm package
import { throttle } from '../src';

const WAIT = 500;

async function main(): Promise<void> {
  const throttled = throttle(
    (s: string) => new Promise((resolve) => {
      setTimeout(() => resolve(s), 10);
    }),
    WAIT);
  let result = await throttled('a'); // => 'a'
  console.log(result);
  // Within interval, so return last result
  result = await throttled('b'); // => 'a'
  console.log(result);

  // Wait for trailing edge (will process 'b')
  await new Promise((resolve) => {
    setTimeout(resolve, WAIT + 10);
  });

  result = await throttled('c'); // => 'b'
  console.log(result);
}

main().catch(console.error);
