
import * as Foo from "./foo/foo.jsx";


export function render({}) {
  let {name} =  this.state;
  return (
    <div>{"Hello, "}<Foo key={0} name={name} />{"!"}</div>
  );
}



export const initState = "World"; // {name: "World"} 