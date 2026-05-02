


export function render({num = 1}) {
  let {counter = 0} = this.state;
  return <div>
    <button onClick={() => this.do("increaseCounter")}>
      {"Increase counter by " + num}
    </button>
    <div className="counter-display">
      {"Counter value: " + counter}
    </div>
  </div>;
}

export const actions = {
  "increaseCounter": function() {
    let {num} = this.props;
    let {counter = 0} = this.state;
    this.setState(state => ({...state, counter: counter + num}));
  }
};

export const methods = [
  "increaseCounter",
];