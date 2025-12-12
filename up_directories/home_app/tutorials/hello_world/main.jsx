
import * as ExampleComponent1 from "./ExampleComponent1.jsx";
import * as ExampleComponent2 from "./ExampleComponent2.jsx";
import * as ExampleComponent3 from "./ExampleComponent3.jsx";




export function render() {
  // return <h1>{"Hello, ..."}</h1>;

  // return <div>
  //   <h1>{"Hello, World!"}</h1>
  //   <ExampleComponent2 key="ex-1" />
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


  return <div>
    <h1>{"Hello, World!"}</h1>
    <h2>{"An example of a stateful component"}</h2>
    <p>
      <ExampleComponent3 key="ex-1" />
    </p>
  </div>;
}
