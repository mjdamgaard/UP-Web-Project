
import * as Foo from "./foo.jsx";

export function render() {
  return (
    <div>
      <div className="some-paragraphs">
        <p>{"I am a normal paragraph."}</p>
        <p className="warning">{"I am a paragraph with some urgent text!"}</p>
        <p className="error">{"AAAaaaargh!! (just kidding)"}</p>
      </div>
      <Foo key={1} />
      <Foo key={2} />
    </div>
  );
}



export const stylePath = "./main.style.js";
