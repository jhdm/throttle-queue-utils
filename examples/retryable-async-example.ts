// In real app, import from npm package
import { retryable } from '../src';

let attempt = 0;

function task(...args: any[]): Promise<string> {
  const response = args.toString();
  // Simulated success on second try
  if (++attempt % 2 === 0) {
    console.log(`attempt #${attempt}:`, response);
    attempt = 0;
    return Promise.resolve(response);
  }
  console.log(`attempt #${attempt}: simulated error`);
  throw new Error('simulated error');
}

async function main() {
  const retryableTask = retryable(task, { times: 2 });
  let result = await retryableTask('a'); // => a
  console.log('result:', result);
  result = await retryableTask('b'); // => b
  console.log('result:', result);
}

main().catch(console.error);
