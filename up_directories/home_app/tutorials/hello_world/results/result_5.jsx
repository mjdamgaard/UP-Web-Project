
import * as ExampleComponent5 from "../ExampleComponent5.jsx";


export function render() {
  return <div>
    <h2>{"Calling increaseCounter() from the parent"}</h2>
    <p>
      {"Click this button to increase the counter of Child instance 1: "}
      <button onClick={() => this.call("c-1", "increaseCounter")}>
        {"Increase Child 1's counter"}
      </button>
    </p>
    <p>
      {"And click this button to increase the counter of Child instance 2: "}
      <button onClick={() => this.call("c-2", "increaseCounter")}>
        {"Increase Child 2's counter"}
      </button>
    </p>
    <h2>{"Child instance 1"}</h2>
    <p>
      <ExampleComponent5 key="c-1" num={1} />
    </p>
    <h2>{"Child instance 2"}</h2>
    <p>
      <ExampleComponent5 key="c-2" num={5} />
    </p>
  </div>;
}
