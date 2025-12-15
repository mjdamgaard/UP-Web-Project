
import * as ExampleComponent6 from "./ExampleComponent6.jsx";


export function render({}) {
  return <div>
    <h2>{"Triggering increaseCounter() from the child instance"}</h2>
    <button onClick={() => this.do("increaseCounter")}>
      {"Click me to increase my counter!"}
    </button>
    <div className="counter-display">
      {"Counter value: " + (this.state.counter ?? 0)}
    </div>
    <h2>{"Child instance"}</h2>
    <p>
      <ExampleComponent6 key="c-1" />
    </p>
  </div>;
}

export const actions = {
  "increaseCounter": function() {
    let {counter = 0} = this.state;
    this.setState(state => ({...state, counter: counter + 1}));
  }
};

export const events = [
  "increaseCounter",
];
