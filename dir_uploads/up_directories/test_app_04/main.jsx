
/* Some testing of actions and state changes, etc. */

import * as Foo from "./foo.jsx";


export function render({}) {
  let {name} =  this.state;
  return (
    <div>
      <h2>{"Let's test the styling system!"}</h2>
      <p className="">{"I am a paragraph styled with a CSS class."}</p>
      <button onClick={() => {
        this.setState({name: "Changed Name"});
      }}>
        {"Click me!"}
      </button>
      <hr/>
      <span>{"Hello, "}<Foo key={0} name={name} />{"!"}</span>
      <br/>
      <span onClick={() => {
        this.dispatch("changeName", "Third Name");
      }}>
        {"...Or even click me!"}
      </span>
      <br/>
      <i onClick={() => {
        this.call("self", "myMethod", "Fourth Name");
      }}>
        {"...or me."}
      </i>
      <br/>
      <b onClick={() => {
        this.call(0, "myMethod", "Fifth Name");
      }}>
        {"...Or me!!"}
      </b>
    </div>
  );
}



export const initState = {name: "World"};


export const actions = {
  "changeName": function(name) {
    this.setState({...this.state, name: name});
  },
};


export const methods = {
  "myMethod": function(name) {
    this.setState({...this.state, name: name});
  },
};