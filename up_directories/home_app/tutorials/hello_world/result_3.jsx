
import * as ExampleComponent3 from "./ExampleComponent3.jsx";


export function render() {
  return <div>
    <h1>{"Hello, World!"}</h1>
    <h2>{"An example of a stateful component"}</h2>
    <p>
      <ExampleComponent3 key="ex-1" />
    </p>
  </div>;
}
