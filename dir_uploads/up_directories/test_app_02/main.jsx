
import * as Foo from "./foo/foo.jsx";


export function render({}) {
  let {name} =  this.state;
  return (
    <div>
      <span>{"Hello, "}<Foo key={0} name={name} />{"!"}</span>
      <button onClick={() => {
        this.setState({name: "Changed Name"});
      }}>
        {"Click me!"}
      </button>
    </div>
  );
}



export const initState = {name: "World"};


export const actions = {
  changeName: function(name) {
    this.setState(prev => {
      prev.name = name;
    });
  },
};