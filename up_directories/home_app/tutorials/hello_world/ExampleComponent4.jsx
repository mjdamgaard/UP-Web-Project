


export function getInitialState() {
  return {counter: 0};
}

export function render({}) {
  let {counter} = this.state;

  return <div>
    <button onClick={() => {
      this.setState(state => ({...state, counter: counter + 1}));
    }}>{"Click me!"}</button>
    <div className="counter-display">
      {"Number of times clicked: " + counter}
    </div>
  </div>;

  // return <div>
  //   <button onClick={() => this.do("increaseCounter")}>{"Click me!"}</button>
  //   <div className="counter-display">
  //     {"Number of times clicked: " + counter}
  //   </div>
  // </div>;
}


// export const actions = {
//   "increaseCounter": function() {
//     let {counter} = this.state;
//     this.setState(state => ({...state, counter: counter + 1}));
//   }
// };