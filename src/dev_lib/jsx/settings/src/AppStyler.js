
import {cssParser} from "./CSSParser.js";
import {cssTransformer} from "./CSSTransformer.js";
import {
  ArgTypeError, parseString, verifyTypes, verifyType, getString,
  getPropertyFromPlainObject, jsonStringify,
} from "../../../../interpreting/ScriptInterpreter.js";

const CLASS_REGEX = /^ *([a-z][a-z0-9\-]*)((_[a-z0-9\-]*)?) *$/;


// TODO: Correct, and move the description of what users should export
// elsewhere:

// The "transform" objects used by the ComponentTransformer are of the form:
//
// transform := {(styleSheets?, rules?, childProps?},
// styleSheets := {(<[a-z0-9\-]+ key>: <route>|<sheet>,)*},
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
// is a child instance key, possibly with a '*' wildcard at the end, and also
// possibly with a '!' not operator in front, and where the values are then a
// an object that is given as input to the getTransform() function of the
// targeted child instances.




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


  // prepareTransformRules() prepares a rules array such that it is ready to be
  // used by transformInstance() below. It also takes a prepared styleSheets
  // object, whose keys are still the keys used in the classes of the rules,
  // but where the value has been exchanged for a valid style sheet ID. 
  async prepareTransformRules(rules, preparedStyleSheetsObj, node, env) {
    verifyType(rules, "array", node, env);

    let preparedRules = [];
    rules.forEach(({selector, classes = [], style, check}) => {
      verifyTypes(
        [selector, classes, check],
        ["string", "array", "function?"],
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
      preparedRules.classes = classes.map(className => {
        className = getString(className, node, env);
        if (typeof className !== "string") return;
        let [match, classNameRoot, styleSheetKey] = CLASS_REGEX.exec(className);
        if (!match) throw new ArgTypeError(
          `Invalid class: "${className}"`,
          node, env
        );
        styleSheetKey = styleSheetKey.substring(1);
        if (!styleSheetKey) {
          styleSheetKey = "main";
        }
        let styleSheetID = getPropertyFromPlainObject(
          preparedStyleSheetsObj, styleSheetKey
        );
        return classNameRoot + "_" + styleSheetID;
      });

      // And we need to validate (and possibly stringify) the inline styles.
      if (style) {
        if (typeof style === "object") {
          verifyType(style, "plain object", node, env);
          style = jsonStringify(style).slice(1, -1);
        }
        if (typeof style !== "string") throw new ArgTypeError(
          `Invalid inline style: ${getString(style, node, env)}`,
          node, env
        );
        // Parse the style string, throwing a syntax error if the inline style
        // is invalid or illegal (or not implemented yet).
        style = style.trim();
        parseString(style, node, env, cssParser, "declaration!1*$");

        preparedRules.style = style;
      }
    });

    return preparedRules;
  }

  // transformInstance() takes the outer DOM node of a component instance, an
  // array if its "own" DOM nodes, and a rules array that has already been
  // validated and prepared by inserting the right style sheet IDs in classes,
  // and then transforms the nodes of that instance, giving it inline styles
  // and/or classes. 
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
    preparedRules.forEach(({selector, classes, style}) => {
      // Get the elements that the selector selects. Note that the selectors
      // have to be validated for each rule (by parsing them successfully)
      // before this method is called. And they also have to have all classes
      // in them transformed by appending a '_' to them.
      let transformedSelector = ':scope:where(' + selector + '), ' +
        ':scope :not(:scope .own-leaf *):where(' + selector + ')';
      let targetNodes = domNode.querySelectorAll(transformedSelector);
      
      // Then apply the inline styles and classes. We also here assume that all
      // styles has already been validated, and that all classes have been
      // transformed, giving them the right style sheet ID suffix.
      targetNodes.forEach(node => {
        if (classes) {
          classes.forEach(className => {
            node.classList.add(className);
          });
        }
        if (style) {
          node.setAttribute("style", style);
        }
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
