---
title: "useInterval"
description: "React hook for working with window.setInterval in JavaScript"
date: 2021-07-29
language: "javascript"
---

```js
function useInterval(callback, delay) {
  const intervalRef = React.useRef(null);
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    const tick = () => savedCallback.current();

    if (typeof delay === 'number') {
      intervalRef.current = window.setInterval(tick, delay);

      return () => window.clearInterval(intervalRef.current);
    }
  }, [delay]);

  return intervalRef;
}
```

## Context

Intervals are pretty darn tricky in React; if you're not careful, you'll wind up with a "stale" interval, one which can't access current values of state or props.

This hook allows us to sidestep that confusion, and it also gives us a superpower: we can modify the delay without having to worry about stopping and starting the interval.

I learned about this hook from Dan in his blog post on the subject, and he does a fantastic job explaining what all this funkiness is and why you need it. He explains it better than I would be able to, so if you're curious how it works, read his blog post all about it!

I did make one significant change to his version: My version of the hook returns the interval ID, similar to `window.setInterval`. This allows you to cancel the interval imperatively, if you need to. Note that this is an escape hatch: the primary declarative way to cancel the interval is to set the `delay` equal to `null`.

## Usage

`useInterval` looks quite a bit like `setInterval` in its usage:

```js
useInterval(() => {
  console.log('I fire every second!');
}, 1000);
```

Here's an example of a "Stopwatch" component. `useInterval` lets us track how much time has elapsed since the user has started the stopwatch.

```jsx
const Stopwatch = () => {
  const [status, setStatus] = React.useState('idle');
  const [timeElapsed, setTimeElapsed] = React.useState(0);

  useInterval(
    () => {
      setTimeElapsed((timeElapsed) => timeElapsed + 1);
    },
    status === 'running' ? 1000 : null
  );

  const toggle = () => {
    setTimeElapsed(0);
    setStatus((status) =>
      status === 'running' ? 'idle' : 'running'
    );
  };

  return (
    <>
      Time Elapsed: {timeElapsed} second(s)
      <button onClick={toggle}>
        {status === 'running' ? 'Stop' : 'Start'}
      </button>
    </>
  );
};
```
