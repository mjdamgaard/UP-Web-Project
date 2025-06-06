
import * as Foo from "./test_nested/foo.js";

export function render(resolve) {
  resolve(
    <div>{"Hello, "}<Foo key={0} />{"!"}</div>
  );
}
