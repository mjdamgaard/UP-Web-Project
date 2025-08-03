
import {cssParser} from "./CSSParser.js";
import {cssTransformer} from "./CSSTransformer.js";
import {
  ArgTypeError, parseString, verifyTypes, verifyType, getString,
  getPropertyFromPlainObject, jsonStringify, CLEAR_FLAG, jsonParse,
  FunctionObject, getPropertyFromObject, forEachValue, CSSModule, isArray,
} from "../../../../interpreting/ScriptInterpreter.js";

const CLASS_STRING_REGEX = /^ *([a-z][a-z0-9\-]*)((_[a-z0-9\-]*)?) *$/;
const SPACE_REGEX = / +/;
const STYLE_SHEET_KEY_REGEX = /^[a-z0-9\-]+$/;
const RELATIVE_ROUTE_START_REGEX = /^\.\.?\//;

const TRANSFORM_KEYWORD_REGEX = /^(inherit)$/;


// The "transform" objects used by the AppStyler01 are of the following when
// defined by the users:
//
// <transform> := {(styleSheets?, rules?, childRules?},
// styleSheets : [(<CSSModule>,)*],
// rules : [({selector, style?, class?, check?},)*],
// style : [(<style>,)*] | <style>
// <style> := {(<CSS property>: <CSS value string>,)*} | <function>,
// class : [(<class>,)*] | <class>
// <class> := [(</[a-z][a-z0-9\-]*(_[1-9][0-9]*)?/ string>,)*],
// check : <function>,
// childRules := [({key, transform?, props?},)*],
// key : </!?.+\*?/ key format>,
// transform : <transform> | "inherit".
//
// And after having been prepared, they are of the form:
//
// <transform> := {(rules, childRules},
// rules : [({selector, style, classes, check?},)*],
// styles : [(<style>,)*],
// <style> := <string ready to be appended to a style attribute> | <function>,
// classes : [(<class ready to be added to an element's classList>,)*]
// check : <function>,
// childRules := *same as above*.
//
// Furthermore, the settingsData props used are:
// componentID?: <the ID of root component of the current style scope>,
// transform?: <prepared transform>,
// transformProps?: <an object passed as input to functions in the transform>.



export class AppStyler01 {

  async initiate(componentModule, settings, node, env) {
    this.settings = settings;

    // Remove any existing UP style elements from a previous setting.
    let upStyleElements = [...document.querySelectorAll(`head style.up-style`)];
    upStyleElements.forEach(node => node.remove());

    this.styleSheetIDs = {}; // with styleSheetPath keys.
    this.nextStyleSheetID = 1;
    this.loadedStyleSheets = {}; // with styleSheetPath keys, and with
    // {styleSheetID : <id>, template : <string>, classes : [<class name>,)*],
    // instances: {componentID: <isLoaded>}} values.
    this.componentIDs = {}; // with componentPath keys.
    this.nextComponentID = 1;
    this.componentPaths = {}; // with componentID keys.
    this.defaultComponentStyles = {}; // with componentPath keys.

    await this.prepareComponent(componentModule, node, env);
  }

  getNextStyleSheetID() {
    return this.nextStyleSheetID++;
  }
  getNextComponentID() {
    return this.nextComponentID++;
  }


  // prepareComponent() looks to see if the component has already been
  // prepared, or are currently being so, and otherwise if finds the default
  // transform and transformProps for the component, consulting settings, and
  // prepares the transform for use (including loading all the style sheets it
  // uses).
  async prepareComponent(componentModule, node, env) {
    let componentPath = componentModule.modulePath;

    // Get the componentID for the component, and if one exists already, return
    // early.
    let componentID = this.componentIDs[componentPath];
    if (componentID instanceof Promise) {
      componentID = await componentID;
    }
    if (componentID) {
      return;
    }

    // Else store a self-replacing promise at this.componentIDs[modulePath],
    // which resolves with the componentID when the component has been prepared.
    let idPromise = this.componentIDs[componentPath] =
      this.prepareComponentHelper(componentModule, componentPath, node, env);
    idPromise.then(id => {
      this.componentIDs[componentPath] = id;
      this.componentPaths[id] = componentPath;
    });
    return idPromise;
  }

