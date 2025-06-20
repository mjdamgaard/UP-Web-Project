
import * as Foo from "./foo/foo.jsx";


export function render({}) {
  let state = this.state;
  let {name = "World"} = state;
  return (
    <div>{"Hello, "}<Foo key={0} name={name} />{"!"}</div>
  );
}
