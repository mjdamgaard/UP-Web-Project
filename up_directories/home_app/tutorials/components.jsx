
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as EntityList from "../entity_lists/EntityList.jsx";
import * as Example from "./hello_world/main.jsx";


export function render() {
  return page;
}



const page = <>
  <h1>{"Introduction to the front-end JSX components"}</h1>
  <section>
    <h2>{"About this tutorial"}</h2>
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
      "."
    ]}</p>
    <p>{
      "You are also very welcome to send an e-mail to mads@up-web.org if you " +
      "have any questions. And if you run into any bugs that you don't know " +
      "how to solve, please feel free to send an e-mail as well, as I " +
      "might be able to help you."
    }</p>
  </section>


  <section>
    <h2>{"A system similar to React"}</h2>
    <p>{
      "If you take a look at the \"Hello, World!\" example from the " +
      "\"Getting started\" tutorial, you will see that the rendered \"Hello, " +
      "World!\" text is returned from an exported function called render(). " +
      "This is because, unlike React where components are generally defined " +
      "only a single render function, components in this system are defined " +
      "by whole modules, where the render() function is just one of " +
      "functions/methods that define the component."
    }</p>
    <p>{
      "But before we introduce the other possible exports of a component " +
      "module, let us see how importing a component works."
    }</p>
    <p>{
      "In the \"Hello, World!\" main.jsx file that we saw in the " +
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
      "object, which is then declared as a variable called " +
      "'ExampleComponent1.'"
    }</p>
    <p>{
      "Try commenting in this line. (Your IDE or editor ought to have " +
      "shortcut for doing so. And if not, you ought to install one that " +
      "has, and also one that supports syntax highlighting for JSX in " +
      "particular, such as VSCode (with the right packages). For instance, " +
      "in VSCode, the shortcut is Ctrl + Shift + '/'.) " +
      "And after having done this, comment out Ln. 10 as well, and comment " +
      "in Ln. 12-15, such that the render() function now returns an example " +
      "JSX element where ExampleComponent1 is used:"
    }</p>
    <p>
      <code className="jsx">{[
        'return <div>\n',
        '  <h1>{"Hello, World!"}</h1>\n', 
        '  <ExampleComponent2 key="ex-1" />\n',
        '</div>;',
      ]}</code>
    </p>
    <p>{
      "If you now re-upload your directory again (in the the same way as " +
      "when you changed the \"...\" to \"World!\" in the previous tutorial), " +
      "you should now see the text, \"I am a child component!\" rendered " +
      "underneath the \"Hello, World!\" header. And if you go to the " +
      "ExampleComponent1.jsx module, you will indeed see that this text is " +
      "the returned JSX element of this child component."
    }</p>
    <p>{
      "Now you know how to import and use components in other components."
    }</p>
  </section>


  <section>
    <h2>{"Component properties, a.k.a. \"props\")"}</h2>
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
      "function always takes a \"props\" object (short for \"properties\") " +
      "where each \"prop\" (property) of this object is defined on the JSX " +
      "element that instantiates the component, using a syntax that is " +
      "similar to when defining attributes of elements in HTML."
    }</p>
    <p>{
      "For example, if you comment out the return statement at Ln. 12-15 " +
      "again and comment in the next return statement after that (on Ln. " +
      "17-33), and " +
      "also makes sure that the import statement of ExampleComponent2 is in-" +
      "commented, you will see an example of how to pass the props of " +
      "component instances."
    }</p>
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
    <p>{
      "This component thus takes two props, namely 'isItalic' prop, which " +
      "defaults to false, and a 'children' prop. The component then branches " +
      "according to isItalic, and renders the value of the children prop, " +
      "either nested inside an <i> element or not, depending in isItalic."
    }</p>
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
      "Now, if you re-upload the directory, you will see that the first " +
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
      "Lastly, note that all the component instance elements all have an " +
      "unique 'key' prop. This a requirement in this system, meaning that " +
      "of omit the key prop, or use a duplicate key prop shared by another " +
      "child instance of the same component, the program will immediately " +
      "throw an error. And as opposed to React where the key props are only " +
      "used to distinguish between child instances that are children of the " +
      "same HTML element, here we require all the child instances of a " +
      "component to unique keys among each other, regardless of where they " +
      "are located within the returned JSX element."
    }</p>
    <p>{
      "Having to always choose a unique key for each single child instance " +
      "of course adds a bit of extra work when compared to React. But on the " +
      "plus side, this also means that you can move each individual child " +
      "instance freely around in the returned JSX element of the parent " +
      "component, without losing the states of these child components."
    }</p>
    <p>{
      "This is unlike React, where if you e.g. wrap a child instance in, " +
      "say, an <a> element or an <i> element in response to some event, this " +
      "will cause the child instance to lose its state. But this is not the " +
      "case in this system."
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
      "In this system, the state of a component instance is accessed on an " +
      "object that is bound to the 'this' keyword for the render() function. " +
      "More precisely the instance's state is accessed via 'this.state'. And " +
      "the setState() function is called via 'this.setState()'."
    }</p>
    <p>{
      "To see an example of this, you can comment out the previous return " +
      "statement in main.jsx, and comment in the next one on Ln. 36-42. " +
      "And also make sure that the import of ExampleComponent3 is in-" +
      "commented as well."
    }</p>
    <p>{
      "If you then re-upload your directory, you should now see a button " +
      "saying \"Click me!\". And if you try to click that button a couple of " +
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
      "This destructuring assignment is possibly since the default initial " +
      "value of this.state is an empty object."
    ]}</p>
    <p>{
      "And then if we take a look at the <button> element, we see that it " +
      "has an 'onClick' attribute, which redirects the click event to a " +
      "function that calls this.setState() to increase that counter by one. " +
      "Note that setState() can be called on a callback function that takes " +
      "the " +
      "current state as its argument. And this is very much the recommended " +
      "usage of setState(), as it first of all makes it easier to extend the " +
      "component in the future. And it also helps to prevent the loss of " +
      "data if the component is ever updated multiple times before " +
      "rerendering, namely since the state argument of the callback function " +
      "is guaranteed to always be completely up to data with the latest " +
      "state change."
    }</p>
    <p>{
      "Whenever setState() is called, a rerender of the component instance " +
      "is queued, which means that the instance will update its appearance " +
      "according to the new state."
    }</p>

    {/* ... */}
    <p>{
      "Note that the fact that we need to bind the 'this' keyword is also " +
      "why you should never define the render() function as an arrow " +
      "function, as this will prevent the correct binding of the 'this' " +
      "keyword."
    }</p>
  </section>


  <section>
    <h2>{"TODO: Remove this:"}</h2>
    <Example key="example" />
  </section>

</>;