  async prepareComponentHelper(componentModule, componentPath, node, env) {
    // Get a new, unique ID for the component.
    let componentID = this.componentIDs[componentPath] =
      this.getNextComponentID();
    this.componentPaths[componentID] = componentPath;

    // Then call settings.getStyleModule() to get the so-called style module
    // for the component. This might be the module pointed to by a
    // 'styleModulePath' export of the component (in the form of a route), but
    // the settings might also potentially override this with another style
    // module.
    let styleModule = await this.settings.getTransformModule(
      componentModule, node, env
    );

    // Get the transform and the transformProps from that module.
    let transform = styleModule.get("transform");
    let transformProps = styleModule.get("transform");

    // Then prepare this transform, and store the result as well as the default
    // transformProps in this.defaultComponentStyles.
    let preparedTransform = this.prepareTransform(
      transform, componentID, node, env
    );
    let defaultComponentStyle = {
      transform: preparedTransform,
      transformProps: transformProps,
    };
    this.defaultComponentStyles[componentPath] = defaultComponentStyle;

    // And finally return the componentID.
    return componentID;
  }


  // prepareInstance() finds the right transform and transformProps to use
  // for the instance, then returns [isReady=true], unless the component has
  // somehow not yet been prepared, which might happen if the regular import()
  // function is used rather than JSXInstanceInterface.import().
  prepareInstance(jsxInstance, node, env) {
    let {parentInstance, settingsData, key, componentPath} = jsxInstance;
    let {transform: childRules = [], componentID} = parentInstance.settingsData;

    // Extract the transform and transformProps from the last child rule in the
    // parent instance's childRules array where the key format matches this
    // instance's key.
    let transform, transformProps, rule;
    let len = childRules.length;
    for (let i = len - 1; i >= 0; i--) {
      let {key: keyFormat} = rule = childRules[i];
      if (testKey(key, keyFormat)) {
        transform = rule.transform;
        transformProps = rule.props;
        break;
      }
    }

    // If transform equals the "inherit" keyword, instead get the transform
    // from the nearest ancestor instance of the same component with an actual
    // transform stored in its settingsData.
    if (transform === "inherit") {
      transform = this.getInheritedTransform(parentInstance, componentPath);
    }

    // If the transform is falsy, it means that the instance should be the
    // root instance of a new scope.
    if (!transform) {
      // First get the componentID.
      componentID = this.componentIDs[componentPath];

      // If this is not ready yet, return it as the whenReady promise, such
      // that the instance will rerender once it resolves (by which
      // prepareInstance() will be called again).
      if (componentID instanceof Promise) {
        let whenReady = componentID;
        return [false, whenReady];
      }

      // Else if it is undefined, call preparedComponent instead, as return
      // that is the whenReady promise.
      if (!componentID) {
        let whenReady = this.prepareComponent(
          jsxInstance.componentModule, node, env
        );
        return [false, whenReady];
      }

      // And else we know that we can find the transform (also prepared) at
      // this.defaultComponentStyles, as well as a default transformProps if
      // the one we already have gotten is undefined.
      let defaultComponentStyle = this.defaultComponentStyles[componentPath];
      transform = defaultComponentStyle.transform;
      transformProps ??= defaultComponentStyle.transformProps;
    }
    
    // Now that have the transform and transformProps (possibly after a
    // rerender), we can store these in this instance's settingsData, along
    // with the componentID, either gotten from the parent or from
    // this.componentIDs.
    settingsData.componentID = componentID;
    settingsData.transform = transform;
    settingsData.transformProps = transformProps;

    // And finally, we can return isReady = true.
    return [true];
  }


  getInheritedTransform(parentInstance, callerComponentPath) {
    let {componentPath, settingsData: {transform}} = parentInstance;
    if (componentPath === callerComponentPath && transform instanceof Object) {
      return transform;
    }
    parentInstance = parentInstance.parentInstance;
    if (parentInstance) {
      return this.getInheritedTransform(parentInstance, callerComponentPath);
    }
    else return undefined;
  }



