
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
      <span>{"Hello, "}<Foo key={"foo"} name={name} />{"!"}</span>
      <br/>
      <span onClick={() => {
        this.do("changeName", "Third Name");
      }}>
        {"...Or even click me!"}
      </span>
      <br/>
      <i onClick={() => {
        this.call("foo", "fooMethod1", "Fourth Name");
      }}>
        {"...or me."}
      </i>
      <br/>
      <b onClick={() => {
        this.call("foo", "fooMethod2", "Fifth Name");
      }}>
        {"...Or me!!"}
      </b>
    </div>
  );
}



export const initState = {name: "World"};


export const actions = {
  "changeName": function(name) {
    this.setState(state => ({...state, name: name}));
  },
};


export const events = [
  "changeName",
  ["IAmAnAlias", "changeName"],
];