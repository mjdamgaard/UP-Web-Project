
import {cssParser} from "./CSSParser.js";
import {cssTransformer} from "./CSSTransformer.js";
import {
  ArgTypeError, parseString, verifyTypes, verifyType, getString,
  getPropertyFromPlainObject, jsonStringify, getFullPath, CLEAR_FLAG,
  jsonParse,
} from "../../../../interpreting/ScriptInterpreter.js";

const CLASS_REGEX = /^ *([a-z][a-z0-9\-]*)((_[a-z0-9\-]*)?) *$/;
const STYLE_SHEET_KEY_REGEX = /^[a-z0-9\-]+$/;
const RELATIVE_ROUTE_START_REGEX = /^\.\.?\//;


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




export class AppStyler01 {

  initiate() {
    [...document.querySelectorAll(`head style.up-style`)].forEach(node => {
      node.remove();
    });
    this.styleSheetIDPromises = new Map();
    this.nextID = 1;
    this.instanceTransforms = new Map();
  }

  getNextID() {
    return this.nextID++;
  }


  // prepareInstance() is called..
  prepareInstance(componentModule, auxProps, node, env) {

  }


  // getTransform() takes the componentModule and the instanceKey (from its
  // parent) of a given component instance, as well as the childProps object
  // gotten from the transform object of the parent, and uses it to get the
  // transform object of the instance.
  getTransform(
    componentModule, instanceKey, stringifiedChildPropsEntries,
    settings, node, env, interpreter
  ) {
    // Extract the transformProps from stringifiedChildPropsEntries, where
    // the first entry is found going in the reverse direction, starting with
    // the last entry in the array, where instanceKey matches key (format) of
    // the childProps object.
    let stringifiedTransformProps;
    let len = stringifiedChildPropsEntries.length;
    for (let i = len - 1; i >= 0; i--) {
      let [key, val] = stringifiedChildPropsEntries[i];
      if (testKey(instanceKey, key)) {
        stringifiedTransformProps = val;
        break;
      }
    }
    stringifiedTransformProps ??= "null";

    // If the component has already rendered before with the same (stringified)
    // transformProps, then just return that result again.
    let transform;
    let componentPath = componentModule.modulePath;
    let transformMap = this.instanceTransforms.get(componentPath);
    if (transformMap) {
      transform = transformMap.get(stringifiedTransformProps);
      if (transform !== undefined) {
        return transform;
      }
    }
    else {
      transformMap = new Map();
      this.instanceTransforms.set(componentPath, transformMap);
    }

    // Else call settings.getTransformModule() to potentially get a different
    // module from which to get the transform. (Or getTransformModule() might
    // also just return/resolve with the same componentModule). The call might
    // might return a promise, in which case this method should also return a
    // promise (for the transform).
    let transformModule = settings.getTransformModule(
      componentModule, node, env
    );
    let transformProps = jsonParse(stringifiedTransformProps, node, env);
    if (transformModule instanceof Promise) {
      // Create a promise to the transform, calling getTransformFromSameModule()
      // then the transformModule promise resolves.
      let transformPromise = new Promise((resolve, reject) => {
        transformModule.catch(
          err = reject(err)
        ).then(
          transformModule => resolve(
            this.getTransformFromSameModule(
              transformModule, transformProps, node, env, interpreter
            )
          )
        );
      });

      // Then update transformMap with a self-replacing promise, and return the
      // transformPromise.
      transformMap.set(stringifiedTransformProps, transformPromise);
      transformPromise.then(transform => {
        transformMap.set(stringifiedTransformProps, transform);
      });
      return transformPromise;
    }
    else {
      // If transformModule is not a promise, call getTransformFromSameModule()
      // directly, and update transformMap with the result before returning
      // that same result.
      let transform = this.getTransformFromSameModule(
        transformModule, transformProps, node, env, interpreter
      );
      transformMap.set(stringifiedTransformProps, transform);
      return transform;
    }
  }


  // getTransformFromSameModule() extracts and prepares the transform exported
  // from a module, either directly as a 'transform' variable, or through an
  // exported 'getTransform()' function.
  getTransformFromSameModule(
    liveModule, transformProps, node, env, interpreter
  ) {
    // If the module exports a 'transform' variable, simply get that, validate
    // and prepare it, and then return it.
    let transform = liveModule.get("transform");
    if (transform) {
      return this.prepareTransform(transform, node, env);
    }

    // Else get 'getTransform()' function, if the module exports one, and if
    // so, and call it with the argument of transformProps to get the transform.
    let getTransform = liveModule.get("getTransform");
    if (getTransform) {
      transform = interpreter.executeFunction(
        getTransform, [transformProps], node, env, undefined,
        [CLEAR_FLAG]
      );
      return this.prepareTransform(transform, node, env);
    }

    // And else behave as if the module had exported an empty transform.
    return this.prepareTransform({});
  }


  // prepareTransform()'s job is just to turn the childProps property of
  // the transform, if there, into an entries array and stringifying the values
  // in the process, such that the resulting stringifiedChildPropsEntries is
  // ready to be passed to getTransform() above.
  prepareTransform(transform, node, env) {
    transform ??= {};
    verifyType(transform, "plain object", node, env);
    let childProps = transform.childProps;
    if (childProps !== undefined) {
      verifyType(childProps, "plain object", node, env);
      transform.stringifiedChildPropsEntries = Object.entries(childProps)
        .forEach(entry => {
          entry[1] = jsonStringify(entry[1]);
        });
    }
    else {
      transform.stringifiedChildPropsEntries = [];
    }
  }