  // prepareTransform() transforms a user-defined transform of the form
  // documented at the top of this module into a ready-to-use, "prepared"
  // transform, which is of the form also documented at the top of this module,
  // just below the other documentation.  
  prepareTransform(transform, componentID, node, env) {
    let preparedTransform = {};

    // First go through all the styleSheets of the transform and make sure that
    // they are loaded into the document head if they haven't been so already.
    // And in the process, get an array of the styleSheetIDs for each one.
    let styleSheets = getPropertyFromObject(transform, "styleSheets") ?? [];
    let styleSheetIDArr = [];
    forEachValue(styleSheets, node, env, cssModule => {
      // Verify that the style sheet is a CSSModule instance.
      if (!(cssModule instanceof CSSModule)) throw new ArgTypeError(
        `Invalid CSS module, ${getString(cssModule, node, env)}, in ` +
        "transform.styleSheets. Expected a style sheet imported as a module " +
        "namespace object ('import * as myStyleSheet from ...')."
      );

      // Look in this.loadedStyleSheets to see if there is previous data stored
      // for the style sheet. 
      let styleSheetPath = cssModule.modulePath;
      let styleSheetData = this.loadedStyleSheets[styleSheetPath];
      if (!styleSheetData) {
        styleSheetData = this.loadedStyleSheets[styleSheetPath] = {};
      }
      let {styleSheetID, template, instances} = styleSheetData;

      // If the style sheet has not been transformed into a template before,
      // do so now.
      if (!styleSheetID) {
        template = cssTransformer.transformStyleSheet(
          cssModule.styleSheet, node, env
        );
        styleSheetID = styleSheetData.styleSheetID = this.getNextStyleSheetID();
        styleSheetData.template = template;
        instances = styleSheetData.instances = {};
      }

      // Push the styleSheetID to classesArr.
      styleSheetIDArr.push(styleSheetID);

      // If the style sheet has already been loaded for this particular
      // component before, we can just return here and continue the iteration.
      let isLoaded = instances[componentID];
      if (isLoaded) return;

      // Else generate and store a new instance of the style sheet template
      // for the given componentID, and load it into the document head.
      let styleSheetInstance = cssTransformer.instantiateStyleSheetTemplate(
        template, componentID, styleSheetID 
      );
      let styleElement = document.createElement("style");
      styleElement.append(styleSheetInstance);
      styleElement.setAttribute(
        "class", `up-style sid-${styleSheetID} cid-${componentID}`
      );
      document.querySelector("head").appendChild(styleElement);
    });


    // With the styleSheetID array in hand, we can now prepare the rules by
    // appending or substituting the right styleSheetID suffix to the output
    // classes. We also go through each of the output styles and validate these.
    let rules = getPropertyFromObject(transform, "rules") ?? [];
    let preparedRules = [];
    forEachValue(rules, node, env, rule => {
      let preparedRule = {};
      let selector = getPropertyFromObject(rule, "selector");
      let outClasses = getPropertyFromObject(rule, "class");
      let styles = getPropertyFromObject(rule, "style");
      let check = getPropertyFromObject(rule, "check");
      if (!isArray(outClasses)) {
        outClasses = [outClasses];
      }
      if (!isArray(styles)) {
        styles = [styles];
      }

      // Validate and prepare the selector, transforming each class selector in
      // it by appending "_", which is similar to appending "_<styleSheetID>"
      // with styleSheetID = "". 
      if (typeof selector !== "string") throw new ArgTypeError(
        `Invalid selector: ${getString(selector, node, env)}`,
        node, env
      );
      let selectorList = parseString(
        selector, node, env, cssParser, "selector-list"
      )
      let selectorTemplate = cssTransformer.transformSelectorList(selectorList);
      let styleSheetID = "";
      preparedRule.selector = cssTransformer.instantiateStyleSheetTemplate(
        selectorTemplate, componentID, styleSheetID
      );

      // Prepare the output classes.
      let preparedOutClasses = [];
      forEachValue(outClasses, node, env, classStr => {
        if (typeof classStr !== "string" || !CLASS_STRING_REGEX.test(classStr)) {
          throw new ArgTypeError(
            `Invalid class string: ${getString(classStr, node, env)}`,
            node, env
          );
        }
        classStr.split(SPACE_REGEX).forEach(className => {
          // Extract the user-defined styleSheets index, defaulting to 0, and
          // convert it to the corresponding styleSheetID before pushing it to
          // preparedOutClasses.
          let styleSheetIndex = 0;
          let indOfUnderscore = classStr.indexOf("_");
          if (indOfUnderscore !== -1) {
            [className, styleSheetIndex] = className.split("_");
          }
          styleSheetIndex = parseInt(styleSheetIndex);
          let styleSheetID = styleSheetIDArr[styleSheetIndex];
          let preparedOutClass = className + "_" + styleSheetID;
          preparedOutClasses.push(preparedOutClass);
        });
      });
      preparedRule.classes = preparedOutClasses;

      // Validate and prepare the styles.
      let preparedStyles = [];
      forEachValue(styles, node, env, style => {
        // If style is a function, push it as it is to preparedStyles and
        // return in order to continue the iteration.
        if (style instanceof FunctionObject) {
          preparedStyles.push(style);
          return;
        }

        // Else validate and possibly transform the user-defined style such
        // that it is ready to be appended to a style attribute. (And if the
        // validation fails, the following method call will throw.)
        style = this.prepareStyle(style, node, env);
        preparedStyles.push(style);
      });
      preparedRule.styles = preparedStyles;

      // Validate the check function if one is provided.
      if (check) {
        if (!(check instanceof FunctionObject)) throw new ArgTypeError(
          `Invalid check function: ${getString(check, node, env)}`,
          node, env
        );
        preparedRule.check = check;
      }

      // And finally push the now prepared rule to preparedRules before
      // continuing to the next rule.
      preparedRules.push(preparedRule);
    });
    preparedTransform.rules = preparedRules;


    // Then prepare the childRules.
    let childRules = getPropertyFromObject(transform, "childRules") ?? [];
    let preparedChildRules = [];
    forEachValue(childRules, node, env, childRule => {
      let preparedChildRule = {};
      let key = getPropertyFromObject(childRule, "key");
      let transform = getPropertyFromObject(childRule, "transform");
      let transformProps = getPropertyFromObject(childRule, "props");

      // Make sure that key is a string.
      preparedChildRule.key = getString(key, node, env);

      // If transform is a string, check that it is a reserved keyword.
      if (typeof transform === "string") {
        if (!TRANSFORM_KEYWORD_REGEX.test(transform)) throw new ArgTypeError(
          `Invalid transform keyword: ${getString(transform, node, env)}`,
          node, env
        );
        preparedChildRule.transform = transform;
      }

      // Else if transform is defined, prepare it recursively.
      else if (transform !== undefined) {
        transform = this.prepareTransform(transform, componentID, node, env);
        preparedChildRule.transform = transform;
      }
      
      // And transformProps can be anything in principle, so just copy it.
      preparedChildRule.props = transformProps;

      // Then push the now prepared childRule and continue the iteration.
      preparedChildRules.push(preparedChildRule);
    });
    preparedTransform.childRules = preparedChildRules;

    // Finally, return the prepared {rules, childRules} transform.
    return preparedTransform;
  }


