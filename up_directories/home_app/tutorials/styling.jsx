
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as TextDisplay from "../misc/TextDisplay.jsx";
import * as Result7_1 from "./hello_world/results/result_7_1.jsx";
import * as Result7_2 from "./hello_world/results/result_7_2.jsx";


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Tutorial 3: A quick introduction on how to style components"}</h1>
  <section>
    <h2>{"Defining which style sheets to use for your components"}</h2>
    <p>{
      "The easiest way to style a given component is to export an array " +
      "with the name of 'styleSheets' from the " +
      "root component of your whatever app or webpage you are working on. " +
      "This 'styleSheets' array should then contain the paths to all the " +
      "style sheets that you wish to use."
    }</p>
    <p>{[
      "For instance, if you want to style the \"Hello, World!\" component " +
      "from ",
      <ILink key="link-tut-2" href="~/jsx-components" >
        {"the previous tutorial"}
      </ILink>,
      " you can comment out the previous return and comment in Ln. 93-96 of " +
      "main.jsx, such that it returns the following JSX element:"
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
      "And also comment in the 'styleSheets' export at the end of the " +
      "document, which reads:"
    }</p>
    <p>
      <code className="jsx">{[
        'export const styleSheets = [\n',
        '  "./main.css",\n',
        '];\n',
      ]}</code>
    </p>
    <p>{[
      "(Also make sure that the import of ExampleComponent7 is in-commented " +
      "as well at the top of the document.) Then if you re-upload the " +
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
      "the <h2> header from the child component are now colored red. And " +
      "if we then take a look in main.css, which reads:"
    }</p>
    <p>
      <code className="css">{[
        'h1, h2 {\n',
        '  color: red;\n',
        '}\n',
      ]}</code>
    </p>
    <p>{
      "we indeed see that this style sheet colors all <h1> and <h2> elements " +
      "red."
    }</p>
    <p>{[
      "So with this in mind, you are now free to style your app/webpage " +
      "however you want! And if you are new to CSS, which is the language " +
      "that these style sheets are written in, go check out ",
    ]}</p>

  </section>

</div>;
