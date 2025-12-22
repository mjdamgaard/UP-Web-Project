
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
      "code, and execute it in a way that prevents users from hacking the " +
      "contributions of users, and to prevent them from hacking the client's " +
      "browser in general."
    }</p>
    <p>{
      "So whenever a line of your uploaded source code is executed, the " +
      "native JS interpreter of your browser is actually running another " +
      "interpreter, which then runs your code."
    }</p>
    <p>{
      "The implications of this sandboxing is first of all that you as a " +
      "programmer do not have access to all the same functions as in the " +
      "native JS interpreter, as well as the same object prototype methods " +
      "and properties."
    }</p>
    <p>{
      "In fact, all the regular prototypes of this modified version of JS, " +
      "such for strings, numbers, arrays, and regular key-value objects, " +
      "contain no methods at all. And the only built-in properties are the " +
      "'length' property for strings and arrays, and also the integer " +
      "indices that can by used to access respectively a specific character " +
      "of a string or a specific entry of an array."
    }</p>
    <p>{
      "So if you for instance want to map an array to another array, you " +
      "would normally write something like:"
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
      "In a future version of this tutorial, we will link here to a " +
      "documentation index page where one can see all the available " +
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
      " folder, so you can also browse that to see what is available."
    ]}</p>
    <p>{
      "Luckily, however, it is often not very hard to guess how to import " +
      "a given developer function that you need, especially when it comes to " +
      "all those prototype methods that are missing when compared to regular " +
      "JS."
    }</p>
    <p>{[
      "All the most common JS prototypes have their own developer library of " +
      "the same name (only with lower-case letters): The ",
      <ELink key="link-number"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" >
        {"Number"}
      </ELink>,
      " prototype has a corresponding 'number' dev. lib., the ",
      <ELink key="link-string"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String" >
        {"String"}
      </ELink>,
      " prototype has a 'string' dev. lib., the ",
      <ELink key="link-array"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array" >
        {"Array"}
      </ELink>,
      " prototype, as we saw above, has an 'array' dev. lib., and the ",
      <ELink key="link-object"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" >
        {"Object"}
      </ELink>,
      " prototype has an 'object' dev. lib."
    ]}</p>
    <p>{
      "In these libraries, you will find, not necessarily all, but most of " +
      "the functions that you are looking for, generally exported with the " +
      "exact same name as the corresponding method that you are looking for. " +
      "And they also generally have the same API, except that all the " +
      "arguments are moved one place to the right, of course to make room " +
      "for the object/value in question, which now has to be passed as the " +
      "first argument."
    }</p>
    <p>{
      "A notable exception is the toString() method, which is only exported " +
      "from the 'string' dev. lib."
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
        'console.log(obj); // Prints: [["a", "foo"], ["b", "bar"]].\n',
      ]}</code>
    </p>
  </section>

  <section>
    <h2>{"Global functions"}</h2>
    <p>{[
      "As the keen-eyed reader might have spotted, we did import the " +
      "console.log() function above before using it. And that is because " +
      "this framework still has a few number of global functions, some of " +
      "which are implemented syntactically (similarly to how the ",
      <ELink key="link-import-1"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import" >
        {"import()"}
      </ELink>,
      " function is implemented syntactically in regular JS), and some of " +
      "which or declared in the global scope."
    ]}</p>
    <p>{[
      "These global functions for include:"
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
        'abs(myRelativeOrAbsolutePath);\n',
      ]}</code>
    </p>
    <p>{[
      "among others. Almost of of these functions/constructors are known " +
      "from regular JS, except the abs() function at the end of this list, " +
      "which is a syntactically implemented function that simply returns the " +
      "absolute version of the input path."
    ]}</p>
  </section>

  <section>
    <h2>{"Developer components"}</h2>
    <p>{
      "Some of the developer libraries also implement JSX components. These " +
      "are often implementations of particular HTML elements, such as the " +
      "<input> element, the <textarea> element, or the <a> element. " +
      "These developer component are generally given upper camel-case " +
      "module names, also followed by \".jsx\" at the end."
    }</p>
    <p>{
      "For example, if you want to import the <textarea> developer component," +
      " you can do it with the following import statement:"
    }</p>
    <p>
      <code className="jsx">{[
        'import * as TextArea from \'TextArea.jsx\';\n',
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
      "The developer components also be given props in the same way as the " +
      "user-programmed components. For instance, if you pass a string as " +
      "the 'placeholder' prop to the TextArea component, it will get that " +
      "string as its placeholder text (shown before the user starts typing)." 
    }</p>
    <p>{
      "The <input> element also has, not just one, but several developer " +
      "components that implement it. You can see the full list of the " +
      "<input> dev components that is currently implemented here:" 
    }</p>
    <p>
      <code className="jsx">{[
        'import * as InputCheckbox from \'InputCheckbox.jsx\';\n',
        'import * as InputNumber from \'InputNumber.jsx\';\n',
        'import * as InputRadio from \'InputRadio.jsx\';\n',
        'import * as InputRange from \'InputRange.jsx\';\n',
        'import * as InputText from \'InputText.jsx\';\n',
      ]}</code>
    </p>
    <p>{
      "As you might have guessed if you already know about <input> element, " +
      "these are all named after the 'type' attribute value that they " +
      "implement. And the props that these components can receive is " +
      "dependent on this type." 
    }</p>
    <p>{
      "And then we also we also have the <a> element, which is also divided " +
      "into two versions:" 
    }</p>
    <p>
      <code className="jsx">{[
        'import * as ILink from \'ILink.jsx\';\n',
        'import * as ELink from \'ELink.jsx\';\n',
      ]}</code>
    </p>
    <p>{
      "Where ILink is strictly meant for internal links, i.e. to pages " +
      "of the same website as the current one, and where ELink is meant " +
      "for external links. The ILink component also has the added feature " +
      "that is doesn't cause the page to reload when clicked. Instead it " +
      "just updates the 'url' prop of the outer app component, causing it to " +
      "rerender."
    }</p>
    <p>{
      "Now, you might ask: Why do we need these developer components? Why " +
      "do not just insert e.g. the <input> element or the <a> element " +
      "directly in the returned JSX element of a component? " +
      "Well, the reason for this is first of all security concerns. For " +
      "instance, if the users were given complete control over the 'href' " +
      "attribute of the <a> element, they could lead other users to " +
      "malicious websites. But by using the ELink component instead, it is " +
      "a simple matter to just make sure that this dev. component filters " +
      "the href prop, and only redirect the user if the URL is recognized " +
      "as a safe website to visit."
    }</p>
    <p>{
      "Another good example is the <input> element, where if users were " +
      "given complete control over the 'type' attribute, the could set this " +
      "attribute to \"password\", and thereby possibly be able to trick " +
      "the browser of another user to insert the user's password. And after" +
      "this, they might then be able to upload it to a part of the database " +
      "that they have access to, thus stealing the password."
    }</p>
    <p>{
      "And apart from these security reasons, there is also simply the fact " +
      "that this " +
      "makes us able to call methods like \"getValue\" and \"setValue\", " +
      "etc., via the this.call() function, which makes it very easy to " +
      "interact with these kinds of elements."
    }</p>
  </section>

  <section>
    <h2>{"Objects are immutable by default"}</h2>
    <p>{
      "..."
    }</p>
  </section>


  <section>
    <h2>{"..."}</h2>
    <p>{
      "Note that the fact that we need to bind the 'this' keyword is also " +
      "why you should never define the render() function as an arrow " +
      "function, as this will prevent the correct binding of the 'this' " +
      "keyword."
    }</p>
  </section>


    {/* Trigger() is better than callback props. */}
    {/* No un-computed HTML content yet, and nio async function yet. */}
    {/* Future compiler. */}
    {/* ref and mutable props, and the deep comparisons in general . */}
    {/* Extended syntax fro relative routes */}
    {/* Maybe also a note about the extended relative urls */}
    {/* Components need to return a single HTML element, and if they don't
        it just gets wrapped */}
  
</div>;