  // prepareStyle() validates an input style, and possibly turns it from an
  // object into a style string first, before the validation.
  prepareStyle(style, node, env) {
    // If it's an object, stringify it and remove the wrapping "{}".
    if (style instanceof Object) {
      style = jsonStringify(style).slice(1, -1);
    }

    // Else if it is a string, trim it in both ends.
    else {
      style = getString(style, node, env).trim();
    }

    // Then parse the declaration list, throwing on failure.
    parseString(style, node, env, cssParser, "declaration!1*$");
  }



  // transformInstance() takes the outer DOM node of a component instance, an
  // array if its "own" DOM nodes, and a rules array that has already been
  // validated and prepared by inserting the right style sheet IDs in classes,
  // and then transforms the nodes of that instance, giving it inline styles
  // and/or classes. 
  transformInstance(jsxInstance, domNode, ownDOMNodes, node, env) {
    let {settingsData, props, state} = jsxInstance;
    let {componentID, transform: {rules}, transformProps} = settingsData;
    let {interpreter} = env.scriptVars;
    if (ownDOMNodes.length === 0) {
      return;
    }

    // Add the "c<componentID>" class to all ownDOMNodes, and also add an
    // "own-leaf" class to all the nodes that haven't got children themselves
    // that are part of the ownDOMNodes. Since the ownDOMNodes array is ordered
    // with ancestors coming before their descendants, we can do that the
    // following way.
    let componentIDClass = `c${componentID}`;
    ownDOMNodes.forEach(node => {
      let parent = node.parentElement;
      if (parent.classList.contains("own-leaf")) {
        parent.classList.remove("own-leaf");
      }
      node.classList.add("own-leaf", componentIDClass);
    });

    // Now go through each rule and add the inline styles and classes to the
    // element that the rule selects, but only if the check function succeeds,
    // or it is undefined.
    rules.forEach(({selector, classes, styles, check}) => {
      // Check if the rule applies to the instance with its current props and
      // state, and return early otherwise.
      if (check) {
        let ruleApplies = interpreter.executeFunction(
          check, [transformProps, props, state], node, env, undefined,
          [CLEAR_FLAG]
        );
        if (!ruleApplies) return;
      }

      // Get the elements that the selector selects out of the ownDOMNodes.
      let transformedSelector = ':scope:where(' + selector + '), ' +
        ':scope :not(:scope .own-leaf *):where(' + selector + ')';
      let targetNodes = domNode.querySelectorAll(transformedSelector);
      
      // Then apply the inline styles and classes.
      targetNodes.forEach(node => {
        classes.forEach(className => {
          node.classList.add(className);
        });
        styles.forEach(style => {
          if (style instanceof FunctionObject) {
            style = interpreter.executeFunction(
              style, [transformProps, props, state], node, env, undefined,
              [CLEAR_FLAG]
            );
            style = this.prepareStyle(style, node, env);
          }
          let prevStyle = node.getAttribute("style");
          node.setAttribute("style", prevStyle + " " + style);
        });
      });
    });

    // Finally, remove the "own-leaf" classes again.
    ownDOMNodes.forEach(node => node.classList.remove("own-leaf"));
  }

}





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





export const appStyler = new AppStyler01();


export {appStyler as default};
