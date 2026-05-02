


export function render({}) {
  let {counter = 0} = this.state;

  return <div>
    <button onClick={() => {
      this.setState(state => ({...state, counter: counter + 1}));
    }}>Click me!</button>
    <div className="counter-display">
      {"Number of times clicked: " + counter}
    </div>
  </div>;
}
