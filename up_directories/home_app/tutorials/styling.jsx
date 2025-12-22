
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as Result7_1 from "./hello_world/results/result_7_1.jsx";
import * as Result7_2 from "./hello_world/results/result_7_2.jsx";


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Tutorial 3: A quick introduction on how to style components"}</h1>
  <section>
    <h2>{"Defining the style sheets for the root component"}</h2>
    <p>{
      "The easiest way to style a given component is to export an array " +
      "with the name of 'styleSheets' from the " +
      "root component of whatever app or webpage you are working on. " +
      "This 'styleSheets' array should then contain the paths to all the " +
      "style sheets that you wish to use."
    }</p>
    <p>{[
      "For instance, if you want to style the \"Hello, World!\" component " +
      "from the ",
      <ILink key="link-tut-2" href="~/jsx-components" >
        {"previous tutorial"}
      </ILink>,
      " you can comment out the previous return and comment in Ln. 93-96 of " +
      "app2.jsx, such that it returns the following JSX element:"
    ]}</p>
    <p>
      <code className="jsx">{[
        'return <div>\n',
        '  <h1>{"Hello, World!"}</h1>\n',
        '  <ExampleComponent7 key="c-1" />\n',
        '</div>;\n',
      ]}</code>
    </p>
    <p>{
      "(Also make sure that the import of ExampleComponent7 is in-commented " +
      "as well at the top of the document.) " +
      "Then comment in the 'styleSheets' export at the end of the " +
      "document as well, which reads:"
    }</p>
    <p>
      <code className="jsx">{[
        'export const styleSheets = [\n',
        '  "./app2.css",\n',
        '];\n',
      ]}</code>
    </p>
    <p>{
      "The returned JSX of the render() function of ExampleComponent7 is " +
      "simply:"
    }</p>
    <p>
      <code className="jsx">{[
        'return <h2>{"I am a child instance"}</h2>;\n',
      ]}</code>
    </p>
    <p>{
      "And the contents of the app2.css style sheet is:"
    }</p>
    <p>
      <code className="css">{[
        'h1, h2 {\n',
        '  color: red;\n',
        '}\n',
      ]}</code>
    </p>
    <p>{[
      "By the way, if you are new to using style sheets, you can browse this ",
      <ELink key="link-css-1" href="https://www.w3schools.com/css/" >
        {"CSS Tutorial"}
      </ELink>,
      " to get an introduction to the wonderful world of how CSS can by used " +
      "to style HTML elements.",
    ]}</p>
    <p>{[
      "Then after having commented in these lines, if you now re-upload the " +
      "component (assuming you have followed the steps of ",
      <ILink key="link-tut-1" href="~/getting-started" >
        {"Tutorial 1"}
      </ILink>,
      " as well), you will see the following:"
    ]}</p>
    <p>{
      <div className="text-display">
        <Result7_1 key="_ex7-1" />
      </div>
    }</p>
    <p>{
      "Here you see that both the <h1> header from the root component and " +
      "the <h2> header from the child component are now colored red. This " +
      "shows that the app2.css style sheet has styled both the parent and " +
      "the child instance."
    }</p>
  </section>

  <section>
    <h2>{"Allowing descendant components to define their own styles"}</h2>
    <p>{
      "In the previous example, the 'styleSheets' export was used to style " +
      "the whole app/webpage. But you can also allow nested components to " +
      "define their own styles (if you want to make your source code more " +
      "modular)."
    }</p>
    <p>{
      "This is easiest done in the same way as we just saw for the root " +
      "component of your app, namely by exporting another 'styleSheets' " +
      "array from the nested component in question."
    }</p>
    <p>{
      "In fact, if you go to ExampleComponent7.jsx, so see that its full " +
      "contents are:"
    }</p>
    <p>
      <code className="jsx">{[
        'export function render() {\n',
        '  return <h2>{"I am a child instance"}</h2>;\n',
        '}\n',
        '\n',
        'export const styleSheets = [\n',
        '  "./ExampleComponent7.css",\n',
        '];\n',
      ]}</code>
    </p>
    <p>{
      "And the contents of the ExampleComponent7.css style sheet are:" 
    }</p>
    <p>
      <code className="css">{[
        'h2 {\n',
        '  color: blue;\n',
        '}\n',
      ]}</code>
    </p>
    <p>{
      "So if ExampleComponent7 were to style itself, we should see a blue " +
      "<h2> header in the previous example instead of a red one." 
    }</p>
    <p>{
      "The reason why we still see a red one, however, is that the parent " +
      "component needs to explicitly specify when a child component should " +
      "style itself. And this is done via the (mandatory) 'key' props." 
    }</p>
    <p>{
      "If a component instance element is given a key prop that starts with " +
      "an underscore, then it styles itself, and otherwise it just " +
      "inherits the same style sheets as its parent uses." 
    }</p>
    <p>{
      "So to see an example of a child component instance styles itself, " +
      "simply prepend an underscore to the key prop in the returned JSX " +
      "element in app2.jsx from the previous example, such it becomes " +
      "\"_c-1\" instead of \"c-1\":"
    }</p>
    <p>
      <code className="jsx">{[
        'return <div>\n',
        '  <h1>{"Hello, World!"}</h1>\n',
        '  <ExampleComponent7 key="_c-1" />\n',
        '</div>;\n',
      ]}</code>
    </p>
    <p>{
      "And then when you re-upload your component, you will indeed see that " +
      "the child instance's <h2> header has indeed turned blue:" 
    }</p>
    <p>{
      <div className="text-display">
        <Result7_2 key="_ex7-2" />
      </div>
    }</p>
  </section>


  <section>
    <h2>{"A more advanced underlying styling system"}</h2>
    <p>{
      "The styling system also has some more advanced features. But these " +
      "are not necessary to know about for beginners, so let us save these " +
      "for another tutorial." 
    }</p>
    <p>{
      "The advanced system only becomes relevant once you get to a point " +
      "where you have multiple components from multiple different sources, " +
      "and you want to have greater control over how you can overwrite and " +
      "adjust the styles of these components, without needing to change " +
      "anything in their JSX source code." 
    }</p>
    <p>{
      "Or if you need to be able to easily change or adjust some overall " +
      "styling themes of your app, without needing to change the CSS classes " +
      "of each individual element that uses this theme, then the more " +
      "advanced system will also start to become relevant. (In other words, " +
      "if your app is complicated enough that you feel like you need " +
      "something like Sass or Less to manage styling themes.)" 
    }</p>
    <p>{
      "But for now, the reduced system that was explained above in this " +
      "tutorial should suffice, at least for your first couple of apps." 
    }</p>
  </section>
</div>;
