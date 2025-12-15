
// import * as ExampleComponent1 from "./ExampleComponent1.jsx";
// import * as ExampleComponent2 from "./ExampleComponent2.jsx";
// import * as ExampleComponent3 from "./ExampleComponent3.jsx";
// import * as ExampleComponent4 from "./ExampleComponent4.jsx";
// import * as ExampleComponent5 from "./ExampleComponent5.jsx";
// import * as ExampleComponent6 from "./ExampleComponent6.jsx";
// import * as ExampleComponent7 from "./ExampleComponent7.jsx";



export function render() {
  return <h1>{"Hello, ..."}</h1>;

  // return <div>
  //   <h1>{"Hello, World!"}</h1>
  //   <ExampleComponent1 key="ex-1" />
  // </div>;

  // return <div>
  //   <h1>{"Hello, World!"}</h1>
  //   <h2>{"Some child component examples"}</h2>
  //   <p>
  //     <ExampleComponent2 key="ex-1"
  //       isItalic={true} children="This paragraph is italic!"
  //     />
  //   </p>
  //   <p>
  //     <ExampleComponent2 key="ex-2" children="This paragraph is not!" />
  //   </p>
  //   <p>
  //     <ExampleComponent2 key="ex-3" isItalic >
  //       {"But this one is as well!"}
  //     </ExampleComponent2>
  //   </p>
  // </div>;


  // return <div>
  //   <h1>{"Hello, World!"}</h1>
  //   <h2>{"An example of a stateful component"}</h2>
  //   <p>
  //     <ExampleComponent3 key="ex-1" />
  //   </p>
  // </div>;

  // return <div>
  //   <h1>{"Hello, World!"}</h1>
  //   <h2>{"An example of a stateful component"}</h2>
  //   <p>
  //     <ExampleComponent4 key="ex-1" />
  //   </p>
  // </div>;

  // return <div>
  //   <h2>{"Calling increaseCounter() from the parent"}</h2>
  //   <p>
  //     {"Click this button to increase the counter of Child instance 1: "}
  //     <button onClick={() => this.call("c-1", "increaseCounter")}>
  //       {"Increase Child 1's counter"}
  //     </button>
  //   </p>
  //   <p>
  //     {"And click this button to increase the counter of Child instance 2: "}
  //     <button onClick={() => this.call("c-2", "increaseCounter")}>
  //       {"Increase Child 2's counter"}
  //     </button>
  //   </p>
  //   <h2>{"Child instance 1"}</h2>
  //   <p>
  //     <ExampleComponent5 key="c-1" num={1} />
  //   </p>
  //   <h2>{"Child instance 2"}</h2>
  //   <p>
  //     <ExampleComponent5 key="c-2" num={5} />
  //   </p>
  // </div>;

  // return <div>
  //   <h2>{"Triggering increaseCounter() from the child instance"}</h2>
  //   <button onClick={() => this.do("increaseCounter")}>
  //     {"Click me to increase my counter!"}
  //   </button>
  //   <div className="counter-display">
  //     {"Counter value: " + (this.state.counter ?? 0)}
  //   </div>
  //   <h2>{"Child instance"}</h2>
  //   <p>
  //     <ExampleComponent6 key="c-1" />
  //   </p>
  // </div>;

  // return <div>
  //   <h1>{"Hello, World!"}</h1>
  //   <ExampleComponent7 key="c-1" />
  // </div>;

}



// export const actions = {
//   "increaseCounter": function() {
//     let {counter = 0} = this.state;
//     this.setState(state => ({...state, counter: counter + 1}));
//   }
// };

// export const events = [
//   "increaseCounter",
// ];



// export const styleSheets = [
//   "./main.css",
// ];
