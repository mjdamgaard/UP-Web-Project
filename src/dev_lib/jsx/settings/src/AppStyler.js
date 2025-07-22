
import {cssParser} from "./CSSParser.js";
import {cssTransformer} from "./CSSTransformer.js";
import {
  parseString, verifyTypes, verifyType,
} from "../../../../interpreting/ScriptInterpreter.js";

// TODO: Correct, and move the description of what users should export
// elsewhere:

// The "transform" objects used by the ComponentTransformer are of the form:
//
// transform := {(styleSheets?, rules?, childProps?},
// styleSheets := [({route?, sheet?, id?},)*],
// rules :=   [({selector, styles?, classes?, check?},)*],
// styles := {(<CSS property>: <CSS value string>,)*},
// classes := [(<class>,)*],
// check := <function of props and state>,
//
// where <class> is ether a [a-z][a-z0-9\-]* string if styleSheet is defined
// rather than style*Sheets*, or a [a-z][a-z0-9\-]*_[a-z][a-z0-9\-]* string if
// styleSheets is defined, where the last part is the [a-z][a-z0-9\-]* key of
// the style sheet that the class references.
//
// And although it is not relevant here, childProps := an object where the key
// is either a route, the reserved "all" string, or an child instance key, and
// where the values are the a props object that is merged with the actual props
// object for the instance, overwriting existing properties of the same key,
// when the child's getTransform() function is called.




export class AppStyler {
  constructor() {
    this.styleSheetIDs = undefined;
  }

  reset() {
    [...document.querySelectorAll(`head style.up-style`)].forEach(node => {
      node.remove();
    });
    this.styleSheetIDs = new Map();
  }



  async prepareTransform(rules, styleSheets = [], node, env) {
    verifyTypes([rules, styleSheets], ["array", "array"], node, env);

    let preparedRules = [];
    rules.forEach(({selector, classes = [], styles = [], check}) => {
      verifyTypes(
        [selector, classes, styles, check],
        ["string", "array", "array", "function?"],
        node, env
      );
      let preparedRule = {};

      // Validate and transform the selector such that all classes gets a
      // trailing underscore, which is similar of appending a style sheet ID of
      // "" to them.
      let [parsedSelectorList] = parseString(
        selector, node, env, cssParser, "selector-list"
      );
      let id = "";
      preparedRule.selector = cssTransformer.transformSelectorList(
        parsedSelectorList, id, true
      );

      // We also need to transform the classes by appending the right style
      // sheet ID suffix to them.
      // TODO: Do.

      // And we need to check the inline styles..

    });

  }


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
    preparedRules.forEach(({selector, classes = [], styleEntries = []}) => {
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


// export class TransformError {
//   constructor(msg) {
//     this.msg = msg;
//   }
// }



export const appStyler = new AppStyler();


export {appStyler as default};
