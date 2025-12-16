
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
      "So if you for instance want to map an array to another array, instead " +
      "writing something like:"
    }</p>
    <p>
      <code className="jsx">{[
        'let numbers = [1, 2, 3, 4];\n',
        'let squares = numbers.map(num => num * num); // Wrong!\n',
      ]}</code>
    </p>
    <p>{[
      "you instead need to import an equivalent function to the ",
      <ELink key="link-map-1"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" >
        {"map()"}
      </ELink>,
      " method from one of the so-called \"developer libraries\" (as opposed " +
      "to user-made libraries). In particular for the ",
      <ELink key="link-map-2"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" >
        {"map()"}
      </ELink>,
      " method, you would write the following instead:"
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
      "..."
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

  <section>
    <h2>{"..."}</h2>
    <p>{
      "You are also very welcome to send an e-mail to mads@up-web.org if you " +
      "have any questions. And if you run into any bugs that you don't know " +
      "how to solve, please feel free to send an e-mail as well, as I " +
      "might be able to help you."
    }</p>
  </section>

    {/* Trigger() is better than callback props. */}
    {/* No un-computed HTML content yet, and nio async function yet. */}
    {/* Future compiler. */}
  
</div>;
