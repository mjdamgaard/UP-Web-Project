
import * as ILink from 'ILink';
import * as ELink from 'ELink';


export function render() {
  return page;
}



const page = <div className="page text-page">
  <h2>Tips and useful things to know</h2>

  <h3>Introduction</h3>
  <p>
    The sandbox that makes it safe to upload and share your apps and prototypes
    immediately naturally also puts some restrictions on what you can do in the
    framework. This gives the framework a few quirks that might be different
    from what you are used to. 
  </p>
  <p>
    In this tutorial, we will go over some useful tips and general things to be
    aware of when using this framework.
  </p>

  <h3>Debugging</h3>
  <p>
    In regular JavaScript, you can use a 'debugger;' statement to halt and
    investigate the code at a certain breakpoint. And while this framework
    technically also implement a 'debugger;' statement, it will halt inside
    native code of the interpreter of the sandbox rather than in your own code,
    which makes it of little use when debugging.   
  </p>
  <p>
    To compensate for this, however, the global console.trace() function is
    altered to be much more verbose than its regular counterpart, giving you
    a lot of information about the stack, including the argument values of each
    function call. Thus, by using a combination of console.log() and
    console.trace(), you can often find the bug that you are looking for in a
    reasonable time, at least once you get used to the output format of the
    latter.
  </p>
  <p>
    Furthermore, all uncaught errors will also automatically get the
    same trace information appended to them. This makes the error messages of
    this framework very verbose, but means that you often be able to find the
    cause of an error just be investigating the immediate error message.
  </p>
  <p>
    So when you open your web console, do not be frightened or panic whenever
    you see a large wall of red text. Just click within the console and hit
    your 'Home' key to go to the top of the console. And there you immediately
    read the original error message, followed by a code snippet pointing to
    where the error occurred, which is again followed by list of information
    about each function call on the stack, and ending with a list of defined
    variables in the environment where the error occurred.
  </p>


  <h3>Importing from modules of foreign directories</h3>
  <p>
    When you import functions and variables from other modules, you naturally
    cannot import them from other files on your computer outside of the
    uploaded directory, as these files will not be available on the server.
    However, if you have uploaded other directories as well,
    {/* from the same computer, */}
    you will generally be able to import from these directories as
    well.
  </p>
  <p>
    For instance, if you wanted to import your initial "Hello, World!" app
    from the example app of
    <ILink key="link-tut-2-1" href="~/jsx-components">
      previous tutorial
    </ILink>,
    you could use the following import statement,
  </p>
  {/* <p>
    <code className="jsx">{[
      'import * as HelloWorldApp from "../hello_world/main.jsx";',
    ]}</code>
  </p>
  <p>
    This is possible because the file located at
    up_directories/directories.json, which keeps track of the IDs of each of
    your uploaded directories.
    ... Well, this is only possible if you also include the placeholders.json
    file, and I think that might be a bit complicated to introduce here; it
    should probably wait to another tutorial..(?)
  </p> */}
  <p>
    <code className="jsx">{[
      'import * as HelloWorldApp from "../HOME_DIR_ID/main.jsx";',
    ]}</code>
  </p>
  <p>
    where 'HOME_DIR_ID' is replaced by the hexadecimal ID that was assigned to
    your hello_world directory.
  </p>
  <p>
    (There is also a way declare placeholders for the directory IDs, such that
    you can e.g. write "../hello_world/main.jsx" instead of
    "../HOME_DIR_ID/main.jsx" in the import statement. But we will leave this
    for a future tutorial.) 
  </p>
  <p>
    You are also even able to import from the directories of other users as
    well, namely by simply using the 'HOME_DIR_ID' of those directories instead
    in the import statement. This means that apps and app components can be
    shared across the network.
  </p>
  <p>
    CAUTION: Before you import from the directories of other users, make sure
    to check that these modules are open-source, or that you meet the license
    requirements to use the code. Otherwise your directory might get reported
    and removed.
  </p>


  <h3>Objects are immutable by default</h3>
  <p>
    Because users are able to import freely from other modules, however, it
    means that having objects be mutable by default would be a security
    nightmare. Therefore, all objects of this framework (including arrays)
    are immutable by default. And you need to use special class constructors
    whenever you want to define mutable ones.  
  </p>
  <p>
    For instance, the following code will <i>not</i> work in this framework. 
  </p>
  <p>
    <code className="jsx">{[
      'let obj = {a: "foo", b: "bar"};\n',
      'obj.b = "baz"; // Will throw an error!\n',
      '\n',
      'let arr = [0, 1, 2];\n',
      'arr[3] = 3; // Will throw an error!',
    ]}</code>
  </p>
  <p>
    However, the following code will work.
  </p>
  <p>
    <code className="jsx">{[
      'let obj = new MutableObject({a: "foo", b: "bar"});\';\n',
      'obj.b = "baz";\n',
      '\n',
      'let arr = new MutableArray([0, 1, 2]);\';\n',
      'arr[3] = 3;',
    ]}</code>
  </p>
  <p>
    And by using the spread operator, you can also often achieve the same
    result, even when working with immutable objects:
  </p>
  <p>
    <code className="jsx">{[
      'let obj1 = {a: "foo", b: "bar"};\n',
      'let obj2 = {...obj1, b: "baz"};',
      '\n',
      'let arr1 = [0, 1, 2];\n',
      'let arr2 = [...arr1, 3];\n',
    ]}</code>
  </p>






  <h3>{"Objects are immutable by default"}</h3>
  <p>{
    "All objects are immutable by default in this version of JS, " +
    "including arrays. This is also due to the fact that in this UP " +
    "system, you generally cannot count on all other users, as some might " +
    "in principle have malicious intentions. " +
    "And this is why you must never export a mutable " +
    "object from a module, nor any object that holds a reference to a " +
    "mutable object. For if you do, other users might import and corrupt " +
    "the data held in that object, causing failures and errors elsewhere."
  }</p>
  <p>{
    "And in order to make preventing exporting mutable objects a feasible " +
    "task for the users, " +
    "all objects are therefore immutable by default."
  }</p>
  <p>{
    "So if you for instance have a standard plain object and you want to " +
    "change one of its properties, the following code would throw an error."
  }</p>
  <p>
    <code className="jsx">{[
      'let obj = {a: "foo", b: "bar"};\n',
      'obj.b = "baz"; // Will throw an error!',
    ]}</code>
  </p>
  <p>{
    "But what you might do instead is to make use of the spread operator " +
    "to create the new desired object, and then simply reassign it to the " +
    "same variable, like so:"
  }</p>
  <p>
    <code className="jsx">{[
      'let obj = {a: "foo", b: "bar"};\';\n',
      'obj = {...obj, b: "baz"};',
    ]}</code>
  </p>
  {/* <p>{
    "(By the way, whereas React recommends using the 'const' keyword as " +
    "much as possible, this framework recommends using the 'let' keyword " +
    "as much as possible, except at the module scope, and in particular " +
    "for exports.)"
  }</p> */}
  <p>{
    "However, if you do want to use a mutable object or array, you can " +
    "just use either the MutableObject() or the MutableArray() " +
    "constructor, respectively. For example, the following code will " +
    "also succeed."
  }</p>
  <p>
    <code className="jsx">{[
      'let obj = new MutableObject({a: "foo", b: "bar"});\';\n',
      'obj.b = "baz";\n',
      '\n',
      'let arr = new MutableArray([0, 1, 2, 2]);\';\n',
      'arr[3] = 3;',
    ]}</code>
  </p>
  <p>{
    "Just make sure that you do not export any such mutable object from the " +
    "module, nor any object that contains a reference to one. And for the " +
    "same reason you also should not export any functions that mutates " +
    "an object that is not either created by that function, or comes from " +
    "one of the arguments."
  }</p>








  <h3>{"Module paths"}</h3>
  <p>{
    "It is important to note, however, that the paths in the import " +
    "statements, like the one seen " +
    "above, must be relative paths that stay within the directory that " +
    "you have uploaded."
  }</p>
  <p>{
    "That is, unless you want to import components (or " +
    "functions, etc.) from another directory altogether, either another " +
    "one of yours, or of another user."
  }</p>
  <p>{
    "In that case, you need " +
    "to use the absolute path to the foreign module, not in relation to " +
    "your local file system, but to the server-side file system. This " +
    "means that the absolute paths should be of the form " +
    "\"/<UP node ID>/<home directory ID>/<path from that directory>\". " +
    "Here <UP node ID> is the ID of the UP node, which in the case of " +
    "up-web.org is just \"1\". " +
    "And <home directory ID> is the ID that was assigned to the uploaded " +
    "directory. (You can see this when you upload or re-upload your " +
    "directory.)"
  }</p>
  <p>{
    "For instance, if someone wants to import your new app2.jsx " +
    "component, and your home directory ID is, say, \"123ab\", " +
    "they could import it via the following statement."
  }</p>
  <p>
    <code className="jsx">
      {'import * as App from "/1/123ab/app2.jsx";'}
    </code>
  </p>



  <h3>{"This framework uses its own JS interpreter"}</h3>
  <p>{
    "It is important to note, while using this framework, that the JS " +
    "interpreter does not behave exactly like you are (perhaps) used to. " +
    "This is because this framework actually employs its own JS " +
    "interpreter in order to be able to sandbox the user-uploaded source " +
    "code, and execute it in a way that prevents users from hacking each " +
    "other."
  }</p>
  <p>{
    "So whenever a line of your uploaded source code is executed, the " +
    "native JS interpreter of your browser is actually running another " +
    "interpreter, which then runs your code."
  }</p>
  <p>{
    "The implications of this sandboxing is first of all that you " +
    "do not have access to all the same functions as in the " +
    "native JS interpreter, nor to all the same built-in object methods " +
    "and properties."
  }</p>
  <p>{
    "In fact, all the regular object prototypes of this modified version " +
    "of JS, " +
    "such as for strings, numbers, arrays, and plain objects, " +
    "contain no methods at all. And the only built-in properties are the " +
    "'length' property for strings and arrays, and also the integer " +
    "indices that can by used to access either a specific character " +
    "of a string or a specific entry of an array."
  }</p>
  <p>{
    "So to give an example, if you want to map an array to another array, " +
    "you would normally write something like the following when using " +
    "regular JS."
  }</p>
  <p>
    <code className="jsx">{[
      'let numbers = [1, 2, 3, 4];\n',
      'let squares = numbers.map(num => num * num); // Wrong!\n',
    ]}</code>
  </p>
  <p>
    But this is wrong in this framework, as the
    <ELink key="link-map-1"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" >
      map()
    </ELink>
    method is not defined. And instead you need to import an equivalent
    function from one of the so-called 'developer libraries' (as
    opposed to user-made libraries). In particular for the map() method,
    you would write the following instead.
  </p>
  <p>
    <code className="jsx">{[
      '/* At the top of the module */\n',
      'import {map} from \'array\';\n',
      '\n',
      '/* Anywhere inside the module */\n',
      'let numbers = [1, 2, 3, 4];\n',
      'let squares = map(numbers, num => num * num);\n',
    ]}</code>
  </p>



  <h3>{"Developer functions"}</h3>
  <p>{
    "The example above shows an example of importing a function from a " +
    "so-called developer library, which are always referenced using bare " +
    "module names, i.e. names that does not start with \"/\" or \"./\", " +
    "etc."
  }</p>
  <p>{([
    "In a future version of this tutorial, we will link to a " +
    "documentation page here, where one can see all the available " +
    "developer libraries and their functions. But in the meantime, you can " +
    "first of all go to ",
    <ELink key="link-index-js"
      href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/src/index.js" >
      {"github.com/mjdamgaard/UP-Web-Project/blob/main/src/index.js"}
    </ELink>,
    " to see a list of all the developer libraries that available on the " +
    "client side. (The first cluster of import statement starting around " +
    "Ln. 15 shows their source code location, and the next statement " +
    "cluster shows their bare module names.) " +
    "And at ",
    <ELink key="link-server-js"
      href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/src/server/ajax_server.js" >
      {"github.com/mjdamgaard/UP-Web-Project/blob/main/src/server/ajax_server.js"}
    </ELink>,
    " you can similarly see the developer libraries that are available on " +
    "the server side. " +
    "And as you can see, all the developer libraries are located in the ",
    <ELink key="link-dev-lib"
      href="https://github.com/mjdamgaard/UP-Web-Project/tree/main/src/dev_lib" >
      {"src/dev_lib"}
    </ELink>,
    " folder, so you can also browse this folder to see what is available."
  ])}</p>
  <p>{
    "Luckily, however, it is often not very hard to guess how to import " +
    "a given developer function that you need, especially when it comes to " +
    "all those prototype methods that are missing when compared to regular " +
    "JS."
  }</p>
  <p>{([
    "All the most common JS prototypes have their own developer library " +
    "(dev lib) of " +
    "the same name (only with lower-case letters): The ",
    <ELink key="link-number"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" >
      {"Number"}
    </ELink>,
    " prototype has a corresponding 'number' dev lib, the ",
    <ELink key="link-string"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String" >
      {"String"}
    </ELink>,
    " prototype has a 'string' dev lib, the ",
    <ELink key="link-array"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array" >
      {"Array"}
    </ELink>,
    " prototype, as we saw above, has an 'array' dev lib, and the ",
    <ELink key="link-object"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" >
      {"Object"}
    </ELink>,
    " prototype has an 'object' dev lib."
  ])}</p>
  <p>{
    "In these libraries, you will find, not necessarily all, but most of " +
    "the functions that you are looking for, and generally exported with " +
    "the " +
    "same exact name as the corresponding method that you are looking for. " +
    "They also generally have the same API, except that all the " +
    "arguments are moved one place to the right in order to " +
    "make room " +
    "for the object/value in question, which has to be passed as the " +
    "first argument."
  }</p>
  <p>{
    "A notable exception is the toString() method, which is only exported " +
    "from the 'string' dev lib."
  }</p>
  <p>{([
    "Static methods such as ",
    <ELink key="link-entries"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries" >
      {"Object.entries()"}
    </ELink>,
    " and ",
    <ELink key="link-isNaN"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN" >
      {"Number.isNaN()"}
    </ELink>,
    " also have corresponding developer functions for the most part. " +
    "These functions just does not need a special first argument, which " +
    "means that the API is often exactly the same."
  ])}</p>
  <p>{
    "As an example, here is how one would import and use the entries() " +
    "function:"
  }</p>
  <p>
    <code className="jsx">{[
      '/* At the top of the module */\n',
      'import {entries} from \'object\';\n',
      '\n',
      '/* Anywhere inside the module */\n',
      'let obj = {a: "foo", b: "bar"};\n',
      'let entriesArr = entries(obj);\n',
      'console.log(entriesArr); // Prints: [["a", "foo"], ["b", "bar"]].',
    ]}</code>
  </p>



  <h3>{"Global functions"}</h3>
  <p>{([
    "As the keen-eyed reader might have spotted, we did not import the " +
    "console.log() function here in the previous example before using it. " +
    "And that is because " +
    "this framework still does has a few global functions that are " +
    "available at all times. (Some of " +
    "these are implemented syntactically, similarly to how the ",
    <ELink key="link-import-1"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import" >
      {"import()"}
    </ELink>,
    " function is implemented syntactically in regular JS, and some " +
    "are declared in the global scope.)"
  ])}</p>
  <p>{([
    "These global functions include the following ones, among others."
  ])}</p>
  <p>
    <code className="jsx">{[
      'console.log(myValue);\n',
      'console.error(myValue);\n',
      'console.trace();\n',
      '\n',
      'new Promise(resolve => resolve(myValue));\n',
      'Promise.all(myPromiseArray);\n',
      '\n',
      'Symbol(myStringValue);\n',
      '\n',
      'import(myRelativeOrAbsolutePath);\n',
      'abs(myRelativeOrAbsolutePath);',
    ]}</code>
  </p>
  <p>{([
    "Almost all of these functions/constructors are known " +
    "from regular JS, except the abs() function at the end of this list, " +
    "which is a syntactically implemented function that takes a path as " +
    "argument, potentially a relative one (from the current module), and " +
    "returns the absolute version of that path."
  ])}</p>



  <h3>{"Developer components"}</h3>
  <p>{
    "There is also another kind of developer libraries, which each " +
    "implement a single JSX component. We call these 'developer " +
    "components.'"
  }</p>
  <p>{
    "These " +
    "are often implementations of particular HTML elements, such as the " +
    "<input> element, the <textarea> element, or the <a> element. " +
    "These developer components are generally given upper-camel-case " +
    "module names, also followed by \".jsx\" at the end. " +
    "For example, if you want to import the <textarea> developer component," +
    " you can do it with the following import statement."
  }</p>
  <p>
    <code className="jsx">{[
      'import * as TextArea from \'TextArea\';',
    ]}</code>
  </p>
  <p>{
    "And then you can use the this TextArea component exactly in the " +
    "same way as the user-programmed components." 
  }</p>
  <p>{
    "The TextArea component even comes with some built-in methods, such " +
    "\"getValue\" and \"setValue\", which can be called by the parent " +
    "component instance via the this.call() function, exactly like one " +
    "would call a method of a user-programmed component. " +
    "Other methods include a \"focus\" and a \"blur\" method, used to grab " +
    "or release the focus of the document."
  }</p>
  <p>{
    "The developer components can also be given props in the same way as " +
    "for the user-programmed components. For instance, if you pass a " +
    "string as " +
    "the 'placeholder' prop to the TextArea component, it will get that " +
    "string as its placeholder text (shown before the user starts typing)." 
  }</p>
  <p>{
    "The <input> element also has, not just one, but several developer " +
    "components that each implement a different type. Here are some " +
    "examples of such developer components, and how to import them:" 
  }</p>
  <p>
    <code className="jsx">{[
      'import * as InputCheckbox from \'InputCheckbox\';\n',
      'import * as InputNumber from \'InputNumber\';\n',
      'import * as InputRadio from \'InputRadio\';\n',
      'import * as InputRange from \'InputRange\';\n',
      'import * as InputText from \'InputText\';',
    ]}</code>
  </p>
  <p>{
    "As you might have guessed if you are already familiar with the " +
    "<input> element, " +
    "these are all named after the 'type' attribute that they " +
    "implement. For instance, the InputText component implements an " +
    "<input type=\"text\"> element in particular. And InputCheckbox " +
    "implement an <input type=\"checkbox\"> element, etc." 
  }</p>
  <p>{
    "The props that these components depend on also varies depending on " +
    "the type. " +
    "For instance, InputText might receive a 'placeholder' or a " +
    "'children' prop, whereas InputCheckbox might instead receive a " +
    "'checked' prop." 
  }</p>
  <p>{
    "And as the last developer components that we will introduce here, we " +
    "also have two that each implements a different variant of the <a> " +
    "element:" 
  }</p>
  <p>
    <code className="jsx">{[
      'import * as ILink from \'ILink\';\n',
      'import * as ELink from \'ELink\';',
    ]}</code>
  </p>
  <p>{
    "The first one of these, the 'ILink' component, is strictly meant " +
    "for internal links, i.e. to pages " +
    "of the same website as the current one, whereas ELink is meant for " +
    "general links, including external ones. " +
    "One useful feature of the ILink component is " +
    "that it does not cause the whole page to reload when clicked, but " +
    "instead simply updates the 'url' prop of the outer app " +
    "component, causing it to rerender."
  }</p>
  <p>{
    "The reason why we need developer components for some HTML elements, " +
    "by the way, " +
    "is first of all due to security concerns. For " +
    "instance, if the users were given complete control over the 'href' " +
    "attribute of the <a> element, they could lead other users to " +
    "malicious websites. But by using the ELink component instead, we can " +
    "simply make this component filter the URLs for " +
    "the href prop, and only redirect the user if the URL is recognized " +
    "as a safe website to visit."
  }</p>
  <p>{
    "Another good example is the <input> element, where if users were " +
    "given complete control over the 'type' attribute, the could set this " +
    "attribute to \"password\", and thereby possibly be able to trick " +
    "the browser of another user to insert the user's password. And after " +
    "this, they might then be able to upload it to a part of the database " +
    "that they have access to, thus stealing the password. Therefore we " +
    "need to have limits on what attributes the users can set for given " +
    "elements."
  }</p>








  <h3>{"Additional details about the components"}</h3>
  <h4>{"The 'ref' prop and mutable props/states"}</h4>
  <p>{
    "There is one more prop with a special implementation for the JSX " +
    "components, apart from the 'key' and the 'children' props, " +
    "and that is the 'ref' prop."
  }</p>
  <p>{
    "The 'ref' prop is first of all constant, meaning that if the parent " +
    "instance ever tries to change it, nothing will happen. " +
    "And the 'ref' prop will thus always be skipped whenever " +
    "the instance checks to see if a rerender is necessary."
  }</p>
  <p>
    This is opposed to the other props, which will in fact generally be
    <i>deep-compared</i> to their former values whenever the instance
    checks to see if it should rerender. And only if this deep comparison
    succeeds will the instance skip the rerender.
  </p>
  <p>{
    "Additionally, all mutable objects that are part of, or referenced " +
    "by, the props, will also not be compared when checking if the " +
    "instance needs to rerender. But unlike the 'refs' prop, these can " +
    "still be updated by the parent."
  }</p>
  <p>{
    "An instance also deep-compares its current state to its former one " +
    "when checking if a rerender is necessary. And for this check, " +
    "state.ref is " +
    "also ignored, as well as the contents of any mutable object within " +
    "the state."
  }</p>
  <p>{
    "So if you ever mutate a mutable part of the state manually, or " +
    "a mutable part of the props, you will need to force a rerender " +
    "manually. This can most easily be achieved by calling " +
    "this.rerender(), which is a function used for this exact purpose."
  }</p>

  <h4>{"Using the 'function' keyword rather than arrow functions"}</h4>
  <p>{
    "If you are well familiar with JS, it will probably come as no " +
    "surprise that you should never define a component's functions, such " +
    "as render() or initialize(), using arrow functions. This is " +
    "because " +
    "one of the main attributes of arrow functions is that they are " +
    "transparent to the 'this' keyword. However, functions like render() " +
    "and initialize() need to have 'this' bound to an object that " +
    "represents the live component instance in order to work as intended."
  }</p>
  <p>{
    "Therefore you should always use the 'function' keyword when defining " +
    "these functions. And the same is true for all the actions of the " +
    "component."
  }</p>
  <h4>{"Components can only render single HTML elements"}</h4>
  <p>{
    "Lastly, it is worth noting that the returned JSX elements of the " +
    "render() functions should generally consist of a single HTML element. " +
    "It is, however, still possibly to let render() return e.g. a string, " +
    "or a JSX " +
    "fragment, or an array. But this will then be automatically wrapped " +
    "in either a <span> element, in case of a returned string, or in a " +
    "<div> element in the case of a returned JSX fragment or array."
  }</p>



  <h3>{"Final remarks"}</h3>
  <p>{
    "These were all of the most pressing points that you ought to " +
    "know before you start developing your first UP apps."
  }</p>
  <p>{
    "There are also several other points that are worth mentioning at " +
    "some point, but these can wait to a later tutorial."
  }</p>
  <p>{
    "You should now have what you need to start building your first " +
    "client-side UP apps. Good luck!"
  }</p>
  {/* <p>{([
    "And as was said in ",
    <ILink key="link-tut-1" href="~/getting-started">
      {"Tutorial 1"}
    </ILink>,
    ", if you run into any problems, or have any questions at all, please " +
    "feel free to contact up-web.org, e.g. by writing an " +
    "e-mail to mads@up-web.org. We are happy to help you."
  ])}</p> */}



    {/* Trigger() is better than callback props. *Well, this should be 
      * explained after (or as part of) the SM tutorial instead.. */}
    {/* Future compiler. *Hm, maybe I will skip this one.. */}
    {/* Extended syntax for relative routes. *Yeah, maybe I should add
      * another miscellaneous tutorial as a later one.. */}
    {/* Maybe also a note about the extended relative urls */}
  
</div>;
