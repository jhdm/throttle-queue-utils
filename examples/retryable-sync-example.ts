// In real app, import from npm package
import { retryable } from '../src';

let attempt = 0;

function task(...args: any[]): string {
  const response = args.toString();
  // Simulate success on second try
  if (++attempt % 2 === 0) {
    console.log(`attempt #${attempt}:`, response);
    attempt = 0;
    return response;
  }
  console.log(`attempt #${attempt}: simulated error`);
  throw new Error('simulated error');
}

const retryableTask = retryable(task);

// retryable always returns a Promise
retryableTask('a').then(console.log); // => a
retryableTask('b').then(console.log); // => b
