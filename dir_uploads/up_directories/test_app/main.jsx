
import * as Foo from "./test_nested/foo.jsx";

export function render() {
  return (
    <div>{"Hello, "}<Foo key={0} />{"!"}</div>
  );
}