  // importAndPrepareStyleSheets() prepares the styleSheets object such that
  // it is ready to be passed to prepareTransformRules() below, and it also
  // imports and loads any style sheet that hasn't been done so yet (or aren't
  // already being loaded currently) by validating and transforming it, and
  // then inserting it into the document head.
  async importAndPrepareStyleSheets(
    styleSheets, settings, node, env, interpreter
  ) {
    verifyType(rules, "plain object", node, env);
    let preparedStyleSheets = {};

    // Go through each style sheet and push a promise to the following array
    // to import and apply the style sheet, returning an ID in each case, which
    // we can subsequently substitute the values in styleSheets for.
    let idPromiseArr = [];
    let styleSheetEntries = Object.entries(styleSheets);
    let len = styleSheetEntries.length;
    for (let i = 0; i < len; i++) {
      let [key, val] = styleSheetEntries[i];
      if (!STYLE_SHEET_KEY_REGEX.test(key)) throw new ArgTypeError(
        `Invalid transform.styleSheets key: "${key}"`,
        node, env
      );
      if (typeof val !== "string") throw new ArgTypeError(
        `Invalid transform.styleSheets value: "${getString(val, node, env)}"`,
        node, env
      );
      // If val is a relative route, convert it to an absolute one, but log a
      // warning that one ought to use absolute routes instead, making it
      // easier to extend and modify JSX components.
      if (RELATIVE_ROUTE_START_REGEX.test(val)) {
        console.warn(
          "A relative path was used for transform.styleSheets. " +
          "It is better to wrap them in an abs() call to turn them absolute, " +
          "most of all because this makes bundling easier."
        );
        let curPath = env.getModuleEnv().modulePath;
        val = getFullPath(curPath, val, node, env);
      } 

      // Then if the style sheet is already loaded, or is loading, just push
      // the promise directly from this.styleSheetIDPromises.
      let idPromise = this.styleSheetIDPromises.get(val);
      if (idPromise) {
        idPromiseArr.push(idPromise);
      }

      // Else if val is now an absolute route, push a promise that imports the
      // style sheet and resolves with a unique ID for that style sheet.
      else if (val[0] === "/") {
        idPromise = this.importAndLoadStyleSheet(
          val, settings, node, env, interpreter
        );
        idPromiseArr.push(idPromise);
        this.styleSheetIDPromises.set(val, idPromise);
      }

      // Else treat val as a style sheet string and load it directly, if an
      // identical style sheet has not already been done so.
      else {
        idPromise = this.loadStyleSheet(val, false, node, env);
        idPromiseArr.push(idPromise);
        this.styleSheetIDPromises.set(val, idPromise);
      }
    }

    // Now wait for all the style sheet IDs, and use them to transform the
    // values of styleSheets to the IDs instead for the return value.
    let styleSheetIDArr = await Promise.all(idPromiseArr);
    styleSheetEntries.forEach(([key], ind) => {
      preparedStyleSheets[key] = styleSheetIDArr[ind];
    });
    return preparedStyleSheets;
  }


  async importAndLoadStyleSheet(route, settings, node, env, interpreter) {
    let [styleSheet, isTrusted] = await Promise.all([
      interpreter.import(route, node, env),
      settings.getStyleSheetTrust(route),
    ]);
    return await loadStyleSheet(styleSheet, isTrusted, node, env);
  }

  async loadStyleSheet(styleSheet, isTrusted, node, env) {
    // First get a new, unique ID for the style sheet.
    let id = this.getNextID();

    // Then parse and transform the style sheet.
    let [styleSheetNode] = parseString(styleSheet, node, env, cssParser);
    let transformedStyleSheet = cssTransformer.transformStyleSheet(
      styleSheetNode, id, isTrusted, node, env
    );

    // Then we create and insert the new style element, with a class of
    // "up-style id-<id>".
    styleElement = document.createElement("style");
    styleElement.append(transformedStyleSheet);
    styleElement.setAttribute("class", `up-style id-${id}`);
    document.querySelector("head").appendChild(styleElement);

    // And finally return the ID of the loaded style sheet.
    return id;
  }



  // prepareTransformRules() prepares a rules array such that it is ready to be
  // used by transformInstance() below. It also takes a prepared styleSheets
  // object, whose keys are still the keys used in the classes of the rules,
  // but where the value has been exchanged for a valid style sheet ID. 
  prepareTransformRules(rules, preparedStyleSheets, node, env) {
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
          preparedStyleSheets, styleSheetKey
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



export function testKey(key, keyFormat) {
  if (keyFormat[0] === "!") {
    keyFormat = keyFormat.substring(1);
    return !testKeyHelper(key, keyFormat);
  }
  else {
    return testKeyHelper(key, keyFormat);
  }
}

function testKeyHelper(key, keyFormat) {
  if (keyFormat.at(-1) === "*") {
    keyFormat = keyFormat.slice(0, -1);
    key = key.substring(0, keyFormat.length);
    return key === keyFormat;
  }
  else {
    return key === keyFormat;
  }
}





export const appStyler = new AppStyler();


export {appStyler as default};
