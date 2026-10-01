


export function render({increment = 1}) {
  let {counter = 0} = this.state;
  return <div>
    <button onClick={() => this.do("increaseCounter")}>
      {"Increase counter by " + increment}
    </button>
    <div className="counter-display">
      {"Counter value: " + counter}
    </div>
  </div>;
}

export const actions = {
  "increaseCounter": function() {
    let {increment} = this.props;
    let {counter = 0} = this.state;
    this.setState(state => ({...state, counter: counter + increment}));
  }
};

export const methods = [
  "increaseCounter",
];