
import {cssParser} from "./parsing/CSSParser.js";
import {
  getPrototypeOf, OBJECT_PROTOTYPE,
} from "./ScriptInterpreter.js";


// The "transform" objects used by the ComponentTransformer are of the form:
//
// transform := {(styleSheet?, styleSheets?, rules},
// styleSheet := <route string>,
// styleSheets := {(<[a-z][a-z0-9\-]* key>: <route string>,)*},
// rules :=  {(<selector string>: ruleOutput},
// ruleOutput := {styles, classes}, 
// styles := {(<CSS property>: <CSS value string>,)*},
// classes := [(<class>,)*],
//
// where <class> is ether a [a-z][a-z0-9\-]* string if styleSheet is defined
// rather than style*Sheets*, or a [a-z][a-z0-9\-]*_[a-z][a-z0-9\-]* string if
// styleSheets is defined, where the last part is the [a-z][a-z0-9\-]* key of
// the style sheet that the class references.
//
// Well, this is the object format that the users should define and export from
// the component modules, but let's assume that the route strings have all been
// converted to style sheets IDs before transformInstance() is called on the
// transform. So for the method below, we instead have:
//
// styleSheet := <id>,
// styleSheets := {(<[a-z][a-z0-9\-]* key>: <id>,)*}.




export class ComponentTransformer {

  transformInstance(domNode, ownDOMNodes, transform) {
    if (ownDOMNodes.length === 0) {
      return;
    }
    let mainStyleSheetID = transform.styleSheet;
    let styleSheetIDs = transform.styleSheets;
    let rules = transform.rules;

    // TODO: paint all non-ownDOMNodes that are direct children of a ownDOMNode
    // In a class here, which can then be used in combination with
    // domNode.querySelectorAll() to select the right nodes for each selector.

    if (getPrototypeOf(rules) !== OBJECT_PROTOTYPE) throw new TransformError(
      "Invalid 'rules' property of transform: Expected a plain object"
    );

    Object.entries(rules).forEach(([selector, ruleOutput]) => {
      // TODO: Use domNode.querySelectorAll(selector) to get the targeted nodes.
      
      // TODO: Then apply the inline styles and classes from the ruleOutput.
    });

  }

}


export class TransformError {
  constructor(msg) {
    this.msg = msg;
  }
}



export const componentTransformer = new ComponentTransformer();


export {componentTransformer as default};
