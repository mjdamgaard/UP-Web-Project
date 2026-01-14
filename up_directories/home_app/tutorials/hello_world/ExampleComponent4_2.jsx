


export function render({}) {
  let {counter = 0} = this.state;
  return <div>
    <button onClick={() => this.do("increaseCounter", 2)}>Click me!</button>
    <div className="counter-display">
      {"Number of times clicked ×2: " + counter}
    </div>
  </div>;
}

export const actions = {
  "increaseCounter": function(num = 1) {
    let {counter = 0} = this.state;
    this.setState(state => ({...state, counter: counter + num}));
  }
};