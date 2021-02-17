// In real app, import from npm package
import { throttle } from '../src/throttle';

const WAIT = 100;

const throttled = throttle((s: string) => s, WAIT);

const a = throttled('a'); // => 'a'
const b = throttled('b'); // => 'a'
console.log(a);
console.log(b);

setTimeout(
  () => {
    const c = throttled('c'); // => 'c'
    console.log(c);
  },
  WAIT * 2);
