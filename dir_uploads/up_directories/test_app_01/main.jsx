
// Simple "Hello, World" app that just checks that a component is rendered,
// and with a child component gotten from a nested directory. 

import * as Foo from "./test_nested/foo.jsx";

export function render() {
  return (
    <div>{"Hello, "}<Foo key={0} />{"!"}</div>
  );
}
