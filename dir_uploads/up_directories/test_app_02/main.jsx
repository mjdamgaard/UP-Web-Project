
/* Some testing of actions and state changes, etc. */

import * as Foo from "./foo/foo.jsx";


export function render({}) {
  let {name} =  this.state;
  return (
    <div>
      <button onClick={() => {
        this.setState({name: "Changed Name"});
      }}>
        {"Click me!"}
      </button>
      <hr/>
      <span>{"Hello, "}<Foo key={0} name={name} />{"!"}</span>
    </div>
  );
}



export const initState = {name: "World"};


export const actions = {
  "changeName": function(name) {
    this.setState({...this.state, name: name});
  },
};