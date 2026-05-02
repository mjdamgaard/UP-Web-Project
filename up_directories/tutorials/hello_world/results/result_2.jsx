
import * as ExampleComponent2 from "../ExampleComponent2.jsx";


export function render() {
  return <div>
    <h2>Some child component examples</h2>
    <p>
      <ExampleComponent2 key="ex-1"
        isItalic={true} children="This paragraph is italic!"
      />
    </p>
    <p>
      <ExampleComponent2 key="ex-2" children="This paragraph is not!" />
    </p>
    <p>
      <ExampleComponent2 key="ex-3" isItalic >
        But this one is as well!
      </ExampleComponent2>
    </p>
  </div>;
}
