
import * as Foo from "./test_nested/foo.js";

export function render() {
  return <div>{"Hello, "}<Foo key={0} />{"!"}</div>;
}
