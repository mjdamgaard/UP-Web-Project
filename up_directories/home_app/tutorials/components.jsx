
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as TextDisplay from "../misc/TextDisplay.jsx";
import * as Result0 from "./hello_world/result_0.jsx";
import * as Result1 from "./hello_world/result_1.jsx";
import * as Result2 from "./hello_world/result_2.jsx";
import * as Result3 from "./hello_world/result_3.jsx";


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Introduction to the front-end JSX components"}</h1>
  <section>
    <h2>{"A framework similar to React"}</h2>
    <p>{[
      "The system used for building front-end components is inspired a lot " +
      "by React. So if you already know React, it should be easy to learn " +
      "this system as well. And if not, then you might still be able to " +
      "follow these tutorials, but if you are ever confused about anything, " +
      "it might help to browse through the HTML, JavaScript (JS), and React " +
      "tutorials at ",
      <ELink key="link-w3" href="https://www.w3schools.com">
        {"www.w3schools.com"}
      </ELink>,
      " first."
    ]}</p>
    <p>{
      "To see how components work in this framework, let us first of all " +
      "take a look at the \"Hello, World!\" example from the " +
      "\"Getting started\" tutorial, where the component you uploaded was " +
      "defined from these lines of code:"
    }</p>
    <p>
      <code className="jsx">{[
        'export function render() {\n',
        '  return <h1>{"Hello, World!"}</h1>;\n',
        '}',
      ]}</code>
    </p>
    <p>{
      "which produced this result:"
    }</p>
    <p>{
      <TextDisplay key="_ex0" >
        <Result0 key="0" />
      </TextDisplay>
    }</p>
    <p>{
      "Here we see that the rendered \"Hello, " +
      "World!\" text is returned from an exported function called render(). " +
      "This is because, unlike React where components are generally defined " +
      "from only a single render function, components in this framework are " +
      "defined " +
      "by whole modules. The render() function is just one of " +
      "functions/methods that define the component."
    }</p>
    <p>{
      "But before we introduce the other possible exports of a component " +
      "module, let us see how importing a component works."
    }</p>
    <p>{
      "In the \"Hello, World!\" main.jsx file that was used in the " +
      "\"Getting started\" tutorial, there is an out-commented line at Ln. 2 " +
      "that reads:"
    }</p>
    <p>
      <code className="jsx">
        {'import * as ExampleComponent1 from "./ExampleComponent1.jsx";'}
      </code>
    </p>
    <p>{
      "Anyone familiar with JS modules will know that this has the effect of " +
      "importing all exports in the file at \"./ExampleComponent1.jsx\" " +
      "(relative to the importing module), and gather them all into a single " +
      "object, which is then assigned to a variable called " +
      "'ExampleComponent1.'"
    }</p>
    <p>{
      "Try commenting in this line. (Your IDE or editor ought to have " +
      "shortcut for doing so. For instance, " +
      "in VS Code, the shortcut is Ctrl + Shift + '/'.) " +
      "And after having done this, comment out Ln. 10 as well, and comment " +
      "in Ln. 12-15, such that the render() function now returns an example " +
      "JSX element where ExampleComponent1 is used:"
    }</p>
    <p>
      <code className="jsx">{[
        'return <div>\n',
        '  <h1>{"Hello, World!"}</h1>\n', 
        '  <ExampleComponent1 key="ex-1" />\n',
        '</div>;',
      ]}</code>
    </p>
    <p>{
      "If you now re-upload your directory again (in the the same way as " +
      "when you changed the \"...\" to \"World!\" in the previous tutorial), " +
      "you should now see the following result:"
    }</p>
    <p>{
      <TextDisplay key="_ex1" >
        <Result1 key="0" />
      </TextDisplay>
    }</p>
    <p>{
      "And if you go to the " +
      "ExampleComponent1.jsx module, you will indeed see that \"I am a child " +
      "component!\" is indeed the returned text of the render() function " +
      "in ExampleComponent1.jsx."
    }</p>
    <p>{
      "Now you know how to import and use components and use them as part " +
      "of other components!"
    }</p>
  </section>


  <section>
    <h2>{"Component properties (a.k.a. \"props\")"}</h2>
    <p>{
      "If you are already familiar with React, then " +
      "you can probably skip most of this section, except the last part " +
      "about the 'key' prop, as this property works slightly differently in " +
      "this system when compared to React."
    }</p>
    <p>{
      "A component does not need to always return the same thing. The " +
      "returned JSX element can also depend on the arguments on the render() " +
      "function (as well as on the so-called state of the component " +
      "instance, which we will introduce in the next section). The render() " +
      "function always takes a \"props\" object (short for \"properties\"), " +
      "where each \"prop\" (property) of this object is defined on the JSX " +
      "element that instantiates the component, using a syntax that is " +
      "similar to defining the attributes of an element in HTML."
    }</p>
    <p>{
      "For example, if you comment out the return statement at Ln. 12-15 " +
      "again and comment in the next return statement after that (on Ln. " +
      "17-33), and " +
      "also makes sure that the import statement of ExampleComponent2 is in-" +
      "commented, you will see an example of how to pass the props of " +
      "component instances. The render function should then return the " +
      "following:"
    }</p>
    <p>
      <code className="jsx">{[
        'return <div>\n',
        '  <h1>{"Hello, World!"}</h1>\n',
        '  <h2>{"Some child component examples"}</h2>\n',
        '  <p>\n',
        '    <ExampleComponent2 key="ex-1"\n',
        '      isItalic={true} children="This paragraph is italic!"\n',
        '    />\n',
        '  </p>\n',
        '  <p>\n',
        '    <ExampleComponent2 key="ex-2" children="This paragraph is not!" />\n',
        '  </p>\n',
        '  <p>\n',
        '    <ExampleComponent2 key="ex-3" isItalic >\n',
        '      {"But this one is as well!"}\n',
        '    </ExampleComponent2>\n',
        '  </p>\n',
        '</div>;\n',
      ]}</code>
    </p>
    <p>{
      "Before re-uploading the directory again, take a look inside the " +
      "ExampleComponent2.jsx module. It reads:"
    }</p>
    <p>
      <code className="jsx">{[
        'export function render({isItalic = false, children}) {\n',
        '  if (italic) {\n',
        '    return <i>{children}</i>;\n',
        '  }\n',
        '  else {\n',
        '    return <span>{children}</span>;\n',
        '  }\n',
        '}\n',
      ]}</code>
    </p>
    <p>{[
      "This component thus takes two props, namely an ",
      <span>{"'isItalic'"}</span>, " prop, which " +
      "defaults to false, and a ",
      <span>{"'children'"}</span>, " prop. " +
      "The component then branches " +
      "according to isItalic, and renders the value of the children prop, " +
      "either nested inside an <i> element or not, depending on the value of " +
      "isItalic."
    ]}</p>
    <p>{[
      "If the you are unfamiliar with the syntax seen inside the argument " +
      "tuple if this render() function, which is a so-called \"object " +
      "destructuring\" syntax, you can can read about it ",
      <ELink key="link-destruct-1"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring"
      >
        {"here"}
      </ELink>,
      " or ",
      <ELink key="link-destruct-2"
        href="https://www.w3schools.com/js/js_destructuring.asp"
      >
        {"here"}
      </ELink>,
      "."
    ]}</p>
    <p>{
      "Now, if you re-upload the directory, you will then see the following:"
    }</p>
    <p>{
      <TextDisplay key="_ex2" >
        <Result2 key="0" />
      </TextDisplay>
    }</p>
    <p>{
      "We thus see that the first " +
      "paragraph shown under the \"Hello, World!\" header is indeed italic, " +
      "namely since isItalic was passed as true to the component instance at " +
      "Ln. 22 in main.jsx. And since no isItalic prop was passed to the " +
      "instance at the second paragraph, that paragraph is not italic."
    }</p>
    <p>{
      "The third paragraph also shows another fact about the components, " +
      "which is similar to React, and that is that the 'children' property " +
      "is a special property that can also be passed in another way, rather " +
      "than via the 'children={<value>}' syntax. Instead the children prop " +
      "can also be passed as the content inside the component instance element."
    }</p>
    <p>{
      "And ths example also shows, by the way, that passing a prop like " +
      "'isItalic' without any explicit assignment is a shorthand for " +
      "writing 'isItalic={true}'."
    }</p>
    <p>{
      "Lastly, note that all the component instance elements all have an " +
      "unique 'key' prop. This a requirement in this system, meaning that " +
      "of one omit the key prop, or use a duplicate key prop shared by " +
      "another " +
      "child instance of the same parent component, the program will " +
      "throw an error. And as opposed to React where the key props are only " +
      "used to distinguish between child instances that are children of the " +
      "same HTML element, here we require all the child instances of a " +
      "given parent component are given unique keys among each other, " +
      "regardless of where they " +
      "are located within the returned JSX element."
    }</p>
    <p>{
      "Having to always choose a unique key for each single child instance " +
      "of course adds a bit of extra work when compared to React. But on the " +
      "plus side, this also means that you can move each individual child " +
      "instance freely around in the returned JSX element of the parent " +
      "component, without losing its state. " +
      "(This is unlike React, where if you e.g. wrap a child instance in, " +
      "say, an <a> element or an <i> element in response to some event, this " +
      "will cause the child instance to lose its state.)"
    }</p>
  </section>


  <section>
    <h2>{"States"}</h2>
    <p>{
      "As mentioned above, the returned JSX element of each component " +
      "instance is not determined solely by the props of the instance, but " +
      "also by its \"state.\" This state can be updated during the lifespan " +
      "of the instance via a setState() function, which works similarly to " +
      "the setState() function of React. But this where the similarities " +
      "with React stops."
    }</p>
    <p>{
      "In this framework, the state of a component instance is accessed on " +
      "an " +
      "object that is bound to the 'this' keyword for the render() function. " +
      "More precisely, the instance's state is accessed via 'this.state'. " +
      "And the setState() function is called via 'this.setState()'."
    }</p>
    <p>{
      "To see an example of this, you can comment out the previous return " +
      "statement in main.jsx, and comment in the next one on Ln. 36-42. " +
      "And also make sure that the import of ExampleComponent3 is in-" +
      "commented as well. The render() function should now return:"
    }</p>
    <p>
      <code className="jsx">{[
        'return <div>\n',
        '  <h1>{"Hello, World!"}</h1>\n',
        '    <h2>{"An example of a stateful component"}</h2>\n',
        '    <p>\n',
        '      <ExampleComponent3 key="ex-1" />\n',
        '    </p>\n',
        '</div>;',
      ]}</code>
    </p>
    <p>{
      "If you then re-upload your directory, you should now see a button " +
      "saying \"Click me!\", like so:"
    }</p>
    <p>{
      <TextDisplay key="_ex3" >
        <Result3 key="0" />
      </TextDisplay>
    }</p>
    <p>{
      "And if you try to click that button a couple of " +
      "times, you should see that a counter is increased each time, just " +
      "below the button."
    }</p>
    <p>{
      "To understand how this happens, we can inspect ExampleComponent3.jsx, " +
      "which reads:"
    }</p>
    <p>
      <code className="jsx">{[
        'export function render({}) {\n',
        '  let {counter = 0} = this.state;\n',
        '  return <div>\n',
        '    <button onClick={() => {\n',
        '      this.setState(state => ({...state, counter: counter + 1}));\n',
        '    }}>{"Click me!"}</button>\n',
        '    <div className="counter-display">\n',
        '      {"Number of times clicked: " + counter}\n',
        '    </div>\n',
        '  </div>;\n',
        '}\n',
      ]}</code>
    </p>
    <p>{[
      "First of all, we see that on the first line within the function body, " +
      "we extract a 'counter' property of the this.state object, and let its " +
      "default value be 0. (This is another example of an object " +
      "destructuring, which you can read about ",
      <ELink key="link-destruct-3"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring"
      >
        {"here"}
      </ELink>,
      " or ",
      <ELink key="link-destruct-4"
        href="https://www.w3schools.com/js/js_destructuring.asp"
      >
        {"here"}
      </ELink>,
      ".) ",
      "This destructuring assignment is possible since the default initial " +
      "value of this.state is an empty object."
    ]}</p>
    <p>{
      "And then if we take a look at the <button> element, we see that it " +
      "has an 'onClick' attribute, which directs the click event to a " +
      "function that calls this.setState() to increase that counter by one."
    }</p>
    <p>{[
      "Note that setState() can be called on a callback function that takes " +
      "the " +
      "current state as its argument. And this is very much the recommended " +
      "usage of setState(), as it first of all makes it easier to extend the " +
      "component in the future, namely by including the ",
      <ELink key="link-spread"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax"
      >
        {"spread"}
      </ELink>,
      " of state, '...state', at the start of the returned new state. " +
      "And it also helps to prevent the loss of " +
      "data if the component is ever updated multiple times before " +
      "rerendering, namely since the state argument of the callback function " +
      "is guaranteed to always be completely up-to-date with the latest " +
      "state change."
    ]}</p>
    <p>{
      "Whenever setState() is called, a rerender of the component instance " +
      "is queued, which means that the instance will update its appearance " +
      "according to the new state."
    }</p>
  </section>


</div>;
