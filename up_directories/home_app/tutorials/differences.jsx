
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Some useful things to know while using this framework"}</h1>
  <section>
    <h2>{"This framework uses its own JS interpreter"}</h2>
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
      "regular JS:"
    }</p>
    <p>
      <code className="jsx">{[
        'let numbers = [1, 2, 3, 4];\n',
        'let squares = numbers.map(num => num * num); // Wrong!\n',
      ]}</code>
    </p>
    <p>{[
      "But this is wrong in this framework, as the ",
      <ELink key="link-map-1"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" >
        {"map()"}
      </ELink>,
      " method is not defined. And instead you need to import an equivalent " +
      "function to from one of the so-called 'developer libraries' (as " +
      "opposed to user-made libraries). In particular for the map() method, " +
      "you would write the following instead:"
    ]}</p>
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
  </section>

  <section>
    <h2>{"Developer functions"}</h2>
    <p>{
      "The example above shows an example of importing a function from a " +
      "so-called developer library, which are always referenced using bare " +
      "module names, i.e. names that does not start with \"/\" or \"./\", " +
      "etc."
    }</p>
    <p>{[
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
    ]}</p>
    <p>{
      "Luckily, however, it is often not very hard to guess how to import " +
      "a given developer function that you need, especially when it comes to " +
      "all those prototype methods that are missing when compared to regular " +
      "JS."
    }</p>
    <p>{[
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
    ]}</p>
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
    <p>{[
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
    ]}</p>
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
        'let entries = entries(obj);\n',
        'console.log(entries); // Prints: [["a", "foo"], ["b", "bar"]].',
      ]}</code>
    </p>
  </section>

  <section>
    <h2>{"Global functions"}</h2>
    <p>{[
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
    ]}</p>
    <p>{[
      "These global functions include the following:"
    ]}</p>
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
    <p>{[
      "among others. Almost all of these functions/constructors are known " +
      "from regular JS, except the abs() function at the end of this list, " +
      "which is a syntactically implemented function that simply returns the " +
      "absolute version of the input path."
    ]}</p>
  </section>

  <section>
    <h2>{"Developer components"}</h2>
    <p>{
      "There is also another kind of developer libraries, which each " +
      "implement a single JSX component. We call these 'developer " +
      "components.'"
    }</p>
    <p>{
      "These " +
      "are often implementations of particular HTML elements, such as the " +
      "<input> element, the <textarea> element, or the <a> element. " +
      "These developer components are generally given upper camel-case " +
      "module names, also followed by \".jsx\" at the end. " +
      "For example, if you want to import the <textarea> developer component," +
      " you can do it with the following import statement:"
    }</p>
    <p>
      <code className="jsx">{[
        'import * as TextArea from \'TextArea.jsx\';',
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
        'import * as InputCheckbox from \'InputCheckbox.jsx\';\n',
        'import * as InputNumber from \'InputNumber.jsx\';\n',
        'import * as InputRadio from \'InputRadio.jsx\';\n',
        'import * as InputRange from \'InputRange.jsx\';\n',
        'import * as InputText from \'InputText.jsx\';',
      ]}</code>
    </p>
    <p>{
      "As you might have guessed if you are already familiar with the " +
      "<input> element, " +
      "these are all named after the 'type' attribute that they " +
      "implement. For instance, the InputText component implements a " +
      "<input type=\"text\"> element in particular. And InputCheckbox " +
      "implement an <input type=\"checkbox\"> element, etc." 
    }</p>
    <p>{
      "The props that these components depend on also varies from type, " +
      "such that InputText for instance might receive a 'placeholder' or a " +
      "'children' prop, whereas InputCheckbox might instead receive a " +
      "'checked' prop." 
    }</p>
    <p>{
      "And as the last developer components that we will mention here, we " +
      "also have two that each implements a different variant of the <a> " +
      "element:" 
    }</p>
    <p>
      <code className="jsx">{[
        'import * as ILink from \'ILink.jsx\';\n',
        'import * as ELink from \'ELink.jsx\';',
      ]}</code>
    </p>
    <p>{
      "Here, the first one of these, ILink, is strictly meant for internal " +
      "links, i.e. to pages " +
      "of the same website as the current one, whereas ELink is meant for " +
      "general links, including external ones. " +
      "The ILink component then has the added feature " +
      "that is does not cause the whole page to reload when clicked. " +
      "Instead it simply updates the 'url' prop of the outer app " +
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
  </section>

  <section>
    <h2>{"Objects are immutable by default"}</h2>
    <p>{
      "All objects are immutable by default in this version of JS, " +
      "including arrays. This is also due to the fact that in this UP " +
      "system, you generally cannot count on all other users, as some might " +
      "in principle have malicious, or just adversarial, " +
      "intentions. And this is why you must never export a mutable " +
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
      "change one of its properties, the following code would throw an error:"
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
    <p>{
      "(By the way, whereas React recommends using the 'const' keyword as " +
      "much as possible, this framework recommends using the 'let' keyword " +
      "as much as possible, except at the module scope, and in particular " +
      "for exports.)"
    }</p>
    <p>{
      "However, if you do want to use a mutable object or array, you can " +
      "just use either the MutableObject() or the MutableArray() " +
      "constructor, respectively. For example, the following code will " +
      "also succeed:"
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
  </section>

  <section>
    <h2>{"Debugging"}</h2>
    <p>{
      "While the 'debugger;' statement is technically included as part of " +
      "this version of JS, it will make the program halt inside the native " +
      "source code, at least in its current implementation, which makes it " +
      "practically useless."
    }</p>
    <p>{
      "So in order for users to still be able to debug their code fairly " +
      "efficiently, we have done the following two things."
    }</p>
    <p>{
      "First of all, we have made the console.trace() function much more " +
      "verbose, not least by making it include information about the values " +
      "of the arguments of each function call in the stack, and also by " +
      "making it include a full readout of the variables present where the " +
      "function is called from."
    }</p>
    <p>{
      "And second of all, we have let uncaught exceptions be much more " +
      "verbose as well, namely by letting them automatically include the " +
      "same information as from a console.trace() call."
    }</p>
    <p>{
      "So whenever you develop a new app component, or a server module, " +
      "always make sure to have the console open in your browser, first of " +
      "all. And whenever a new error is encountered, do not be frightened by " +
      "the wall of red text that is printed to your console. " +
      "Just click " +
      "anywhere inside the console and press the 'Home' key on your " +
      "keyboard. This will bring you straight to top, showing you the first " +
      "error (which is typically the one you want to debug first)."
    }</p>
    <p>{
      "There you will first of all see the error message, followed the path " +
      "to the file where the error originated, along with the line and " +
      "column number. " +
      "And immediately after that, you will see a medium-sized code " +
      "snippet printed out from where the error occurred. This snippet will " +
      "furthermore include some inserted arrows right around " +
      "the location of the error."
    }</p>
    <p>{
      "Next you will see the aforementioned trace printed out, where you can " +
      "see a sizable portion of the call stack, and where each function is " +
      "printed out along with both the file path and location of the " +
      "function call, as well as the argument values, not least."
    }</p>
    <p>{
      "And in the special case when a function is the " +
      "render() function of a component, instead of just seeing a printout " +
      "of the " +
      "render() function itself, you will see the JSX element of the " +
      "component instance, along with the file path and location of it."
    }</p>
    <p>{
      "Finally, you will see a readout of all the variables that " +
      "was present in the scope where the error occurred."
    }</p>
    <p>{
      "That is, unless the error was thrown server-side, in which case all " +
      "this information will be effectively doubled, as you will then " +
      "first see " +
      "the trace for the server-side error, followed by " +
      "the client-side trace, starting from the function that sent the " +
      "given request to the server."
    }</p>
    <p>{
      "Hopefully this will be enough for you to quickly be able locate the " +
      "source of a given bug most of the time! " +
      "And if you ever need additional information beyond this in order " +
      "to locate or investigate a given bug, you can insert temporary " +
      "console.log() and console.trace() calls into your code."
    }</p>
    <p>{
      "And in case you want to see even more of the call " +
      "stack, console.trace() also accepts an integer argument to specify " +
      "the maximal length of the trace."
    }</p>
  </section>


  <section>
    <h2>{"Additional details about the components"}</h2>
    <h3>{"The 'ref' prop and mutable props and states"}</h3>
    <p>{
      "Some additional things that are worth noting for the JSX components " +
      "are first of all that apart from the 'key' and the 'children' props, " +
      "there is also a third prop treated in a special way, which is the " +
      "'ref' prop."
    }</p>
    <p>{
      "The 'ref' prop is only set once when the component instance is " +
      "created, and if the parent instance ever tries to change this prop " +
      "afterwards, nothing will happen. The 'ref' prop will thus never be " +
      "checked when the instance checks if a rerender is necessary."
    }</p>
    <p>{
      "This is opposed to the other props, which will generally be " +
      "deep-compared to their former values whenever you call " +
      "this.setState(). And if the deep comparison succeeds, the instance " +
      "will not rerender."
    }</p>
    <p>{
      "Additionally, all mutable objects that are part of, or referenced " +
      "by, the props, will also not be compared when checking if the " +
      "instance needs to rerender. But unlike the 'refs' prop, these can " +
      "still be updated by the parent."
    }</p>
    <p>{
      "An instance also deep-compares its current state to its former one " +
      "before rerendering after a call to this.setState(). And here " +
      "state.ref is " +
      "also ignored, as well as the contents of any mutable object within " +
      "the state."
    }</p>
    <p>{
      "So if you ever mutate a mutable part of the state manually, or " +
      "a mutable part of the props, and you " +
      "want to force a rerender, you can call this.rerender() to do this."
    }</p>
    <h3>{"Using the 'function' keyword rather than arrow functions"}</h3>
    <p>{
      "If you are well familiar with JS, it will probably come as no " +
      "surprise that you should never define a component's functions such " +
      "as render() or initialize(), etc., using arrow functions. This is " +
      "because " +
      "one if the main attributes of arrow functions is that they are " +
      "transparent to the 'this' keyword. However, functions like render() " +
      "and initialize() need to have 'this' bound to an object that " +
      "represents the live component instance in order to work as intended."
    }</p>
    <p>{
      "Therefore you should always use the 'function' keyword when defining " +
      "these functions. And the same is true for all the functions of the " +
      "'actions' object."
    }</p>
    <h3>{"Components can only render single HTML elements"}</h3>
    <p>{
      "Lastly, it is worth noting that the returned JSX elements of the " +
      "render() functions should generally consist of a single HTML element. " +
      "It is, however, still possibly to let render() return e.g. a string, " +
      "or a JSX " +
      "fragment, or an array. But this will then be automatically wrapped " +
      "in either a <span> element, in case of a returned string, or in a " +
      "<div> element in the case of a returned JSX fragment or array."
    }</p>
  </section>

  <section>
    <h2>{"Final remarks"}</h2>
    <p>{
      "These points were all of the most pressing ones that you ought to " +
      "know before you really start developing your first UP apps."
    }</p>
    <p>{
      "There are also several other points that are worth mentioning at " +
      "some point, but this can wait to a later tutorial."
    }</p>
    <p>{
      "You should now have what you need to start building your first " +
      "client-side UP apps!"
    }</p>
    <p>{[
      "And as was said in ",
      <ILink key="link-tut-1" href="~/getting-started">
        {"Tutorial 1"}
      </ILink>,
      ", if you run into any problems, or have any questions at all, please " +
      "feel free to contact up-web.org, e.g. by writing an " +
      "e-mail to mads@up-web.org. We are happy to help you."
    ]}</p>
  </section>


    {/* Trigger() is better than callback props. *Well, this should be 
      * explained after (or as part of) the SM tutorial instead.. */}
    {/* Future compiler. *Hm, maybe I will skip this one.. */}
    {/* Extended syntax for relative routes. *Yeah, maybe I should add
      * another miscellaneous tutorial as a later one.. */}
    {/* Maybe also a note about the extended relative urls */}
  
</div>;
