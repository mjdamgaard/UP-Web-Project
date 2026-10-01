
import * as ILink from 'ILink';
import * as ELink from 'ELink';
import * as InputText from 'InputText';


export function render() {
  return getPage(GreetingExample, LinkExample);
}



const getPage = (
  GreetingExample, LinkExample,
) => <div className="page text-page">
  <h2>Tips and useful things to know</h2>

  <h3>Introduction</h3>
  <p>
    The sandbox that makes it safe to upload and share your apps and prototypes
    immediately naturally also puts some restrictions on what functions can be
    accessed by the user, and on what HTML can be generated, without requiring
    special permissions.
  </p>
  <p>
    In this tutorial, we will go over some of the quirks of the framework, and
    give some useful tips for using it.
  </p>

  <h3>Debugging</h3>
  <p>
    In regular JavaScript (JS), you can use a 'debugger;' statement to halt and
    investigate the code at a certain breakpoint. And while this framework
    technically also implement a 'debugger;' statement, it will halt inside
    native code of the interpreter of the sandbox rather than in your own code,
    which makes it of little use when debugging.   
  </p>
  <p>
    To compensate for this, the global console.trace() function is
    altered to be much more verbose than its regular counterpart, giving you
    a lot of information about the stack, including the argument values of each
    function call. Thus, by using a combination of console.log() and
    console.trace(), you can often find the bug that you are looking for in a
    reasonable time, at least once you get used to the output format.
  </p>
  <p>
    Furthermore, all uncaught errors will also automatically get the
    same trace information appended to them. This makes the error messages of
    this framework very verbose, but it means that one is often able to find
    the cause of an error just be investigating the immediate error message.
  </p>
  <p>
    So when you open your web console, do not panic whenever
    you see a large wall of red text. Just click within the console and hit
    your 'Home' key to go to the top of the console. And there you can
    immediately
    read the original error message, followed by a code snippet pointing to
    where the error occurred, which is again followed by list of information
    about each function calls on the stack, and finally a list of defined
    variables in the environment where the error occurred.
  </p>


  <h3>Restricted HTML elements</h3>
  <p>
    The sandbox also needs to make sure that the users cannot generate any HTML
    they want, at least not without requiring special permissions first.
    Otherwise, a malicious user might for instance be able to trick the browser
    into autocompleting a password field of a form for another user, and then
    upload that password to a part of the database that the malicious user
    controls. Or a malicious user might simply link to a malicious website
    or a malicious file, etc.
  </p>
  <p>
    Therefore, certain HTML element types are not directly available in the
    standard JSX syntax, but instead need to be imported as special components. 
  </p>
  <p>
    A good example of this is the {"<img>"} tag, which you cannot use directly,
    meaning that the following piece of code would throw an error.
  </p>
  <p>
    <code className="jsx">{[
      'export function render() {\n',
      '  return <img src="www.example.com/image.jpg" />; // Error!\n',
      '}',
    ]}</code>
  </p>
  <p>
    Instead you import a special 'Img' component from a built-in library of the
    same name, like so:
  </p>
  <p>
    <code className="jsx">{[
      'import * as Img from \'Img\';\n',
      '\n',
      'export function render() {\n',
      '  return <Img src="www.example.com/image.jpg" />;\n',
      '}',
    ]}</code>
  </p>
  <p>
    This 'Img' component then makes sure that the given image source URL is
    recognized and safe before setting the 'src' attribute.
  </p>
  <p>
    The same goes for the {"<a>"} tag, except here the built-in link
    component is split up into two, namely an 'ELink' and an 'ILink' component,
    where 'ELink' is used for external links and ILink is used for internal
    links, i.e. within the same website. 
  </p>
  <p>
    As an example, here is a component that contains both a link to an external
    website, followed by a link to another page within the same website:
  </p>
  <p>
    <code className="jsx">{[
      'import * as ELink from \'ELink\';\n',
      'import * as ILink from \'ILink\';\n',
      '\n',
      'export function render() {\n',
      '  return <div>\n',
      '    <ELink key="link-1" href="https://www.example.com" >\n',
      '      I am an external link\n',
      '    </ELink>,\n',
      '    and\n',
      '    <ILink key="link-2" href="../other-page" >\n',
      '      I am an internal link to another page\n',
      '    </ILink>.\n',
      '  </div>;\n',
      '}',
    ]}</code>
  </p>
  <p>
    <div className="text-frame">
      <LinkExample />
    </div>
  </p>
  <p>
    Another good example is the {'<input>'} tag, which is also split up into
    several versions, depending on the "type" attribute. For instance,
    {'<input type="text">'} is implemented by a built-in 'InputText' component,
    while {'<input type="checkbox">'} is implemented by an 'InputCheckbox'
    component, etc.
  </p>
  <p>
    These built-in components can also have their own methods, which can be
    called in the same way as any other component, as was shown in the
    <ILink key="link-tut-2-1" href="../jsx-components">
      previous tutorial
    </ILink>.
    For instance, when you want to get the text input of a 'InputText'
    component, you can call a built-in "getValue" method. The following example
    thus shows a component that lets the user type in their name in a text
    field, and then greets the user by that name.
  </p>
  <p>
    <code className="jsx">{[
      'import * as InputText from \'InputText\';\n',
      '\n',
      'export function render() {\n',
      '  let {name} = this.state;\n',
      '  return <div>\n',
      '    Write your name:\n',
      '    <div>\n',
      '      <InputText key="t" placeholder="your name" onInput={() => {\n',
      '        let val = this.call("t", "getValue");\n',
      '        this.setState(state => ({...state, name: val}));\n',
      '      }}/>\n',
      '    </div>\n',
      '    <div>\n',
      '      Greetings, {name ? name + "!" : "..."}\n',
      '    </div>\n',
      '  </div>\n',
      '}',
    ]}</code>
  </p>
  <p>
    <div className="text-frame">
      <GreetingExample />
    </div>
  </p>
  <p>
    A comprehensive documentation on the built-in components and how to use
    them is not available yet, but will be in the future. And in the meantime,
    it might help to go to
    <ELink key="link-dev-components"
      href="https://github.com/mjdamgaard/UP-Web-Project/tree/main/src/dev_lib/jsx/dev_components" >
      {"github.com/mjdamgaard/UP-Web-Project/blob/main/src/dev_lib/jsx/dev_components"}
    </ELink>
    to get an idea of which built-in components are available, and what props
    and methods they each have.
  </p>



  <h3>Built-in functions</h3>
  <p>
    There are also restrictions on what global functions and objects can be
    accessed when compared to regular JS (or Node.js). Some functions have
    been deliberately left out for security reasons, and other functions might
    just not have been added to the sandbox environment yet.
  </p>
  <p>
    However, a lot of the most common methods are available, such as the
    <ELink key="link-array-map"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" >
      Array.prototype.map()
    </ELink>,
    the
    <ELink key="link-string-split"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split" >
      String.prototype.split()
    </ELink>
    method, or the
    <ELink key="link-object-entries"
      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries" >
      Object.entries()
    </ELink>
    method, just to name a few.
  </p>
  <p>
    And in addition to the global functions and built-in methods, there are
    also built-in libraries of functions that can be imported everywhere.
    As an example, the 'hex' library exports a set of functions used to covert
    values of different types into hexadecimal strings and back, which are
    imported like so:
  </p>
  <p>
    <code className="jsx">{[
      'import {arrayToHex, hexToArray} from \'hex\';',
    ]}</code>
  </p>
  <p>
    (We will see more about these particular functions in the
    <ILink key="link-tut-5-1" href="../server-modules">
      next tutorial
    </ILink>.
    )
  </p>
  <p>
    Once again, a comprehensive documentation of the built-in libraries are
    not available yet, unfortunately, but will be in a near future.
  </p>



  <h3>Importing from other home directories</h3>
  <p>
    When you import functions and variables from other modules, you naturally
    cannot import them from other files on your computer outside of the
    uploaded directory, as these files will not be available on the server.
    You can, however, import from other uploaded directories as well.
  </p>
  <p>
    For instance, if you wanted to import your initial "Hello, World!" app
    from the example app of
    <ILink key="link-tut-2-2" href="~/jsx-components">
      previous tutorial
    </ILink>,
    you could use the following import statement,
  </p>
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
    And you can also import from directories uploaded by other users as well,
    as long as you know the given home directory's ID.
  </p>
  <p>
    CAUTION: Before you import from the directories of other users, make sure
    to check that these modules are open-source, or that you meet the license
    requirements to use the code. Otherwise your uploaded directory might get
    removed without further notice.
  </p>



  <h3>Objects are immutable by default</h3>
  <p>
    Since other users are able to import your uploaded modules, you should
    never export any mutable object, nor any object that hold a reference to a
    mutable object, as this would allow other users to mutate said objects and
    potentially break your code. And for that reason, all objects of this
    framework (including arrays) are immutable by default.
  </p>
  <p>
    If you want to use mutable objects, you thus need to use special class
    constructors, such as 'MutableObject()' or 'MutableArray().'
    For instance, the following code will <i>not</i> work in this framework:
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
    However, the following code will:
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
    It is also worth noting, by the way, that even when working with immutable
    objects, one can often easily achieve a similar result by utilizing
    the spread ('...') operator:
  </p>
  <p>
    <code className="jsx">{[
      'let obj = {a: "foo", b: "bar"};\n',
      'obj = {...obj, b: "baz"};',
      '\n',
      'let arr = [0, 1, 2];\n',
      'arr = [...arr1, 3];\n',
    ]}</code>
  </p>
  <p>
    This provides a handy way to avoid using mutable objects when efficiency is
    not a great requirement, and when wanting to avoid the security risk of
    accidentally exporting a reference to such an object.
  </p>
  
  
  <footer className="prev-and-next-link">
    <div className="prev-link">
      <ILink key="link-tut-2-3" href="../jsx-components">
        Previous tutorial
      </ILink>
    </div>
    <div className="next-link">
      <ILink key="link-tut-5-2" href="../server-modules">
        Next tutorial
      </ILink>
    </div>
  </footer>
</div>;








export const GreetingExample = {
  render: function() {
    let {name} = this.state;
    return <div>
      Write your name:
      <div>
        <InputText key="t" placeholder="your name" onInput={() => {
          let val = this.call("t", "getValue");
          this.setState(state => ({...state, name: val}));
        }}/>
      </div>
      <div>
        Greetings, {name ? name + "!" : "..."}
      </div>
    </div>;
  }
};

export const LinkExample = {
  render: function() {
    return <div>
      <ELink key="link-1" href="https://www.example.com" >
        I am an external link
      </ELink>,
      and
      <ILink key="link-2" href="../other-page" >
        I am an internal link to another page
      </ILink>.
    </div>;
  }
};
