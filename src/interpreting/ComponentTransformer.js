
import {cssParser} from "./parsing/CSSParser.js";
import {parseString} from "./ScriptInterpreter.js";


// The "transform" objects used by the ComponentTransformer are of the form:
// transform := {(styleSheet|styleSheets), rules},
// styleSheet := <route string>,
// styleSheets := {(<[a-z][a-z0-9\-]* key>: <route string>,)*},
// rules :=  {(<selector string>: ruleBlock},
// ruleBlock := {styles, classes}, 
// styles := {(<CSS property>: <CSS value string>,)*},
// classes := [(<class>,)*],
// where <class> is ether a [a-z][a-z0-9\-]* string if styleSheet is defined
// rather than style*Sheets*, or a [a-z][a-z0-9\-]*_[a-z][a-z0-9\-]* string if
// styleSheets is defined, where the last part is the [a-z][a-z0-9\-]* key of
// the style sheet that the class references.




export class ComponentTransformer {

  transform(domNode, ownDOMNodes, ) {

  }

}





export const componentTransformer = new ComponentTransformer();


export {componentTransformer as default};
