
import * as ILink from 'ILink';
import * as ELink from 'ELink';
import * as VariableAppLinks from "./VariableAppLinks.jsx";
import {
  render1 as Result1, render2 as Result2, render3 as Result3,
  render4 as Result4, render5 as Result5, render6, render7 as Result7,
  actions as exActions, events as exEvents,
} from "~/../examples/main.jsx";

const Result6 = {
  render: render6,
  actions: exActions,
  events: exEvents,
};


export function render() {
  return page;
}



const page = <div className="page text-page">
  <h2>Front-end JSX components</h2>

  <h3>Introduction</h3>
  <p>
    This tutorial will teach you more about how to create front-end (JSX)
    components, and to make them responsive.
  </p>
  <p>
    The system used for building front-end components is inspired by
    <ELink key="link-wiki-react"
      href="https://en.wikipedia.org/wiki/React_(software)"
    >
      React
    </ELink>.
    So if you already know React, it should be easy to learn
    this system as well. And if not, you might still be able to
    follow these tutorials, but in that case, it is a good idea
    to browse through the
    <ELink key="link-w3-html"
      href="https://www.w3schools.com/html/default.asp"
    >
      HTML
    </ELink>,
    <ELink key="link-w3-js"
      href="https://www.w3schools.com/js/default.asp"
    >
      JavaScript
    </ELink>
    (JS), and
    <ELink key="link-w3-react"
      href="https://www.w3schools.com/react/default.asp"
    >
      React
    </ELink>
    tutorials at
    <ELink key="link-w3" href="https://www.w3schools.com">
      w3schools.com
    </ELink>
    first, before you continue with this tutorial.
  </p>


  <h3>Follow along</h3>
  <p>
    In order to be able to follow along and complete the steps of this
    tutorial yourself, you need to have first completed the steps of the
    <ILink key="link-tut-1-1" href="~/getting-started">
      previous tutorial
    </ILink>. 
  </p>
  <p>
    Then open the server_interface.js program again with the following
    command.
  </p>
  <p>
    <code className="command">{[
      'node ./server_interface.js up-web.org -d examples',
    ]}</code>
  </p>
  <p>
    Or if you already have the program open from the previous tutorial, you
    can simple change to the 'up_directories/examples' directory from inside
    the program via the following command.  
  </p>
  <p>
    <code className="command">{[
      'hello_world> cd examples',
    ]}</code>
  </p>
  <p>
    Then go ahead and upload this directory as well via the 'u' command once
    again:
  </p>
  <p>
    <code className="command">{[
      'examples> u',
    ]}</code>
  </p>
  <p>
    And by inserting the resulting 'HOME_DIR_ID' into the following field,
    similarly as in the previous tutorial, you well get a link to this
    example app that you just uploaded.
  </p>
  <p>
    <div className="text-frame">
      <VariableAppLinks key="var-app-links" />
    </div>
  </p>
  <p>
    You are now ready to follow along the steps of this tutorial.
  </p>


  <h3>A framework similar to React</h3>
  <p>
    Similarly to React, this framework allows you to define components
    of your app in a modular way.
  </p>
  <p>
    To see an example of this, go to the 'up_directories/examples/main.jsx'
    file, where you will see that this module's render() function currently
    just returns the same "Hello, World!" as in the previous tutorial: 
  </p>
  <p>
    <code className="jsx">{[
      'export function render() {\n',
      '  return <h1>Hello, World!</h1>;\n',
      '}',
    ]}</code>
  </p>
  <p>
    And indeed, if you follow the link to your app (and dismiss the phishing
    warning), it should also currently look as follows.
  </p>
  <p>
    <div className="text-display">
      <h1>Hello, World!</h1>
    </div>
  </p>
  <p>
    Then try to replace the render() function with the following snippet.
    (Or you can also simply comment out the current render() function and
    comment in the section just below it.)
  </p>
  <p>
    <code className="jsx">{[
      'export function render() {\n',
      '  return <div>\n',
      '    <h1>Hello, World!</h1>\n',
      '    <ExampleComponent1 key="ex-1" />\n',
      '  </div>;\n',
      '}',
    ]}</code>
  </p>
  <p>
    And at the same time, add the following import statement at the top of
    the module. (Or just comment in the corresponding line.)
  </p>
  <p>
    <code className="jsx">
      {'import * as ExampleComponent1 from "./ExampleComponent1.jsx";'}
    </code>
  </p>
  <p>
    If you now re-upload your directory with the 'u' command once again, you
    should now see the following result when you refresh the page of your
    app.
  </p>
  <p>
    <div className="text-frame">
      <Result1 key="r1" />
    </div>
  </p>
  <p>
    And if you go to the 'ExampleComponent1.jsx' module, you will indeed see
    that "I am a child component!" is the returned text of the render()
    function in that module.
  </p>
  <p>
    Now you know how to import components and use them inside other
    components!
  </p>
  <p>
    You might note that this way of importing components is not exactly the
    same as how it is typically done in React. In react you typically import
    and use the render() directly as your components. For instance, if you
    were to change the import statement from before to following instead, it
    would be compatible with React:
  </p>
  <p>
    <code className="jsx">
      {'import {render as ExampleComponent1} from "./ExampleComponent1.jsx";'}
    </code>
  </p>
  <p>
    This also works in this framework, as you can confirm if you try it out.
    However, we recommend defining your components as whole modules in
    general, since it allows
    you to define other useful properties of your components besides the
    render() function, as you will see below. And it furthermore means that
    your component will be defined by a single file path, which is useful
    for when the community wants to review it and assign trust to it.
  </p>


  <h3>Component properties (a.k.a. "props")</h3>
  <p>
    Similarly to React, components can have properties, or "props" for short,
    which determine some specifics about how they are rendered.
  </p>
  <p>
    As example, try out-commenting current render() function in main.jsx and
    comment in the next one that reads as follows.
  </p>
  <p>
    <code className="jsx">{[
      'export function render() {\n',
      '  return <div>\n',
      '    <h2>Some child component examples</h2>\n',
      '    <p>\n',
      '      <ExampleComponent2 key="ex-1"\n',
      '        isItalic={true} children="This paragraph is italic!"\n',
      '      />\n',
      '    </p>\n',
      '    <p>\n',
      '      <ExampleComponent2 key="ex-2" children="This paragraph is not!" />\n',
      '    </p>\n',
      '    <p>\n',
      '      <ExampleComponent2 key="ex-3" isItalic >\n',
      '        But this one is as well!\n',
      '      </ExampleComponent2>\n',
      '    </p>\n',
      '  </div>;\n',
      '}',
    ]}</code>
  </p>
  <p>
    And also fell free to comment in all the out-commented import statements
    at the top of the module, and in particular the one that reads
  </p>
  <p>
    <code className="jsx">
      {'import * as ExampleComponent2 from "./ExampleComponent2.jsx";'}
    </code>
  </p>
  <p>
    Then before re-uploading the directory again, take a look inside the
    ExampleComponent2.jsx module. It reads as follows.
  </p>
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
  <p>
    This component thus takes two props, namely an 'isItalic' prop, which
    defaults to false, and a 'children' prop. The component then branches
    according to isItalic, and renders the value of the children prop either
    nested inside an {"<i>"} element or not.
  </p>
  <p>
    If the you are unfamiliar with the syntax seen inside the argument
    tuple if this render() function, which is a so-called "object
    destructuring" syntax, you can can read about it
    <ELink key="link-destruct-1"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring"
    >
      here
    </ELink>
    or
    <ELink key="link-destruct-2"
      href="https://www.w3schools.com/js/js_destructuring.asp"
    >
      here
    </ELink>.
  </p>
  <p>
    If you now re-upload the directory, you will see the following.
  </p>
  <p>
    <div className="text-frame">
      <Result2 key="r2" />
    </div>
  </p>
  <p>
    We see that the first paragraph shown under the "Hello, World!" header is
    indeed italic, namely since isItalic was passed as true to the first
    component instance. And since no isItalic prop was passed to the
    instance at the second paragraph, that paragraph is not italic.
  </p>
  <p>
    The third paragraph also shows another fact about the components
    that is similar to React, which is that the 'children' prop
    is a special one that can be passed as the content inside the
    component instance element, instead of writing {"'children={<value>}'"}.
  </p>
  <p>
    This third example also shows, by the way, that passing a prop like
    'isItalic' without any explicit assignment is a shorthand for
    writing {"'isItalic={true}'"}.
  </p>



  <h3>States</h3>
  <p>
    The returned JSX element of each component instance is not
    determined solely by the props of the instance, but can also depend
    on its "state." This state can be updated during the lifespan
    of the instance via a setState() function, which works quite similarly to
    the setState() functions of React.
  </p>
  <p>
    In this framework, however, the state of a component instance is accessed
    on an object that is bound to the 'this' keyword for the render() function.
    More precisely, the instance's state is accessed via 'this.state'.
    And the setState() function is called via 'this.setState()'.
  </p>
  <p>
    To see an example of this, comment out the current render() function in
    main.jsx once again, and comment in the next one.
    (Also make sure that ExampleComponent3 is imported at the top of the
    module as well.) This render() function reads as follows.
  </p>
  <p>
    <code className="jsx">{[
      'export function render() {\n',
      '  return <div>\n',
      '      <h2>An example of a stateful component</h2>\n',
      '      <p>\n',
      '        <ExampleComponent3 key="ex-1" />\n',
      '      </p>\n',
      '  </div>;\n',
      '}',
    ]}</code>
  </p>
  <p>
    If you then re-upload your directory, you should now see a button
    saying "Click me!", like this:
  </p>
  <p>
    <div className="text-frame">
      <Result3 key="r3" />
    </div>
  </p>
  <p>
    And if you try to click that button a couple of
    times, you should see that a counter just below the button is increased
    each time.
  </p>
  <p>
    To understand how this happens, we can inspect the
    'ExampleComponent3.jsx' module, which reads
  </p>
  <p>
    <code className="jsx">{[
      'export function render({}) {\n',
      '  let {counter = 0} = this.state;\n',
      '  return <div>\n',
      '    <button onClick={() => {\n',
      '      this.setState(state => ({...state, counter: counter + 1}));\n',
      '    }}>Click me!</button>\n',
      '    <div className="counter-display">\n',
      '      {"Number of times clicked: " + counter}\n',
      '    </div>\n',
      '  </div>;\n',
      '}\n',
    ]}</code>
  </p>
  <p>
    First of all, we see that on the first line within the function body
    we extract a 'counter' property of the this.state object, and let its
    default value be 0. (This is another example of an object
    destructuring, which you can read about
    <ELink key="link-destruct-3"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring"
    >
      here
    </ELink>
    or
    <ELink key="link-destruct-4"
      href="https://www.w3schools.com/js/js_destructuring.asp"
    >
      here
    </ELink>.)
    This destructuring assignment is possible since the default initial
    value of this.state is an empty object.
  </p>
  <p>
    And then if we take a look at the {"<button>"} element, we see that it
    has an 'onClick' attribute, which directs the click event to a
    function that calls this.setState() to increase that counter by one.
  </p>
  <p>
    Note that setState() can be called on a callback function that takes the
    current state as its argument. And this is very much the recommended
    usage of setState(), as it first of all makes it easier to extend the
    component in the future, namely by including the
    <ELink key="link-spread"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax"
    >
      spread
    </ELink>
    of state, '...state', at the start of the returned new state.
    And it also helps to prevent the loss of
    data if the component is ever updated multiple times before
    rerendering, namely since the state argument of the callback function
    is guaranteed to always be up-to-date with the latest state change.
  </p>
  <p>
    Whenever setState() is called, a rerender of the component instance
    is queued, which means that the instance will update its appearance
    according to the new state.
  </p>
  <p>
    Lastly, if you want your component to have a different initial state
    than just an empty object, you can export a function called
    initialize() alongside render() in the component module. This
    function takes the same props argument as render() does, and returns
    the initial state object of the component.
    initialize() will thus be called exactly one time in the
    lifetime of the component instance, namely before the first call to
    the render() function.
  </p>
  <p>
    For instance, if you add the following export statement,
  </p>
  <p>
    <code className="jsx">{[
      'export function initialize({}) {\n',
      '  return {counter: 100};\n',
      '}\n',
    ]}</code>
  </p>
  <p>
    alongside the render() export of the previous example, the counter
    in question will now start at a value of 100.
  </p>
  <p>
    The initialize() function also gets its 'this'
    keyword bound to the same value as render(), which means that
    functions like this.setState() can be called from it as well.
    This thus also makes initialize() an ideal place for fetching
    whatever data the component needs from the database.
    And when the data-fetching promise resolves, the state of the
    component can be updated with the given data.
  </p>



  <h3>Actions, methods, and events</h3>
  <p>
    The component modules also have three more reserved exports which we
    will introduce in this tutorial, and that is an 'actions' export, a
    'methods' export, and an 'events' export.
  </p>

  <h4>Actions</h4>
  <p>
    The "Actions" of a component are essentially its "private methods," for
    anyone familiar with the concepts of Object-Oriented Programming (OOP).
    They are exported as properties of a single object called 'actions', and
    can then subsequently be called via a 'this.do(actionKey)' function.
  </p>
  <p>
    For instance, if we want to refactor our previous example of the
    increasing counter using actions instead, we can start by adding the
    following export from component as well.
  </p>
  <p>
    <code className="jsx">{[
      'export const actions = {\n',
      '  "increaseCounter": function(increment = 1) {\n',
      '    let {counter = 0} = this.state;\n',
      '    this.setState(state => ({...state, counter: counter + increment}));\n',
      '  }\n',
      '};\n',
    ]}</code>
  </p>
  <p>
    If you go to the 'ExampleComponent4.jsx' module, you will see an
    example of this, and here you will also see that the button element in
    the render() function has been changed from
  </p>
  <p>
    <code className="jsx">{[
      '<button onClick={() => {\n',
      '  this.setState(state => ({...state, counter: counter + 1}));\n',
      '}}>Click me!</button>',
    ]}</code>
  </p>
  <p>
    to just
  </p>
  <p>
    <code className="jsx">{[
      '<button onClick={() => this.do("increaseCounter")}>' +
        'Click me!</button>',
    ]}</code>
  </p>
  <p>
    when comparing to the 'ExampleComponent3.jsx' module. And this yields
    the exact same outcome as before, namely since this.do("increaseCounter")
    has the effect of calling the function of the same name from the
    'actions' object.
  </p>
  <p>
    One can also pass arguments to the given action, namely by
    supplying them as additional arguments to this.do(), after the initial
    action key argument. Indeed, you can see that we have given the
    "increaseCounter" action an optional 'increment' argument, which can
    specify another increment value other than 1.
  </p>
  <p>
    So if we e.g. pass a value of 2 as the second argument to this.do(),
    such that the whole component module now reads
  </p>
  <p>
    <code className="jsx">{[
      'export function render({}) {\n',
      '  let {counter = 0} = this.state;\n',
      '  return <div>\n',
      '    <button onClick={() => this.do("increaseCounter", 2)}>' +
            'Click me!</button>\n',
      '    <div className="counter-display">\n',
      '      Number of times clicked ×2: {counter}\n',
      '    </div>\n',
      '  </div>;\n',
      '}\n',
      '\n',
      'export const actions = {\n',
      '  "increaseCounter": function(increment = 1) {\n',
      '    let {counter = 0} = this.state;\n',
      '    this.setState(state => ({...state, counter: counter + increment}));\n',
      '  }\n',
      '};\n',
    ]}</code>
  </p>
  <p>
    we now get that the counter increases by 2 each time:
  </p>
  <p>
    <div className="text-frame">
      <Result4 key="r4" />
    </div>
  </p>
  <p>
    Note also that the 'this' keyword is automatically bound to the same
    object as for render() and initialize(), allowing us to call
    function this.setState(), or even this.do(), from within the actions
    themselves, without having to pass the 'this' object as a separate
    argument to the action functions. And this is one of the benefits of
    using actions over regular functions.
  </p>
  <p>
    However, the greatest benefit of using actions is that they can at any
    time be elevated to become part of the "methods" and/or the "events" of
    the component, which is what we will introduce next.
  </p>

  <h4>Methods</h4>
  <p>
    Methods are a special kind of actions that can be called from the
    parent component instance. An action is declared as a part of the
    given component's methods via an exported array called 'methods.'
    If this array includes the key of a given action, then that action
    becomes one of the methods that can be called by the parent
    component instance.
  </p>
  <p>
    To see how this works, we can let our render() function in the
    'main.jsx' module return the following, which is once again included
    as an out-commented snippet that you can easily comment in.
  </p>
  <p>
    <code className="jsx">{[
      'return <div>\n',
      '  <h2>Calling increaseCounter() from the parent</h2>\n',
      '  <p>\n',
      '    {"Click this button to increase the counter of Child instance 1: "}\n',
      '    <button onClick={() => this.call("c-1", "increaseCounter")}>\n',
      '      Increase Child 1\'s counter\n',
      '    </button>\n',
      '  </p>\n',
      '  <p>\n',
      '    {"And click this button to increase the counter of Child instance 2: "}\n',
      '    <button onClick={() => this.call("c-2", "increaseCounter")}>\n',
      '      Increase Child 2\'s counter\n',
      '    </button>\n',
      '  </p>\n',
      '  <h3>Child instance 1</h3>\n',
      '  <p>\n',
      '    <ExampleComponent5 key="c-1" increment={1} />\n',
      '  </p>\n',
      '  <h3>Child instance 2</h3>\n',
      '  <p>\n',
      '    <ExampleComponent5 key="c-2" increment={5} />\n',
      '  </p>\n',
      '</div>;\n',
    ]}</code>
  </p>
  <p>
    Here, ExampleComponent5 is defined by the following module.
  </p>
  <p>
    <code className="jsx">{[
      'export function render({increment = 1}) {\n',
      '  let {counter = 0} = this.state;\n',
      '  return <div>\n',
      '    <button onClick={() => this.do("increaseCounter")}>\n',
      '      {"Increase counter by " + increment}\n',
      '    </button>\n',
      '    <div className="counter-display">\n',
      '      {"Counter value: " + counter}\n',
      '    </div>\n',
      '  </div>;\n',
      '}\n',
      '\n',
      'export const actions = {\n',
      '  "increaseCounter": function() {\n',
      '    let {increment} = this.props;\n',
      '    let {counter = 0} = this.state;\n',
      '    this.setState(state => ({...state, counter: counter + increment}));\n',
      '  }\n',
      '};\n',
      '\n',
      'export const methods = [\n',
      '  "increaseCounter",\n',
      '];\n',
    ]}</code>
  </p>
  <p>
    Note in particular the 'methods' export at the bottom of the
    'ExampleComponent5.jsx' module, which declares the "increaseCounter"
    as part of the component's methods. And also note how in the returned
    JSX element of the parent uses a certain 'this.call()' function to
    call the methods of the two children.
  </p>
  <p>
    As can be seen in this example, the first argument of this.call()
    is the key prop of the targeted child instance, which in our case is
    "c-1" for the first child instance, and "c-2" for the second.
    The second argument is then of course the key of the method that we want
    to call for the given child. And although we do not use this in the
    current example, this.call() can also optionally take additional
    arguments, which will then be passed as the arguments to the given method.
  </p>
  <p>
    So from the code above, we get the following example. (And you can
    also try this yourself if you comment in the right lines and re-upload
    your component.)
  </p>
  <p>
    <div className="text-frame">
      <Result5 key="r5" />
    </div>
  </p>
  <p>
    You are now ready to use methods!
  </p>


  <h4>Events</h4>
  <p>
    Finally we have the 'events' of a component, which are very
    similar to the methods, only where the actions in question, rather
    than being exposed to the parent instance, are exposed to the descendant
    instances instead.
  </p>
  <p>
    Events are declared by exporting an array called 'events' from the
    component module, namely which includes the keys of the actions that
    should be declared as events. And in the same way that actions
    are called via this.do(), and methods are called via this.call(), the
    events are also triggered by their own function on the 'this' keyword,
    namely by 'this.trigger().'
  </p>
  <p>
    The this.trigger() function takes the event key as its first argument, as
    well as optional additional arguments which becomes the arguments to the
    event action. It then calls up to each of its ancestors,
    starting from the parent and going all the way up to the app root,
    until the first ancestor instance is found with an event of a
    matching key. If a match is found this way, the event action of the
    given ancestor instance is called.
    And if no match is found, this.trigger() simply returns undefined.
  </p>
  <p>
    To see an example of using an event, we can let the render()
    function in the 'main.jsx' module return the following JSX element.
  </p>
  <p>
    <code className="jsx">{[
      'return <div>\n',
      '  <h2>Triggering increaseCounter() from the child instance</h2>\n',
      ' <button onClick={() => this.do("increaseCounter")}>\n',
      '    Click me to increase my counter!\n',
      '  </button>\n',
      '  <div className="counter-display">\n',
      '    {"Counter value: " + (this.state.counter ?? 0)}\n',
      '  </div>\n',
      '  <h3>Child instance</h3>\n',
      '  <p>\n',
      '    <ExampleComponent6 key="c-1" />\n',
      '  </p>\n',
      '</div>;\n',
    ]}</code>
  </p>
  <p>
    You can also once again try this out by commenting in the next render()
    function in the 'main.jsx' module, and comment out the previous one.
    And in this case, you should also comment in the 'actions' and 'events'
    exports at the bottom, such that the 'main.jsx' module now also exports
    the following objects.
  </p>
  <p>
    <code className="jsx">{[
      'export const actions = {\n',
      '  "increaseCounter": function() {\n',
      '    let {counter = 0} = this.state;\n',
      '    this.setState(state => ({...state, counter: counter + 1}));\n',
      '  }\n',
      '};\n',
      '\n',
      'export const events = [\n',
      '  "increaseCounter",\n',
      '];\n',
    ]}</code>
  </p>
  <p>
    And for the module of ExampleComponent6, we will let this simply consist
    of the following render() function.
  </p>
  <p>
    <code className="jsx">{[
      'export function render() {\n',
      '  return <div>\n',
      '    <button onClick={() => this.trigger("increaseCounter")}>\n',
      '      Click me to increase my parent\'s counter!\n',
      '    </button>\n',
      '  </div>;\n',
      '}\n',
    ]}</code>
  </p>
  <p>
    When the button of the child component is clicked, it thus triggers
    an event that simply redirects to the "increaseCounter" action in 
    the parent, and the parent's counter is increased, like shown here:
  </p>
  <p>
    <div className="text-frame">
      <Result6 key="r6" />
    </div>
  </p>
  <p>
    Now you know how to use events!
  </p>
  <p>
    Lastly, it is also worth mentioning that both methods and events can be
    aliased such that the called action might have a different key then the
    one that is called/triggered. This is achieved by letting the given entry
    of the 'methods' or 'events' array be a
    {'["<method/event key>", "<action key>"]'} array,
    rather than just the {'"<action key>"'} string.
    For instance, if you change 'this.trigger("increaseCounter")'
    in ExampleComponent6.jsx to 'this.trigger("button-was-clicked")' instead,
    and change the methods export in main.jsx to the following, it
    would yield the same result.
  </p>
  <p>
    <code className="jsx">{[
      'export const events = [\n',
      '  ["button-was-clicked", "increaseCounter"],\n',
      '];\n',
    ]}</code>
  </p>



  <h3>Styling your components</h3>
  <p>
    You now know the basics of how to build responsive components. But you
    are still missing the last ingredient, which is how to give apply a style
    to them.
  </p>
  <p>
    In this framework, components can be styled simply by setting
    a special attribute called 'innerStyle' on any HTML element whose
    content you wish to style. This 'innerStyle' attribute accepts values of
    so-called 'CSSModule' objects, which are imported similarly to how you
    import a component module, and where target file is a '.css' file. 
  </p>
  <p>
    For instance, if you comment in the following import statement at the top
    of the 'main.jsx' file, this has the effect of importing the 'style.css'
    style sheet from the same directory. And the resulting 'myStyle' variable
    is now ready to used to be used as the values of 'innerStyle' attributes.
  </p>
  <p>
    <code className="jsx">{[
      'import * as myStyle from "./style.css";',
    ]}</code>
  </p>
  <p>
    To see this in action, comment in the final render() function in
    'main.jsx', along with the constants defined above it. (Also remember to
    comment out the previous render() function). This section reads
  </p>
  <p>
    <code className="jsx">{[
      'const colorArray = [\n',
      '  "orange", "red", "blue", "green", "yellow", "purple", "gray", "pink",\n',
      '];\n',
      'const len = colorArray.length;\n',
      '\n',
      'export function render() {\n',
      '  let {colorIndex = 0} = this.state;\n',
      '  return <div innerStyle={myStyle}>\n',
      '    <h1>I am a blue header</h1>\n',
      '    <h2>I am a red and cursive sub-header</h2>\n',
      '    <div className="color-grid">\n',
      '      <div className="red">I am red</div>\n',
      '      <div className="blue">I am blue</div>\n',
      '      <div className="green">I am green</div>\n',
      '      <div className="yellow">I am yellow</div>\n',
      '      <div className="purple">I am purple</div>\n',
      '      <div className="gray">I am gray</div>\n',
      '    </div>\n',
      '    <div className={"button " + colorArray[colorIndex]} onClick={() => {\n',
      '      this.setState(state => ({\n',
      '        ...state, colorIndex: (colorIndex + 1) % len\n',
      '      }));\n',
      '    }}>\n',
      '      Click me to change my color!\n',
      '    </div>\n',
      '  </div>;\n',
      '}',
    ]}</code>
  </p>
  <p>
    Note in particular how the 'innerStyle' attribute of the outer {"<div>"}
    element is set to the 'myStyle' object.  
  </p>
  <p>
    And if you open up the 'style.css' file which defines this object, you will
    see that is contains the following style sheet. 
  </p>
  <p>
    <code className="css">{[
      'h1{\n',
      '  color: blue;\n',
      '  font-family: serif;\n',
      '}\n',
      'h2 {\n',
      '  color: red;\n',
      '  font-family: cursive;\n',
      '}\n',
      '.color-grid {\n',
      '  display: grid;\n',
      '  grid-template-columns: auto auto;\n',
      '}\n',
      '.button, .color-grid > * {\n',
      '  text-align: center;\n',
      '  border: 2px ridge lightcyan;\n',
      '  height: 40px;\n',
      '  font-size: 25px;\n',
      '  font-family: serif;\n',
      '}\n',
      '.button:hover {\n',
      '  cursor: pointer;\n',
      '  user-select: none;\n',
      '}\n',
      '.red {\n',
      '  background-color: red;\n',
      '}\n',
      '.blue {\n',
      '  background-color: blue;\n',
      '  color: rgb(208, 208, 208);\n',
      '}\n',
      '.green {\n',
      '  background-color: rgb(23, 217, 23);\n',
      '}\n',
      '.yellow {\n',
      '  background-color: rgb(235, 255, 15);\n',
      '}\n',
      '.purple {\n',
      '  background-color: purple;\n',
      '  color: rgb(230, 230, 230);\n',
      '}\n',
      '.gray {\n',
      '  background-color: lightgray;\n',
      '}\n',
      '.orange {\n',
      '  background-color: orange;\n',
      '}\n',
      '.pink {\n',
      '  background-color: deeppink;\n',
      '}',
    ]}</code>
  </p>
  <p>
    (If you are new to CSS style sheets like this one, go and have a look at
    this
    <ELink key="link-css-1" href="https://www.w3schools.com/css/" >
      this tutorial
    </ELink> (at w3schools.com),
    which will introduce you to the wonderful world of CSS!)
  </p>
  <p>
    Then if you re-upload your app, you should see the following result.
  </p>
  <p>
    <div className="text-frame">
      <Result7 key="r7" />
    </div>
  </p>
  <p>
    You now know how to style your app!
  </p>
  <p>
    As a final remark, note that the 'innerStyle attribute also accepts a whole
    array of CSSModule objects, which means that you can also style your
    elements using several different style sheets at once.
  </p>



  <footer>
    <div className="prev-link"></div>
      <ILink key="link-tut-1-2" href="../getting-started">
        Previous tutorial
      </ILink>
    <div className="next-link">
      <ILink key="link-tut-3" href="../useful-tips">
        Next tutorial
      </ILink>
    </div>
  </footer>
</div>;
