
import {cssParser} from "./parsing/CSSParser.js";
import {
  getPrototypeOf, OBJECT_PROTOTYPE, verifyTypes,
} from "./ScriptInterpreter.js";

// TODO: Correct, and move the description of what users should export
// elsewhere:

// The "transform" objects used by the ComponentTransformer are of the form:
//
// transform := {(styleSheet?, styleSheets?, rules?, childProps?},
// styleSheet := <route string>,
// styleSheets := {(<[a-z][a-z0-9\-]* key>: <route string>,)*},
// rules :=  {(<selector>: ruleOutput},
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
// transform. And also all user-defined selectors should be validated before
// transformInstance() is called. So for the method below, we instead have:
//
// styleSheet := <id>,
// styleSheets := {(<[a-z][a-z0-9\-]* key>: <id>,)*},
// rules :=  {(<pre-validated selector>: ruleOutput}.
//
// And although it is not relevant here, childProps := an object where the key
// is either a route, the reserved "all" string, or an child instance key, and
// where the values are the a props object that is merged with the actual props
// object for the instance, overwriting existing properties of the same key,
// when the child's getTransform() function is called.




export class ComponentTransformer {

  transformInstance(domNode, ownDOMNodes, preparedRules) {
    if (ownDOMNodes.length === 0) {
      return;
    }

    // Add an "own-leaf" class to all of the ownDOMNodes who haven't got
    // children themselves that are part of the ownDOMNodes. Since this array
    // is ordered with ancestors coming before their descendants, we can do
    // that the following way.
    ownDOMNodes.forEach(node => {
      let parent = node.parentElement;
      if (parent.classList.contains("own-leaf")) {
        parent.classList.remove("own-leaf");
      }
      node.classList.add("own-leaf");
    });

    // Now go through each rule and add the inline styles and classes to the
    // element that the rule selects.
    Object.entries(preparedRules).forEach(([selector, ruleOutput]) => {
      // Get the elements that the selector selects. Note that the selectors
      // have to be validated for each rule (by parsing them successfully)
      // before this method is called. And they also have to have all classes
      // in them transformed by appending a '_' to them.
      let transformedSelector = ':scope:where(' + selector + '), ' +
        ':scope :not(:scope .own-leaf *):where(' + selector + ')';
      let targetNodes = domNode.querySelectorAll(transformedSelector);
      
      // Then apply the inline styles and classes from the ruleOutput. We also
      // here assume that all styles has already been validated, and that all
      // classes have been transformed, giving them the right style sheet ID
      // suffix.
      let styleEntries = ruleOutput.styleEntries ?? [];
      let classes = ruleOutput.classes ?? [];
      targetNodes.forEach(node => {
        styleEntries.forEach(([property, valueStr]) => {
          node.style.setProperty(property, valueStr);
        });
        classes.forEach(className => {
          node.classList.add(className);
        });
      });
    });

    // Finally, remove the "own-leaf" classes again.
    ownDOMNodes.forEach(node => {
      node.classList.remove("own-leaf");
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
