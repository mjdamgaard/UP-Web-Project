
import * as ExampleComponent1 from "./ExampleComponent1.jsx";
import * as ExampleComponent2 from "./ExampleComponent2.jsx";
import * as ExampleComponent3 from "./ExampleComponent3.jsx";
import * as ExampleComponent4 from "./ExampleComponent4.jsx";
import * as ExampleComponent5 from "./ExampleComponent5.jsx";
import * as ExampleComponent6 from "./ExampleComponent6.jsx";
import * as myStyle from "./style.css";



export function render() {
  return <h1>Hello, World!</h1>;
}

export function render1() {
  return <div>
    <h1>Hello, World!</h1>
    <ExampleComponent1 key="ex-1" />
  </div>;
}

export function render2() {
  return <div>
    <h2>Some child component examples</h2>
    <p>
      <ExampleComponent2 key="ex-2-1"
        isItalic={true} children="This paragraph is italic!"
      />
    </p>
    <p>
      <ExampleComponent2 key="ex-2-2" children="This paragraph is not!" />
    </p>
    <p>
      <ExampleComponent2 key="ex-2-3" isItalic >
        But this one is as well!
      </ExampleComponent2>
    </p>
  </div>;
}


export function render3() {
  return <div>
    <h2>An example of a stateful component</h2>
    <p>
      <ExampleComponent3 key="ex-3" />
    </p>
  </div>;
}

export function render4() {
  return <div>
    <h2>Another example of a stateful component</h2>
    <p>
      <ExampleComponent4 key="ex-4" />
    </p>
  </div>;
}

export function render5() {
  return <div>
    <h2>Calling increaseCounter() from the parent</h2>
    <p>
      {"Click this button to increase the counter of Child instance 1: "}
      <button onClick={() => this.call("c-1", "increaseCounter")}>
        Increase Child 1's counter
      </button>
    </p>
    <p>
      {"And click this button to increase the counter of Child instance 2: "}
      <button onClick={() => this.call("c-2", "increaseCounter")}>
        Increase Child 2's counter
      </button>
    </p>
    <h2>Child instance 1</h2>
    <p>
      <ExampleComponent5 key="c-1" increment={1} />
    </p>
    <h2>Child instance 2</h2>
    <p>
      <ExampleComponent5 key="c-2" increment={5} />
    </p>
  </div>;
}

export function render6() {
  return <div>
    <h2>Triggering increaseCounter() from the child instance</h2>
    <button onClick={() => this.do("increaseCounter")}>
      Click me to increase my counter!
    </button>
    <div className="counter-display">
      {"Counter value: " + (this.state.counter ?? 0)}
    </div>
    <h2>Child instance</h2>
    <p>
      <ExampleComponent6 key="ex-6" />
    </p>
  </div>;
}



const colorArray = [
  "orange", "red", "blue", "green", "yellow", "purple", "gray", "pink",
];
const len = colorArray.length;

export function render7() {
  let {colorIndex = 0} = this.state;
  return <div innerStyle={myStyle}>
    <h1>I am a blue header</h1>
    <h2>I am a red and cursive sub-header</h2>
    <div className="color-grid">
      <div className="red">I am red</div>
      <div className="blue">I am blue</div>
      <div className="green">I am green</div>
      <div className="yellow">I am yellow</div>
      <div className="purple">I am purple</div>
      <div className="gray">I am gray</div>
    </div>
    <div className={"button " + colorArray[colorIndex]} onClick={() => {
      this.setState(state => ({...state, colorIndex: (colorIndex + 1) % len }));
    }}>
      Click me to change my color!
    </div>
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
