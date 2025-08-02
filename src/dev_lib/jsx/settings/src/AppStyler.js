
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
// rules : [({selector, style, class, check?},)*],
// style : <style string ready to be appended to a given style attribute>
// class : [(<class ready to be added to an element's classList>,)*]
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
    });
    return idPromise;
  }

  async prepareComponentHelper(componentModule, componentPath, node, env) {
    // Get a new, unique ID for the component.
    componentID = this.componentIDs[componentPath] = this.getNextComponentID();

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
    let transform, transformProps;
    let len = childRules.length;
    for (let i = len - 1; i >= 0; i--) {
      let {key: keyFormat} = rule = childRules[i];
      if (testKey(key, keyFormat)) {
        transform = rule.transform;
        transformProps = rule.props;
        break;
      }
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
      styleElement = document.createElement("style");
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
      let selectorListNode = parseString(
        selector, node, env, cssParser, "selector-list"
      )
      selectorTemplate = cssTransformer.transformSelectorList(selectorListNode);
      let styleSheetID = "";
      preparedRule.selector = cssTransformer.instantiateStyleSheetTemplate(
        selectorTemplate, componentID, styleSheetID
      );

      // Prepare the output classes.
      let preparedOutClasses = [];
      forEachValue(outClasses, node, env, classStr => {
        if (typeof classStr !== string || !CLASS_STRING_REGEX.test(classStr)) {
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
      preparedRule.class = preparedOutClasses;

      // Validate and prepare the styles.
      let preparedStyles = [];
      forEachValue(styles, node, env, style => {
        // If style is an object, stringify it and remove the wrapping "{}".
        if (style instanceof Object) {
          style = jsonStringify(style).slice(1, -1);
        }

        // Else if it is a string, trim it in both ends.
        else {
          style = getString(style, node, env).trim();
        }

        // Then parse the declaration list, throwing on failure, and push the
        // style string to preparedStyles on success.
        parseString(style, node, env, cssParser, "declaration!1+");
        preparedStyles.push(style);
      });
      preparedRule.style = preparedStyles.join(" ");

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
          `Invalid transform keyword: ${getString(selector, node, env)}`,
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














  // prepareInstance() is a "semi-async." function, which we here take to mean
  // that it might also return its result synchronously via a reference
  // argument ('retRef'). 
  async prepareInstanceHelper(jsxInstance, node, env, retRef = []) {
    let {
      componentModule, key: instanceKey, settings, settingsData,
      parentInstance: {
        settingsData: {
          preparedTransform: {childTransformsEntries}
        }
      }
    } = jsxInstance;

    // If the instance has already been prepared, return early.
    if (settingsData.preparedTransform) {
      return retRef[0] = true;
    }

    // If childTransformsEntries is a promise, wait for it.
    if (childTransformsEntries instanceof Promise) {
      childTransformsEntries = await childTransformsEntries;
    }

    // Extract the transformSpecs from childTransformsEntries, where
    // the first entry is found going in the reverse direction, starting with
    // the last entry in the array, where instanceKey matches key (format) of
    // the childProps object.
    let transformSpecs;
    let len = childTransformsEntries.length;
    for (let i = len - 1; i >= 0; i--) {
      let [key, val] = childTransformsEntries[i];
      if (testKey(instanceKey, key)) {
        transformSpecs = val;
        break;
      }
    }
    let {route: transformRoute, props: transformProps} = transformSpecs ?? {};

    // If the component has already rendered before with the same (stringified)
    // transformProps, then just return that result again.
    let transform;
    let componentPath = componentModule.modulePath;
    let transformMap = this.preparedTransforms.get(componentPath);
    if (transformMap) {
      transform = transformMap.get(transformProps);
      if (transform !== undefined) {
        if (transform instanceof Promise) {
          transform = await transform;
        }
        return retRef[0] = transform;
      }
    }

    // Else if transformMap wasn't initialized before, do so before continuing.
    else {
      transformMap = new Map();
      this.preparedTransforms.set(componentPath, transformMap);
    }

    // Then call getPreparedTransform() to get the prepared transform.
    let {interpreter} = env.scriptVars;
    let transformRef = [];
    transform = this.getPreparedTransform(
      componentModule, transformProps, settings,
      node, env, interpreter, transformRef
    );
    transform = transformRef[0] ?? transform;

    // Also make sure update transformMap with the result, and if the result is
    // a promise, we also make it replace itself in the transformMap when it
    // resolves. And then we immediately wait for it to do so.
    transformMap.set(transformProps, transform);
    if (transform instanceof Promise) {
      transform.then(transform => {
        transformMap.set(transformProps, transform);
      });
      transform = await transform;
    }

    // Finally, update settingsData with the prepared transform, and return it.
    settingsData.preparedTransform = transform;
    return retRef[0] = true;
  }


  // getTransform() takes the componentModule and the instanceKey (from its
  // parent) of a given component instance, as well as the childProps object
  // gotten from the transform object of the parent, and uses it to get the
  // transform object of the instance.
  async getPreparedTransform(
    componentModule, transformProps, settings,
    node, env, interpreter, retRef = [],
  ) {
    // Then call settings.getTransformModule() to potentially get a different
    // module from which to get the transform. (Or getTransformModule() might
    // also just return/resolve with the same componentModule). Note that the
    // returned transformModule might also be a promise, which is fine since
    // getTransformFromModule() also accepts a promise argument.
    let transformModule = settings.getTransformModule(
      componentModule, node, env
    );

    // Now call getTransformFromModule(), to get the transform, which will be a
    // promise unless if it is returned via the "retRef" of
    // getTransformFromModule(), which we call transformRef here.
    let transformProps = jsonParse(transformProps, node, env);
    let transformRef = [];
    let transform = this.getTransformFromModule(
      transformModule, transformProps, node, env, interpreter, transformRef
    );
    transform = transformRef[0] ?? transform;
    if (transform instanceof Promise) {
      transform = await transform;
    }

    // Then import and load the transform's style sheets, and update its
    // styleSheets property, before returning it.
    let styleSheetsRef = [];
    let styleSheets = this.importAndPrepareStyleSheets(
      transform.styleSheets, settings, node, env, interpreter, styleSheetsRef
    );
    styleSheets = styleSheetsRef[0] ?? styleSheets;
    if (styleSheets instanceof Promise) {
      styleSheets = await styleSheets;
    }
    transform.styleSheets = styleSheets;

    return retRef[0] = transform;
  }


  // getTransformFromModule() extracts and prepares the transform exported
  // from a module, either directly as a 'transform' variable, or through an
  // exported 'getTransform()' function.
  async getTransformFromModule(
    liveModule, transformProps, node, env, interpreter, retRef = []
  ) {
    if (liveModule instanceof Promise) {
      liveModule = await liveModule;
    }

    // If the module export a 'getTransform()' function, call it with the
    // argument of transformProps to get the transform.
    let transform;
    let getTransform = liveModule.get("getTransform");
    if (getTransform) {
      transform = interpreter.executeFunction(
        getTransform, [transformProps], node, env, undefined,
        [CLEAR_FLAG]
      );
      return retRef[0] = this.prepareTransform(transform, node, env);
    }

    // Else get the 'transform' variable, if the module exports one, then
    // validate and prepare it, before returning it.
    transform = liveModule.get("transform");
    if (transform) {
      return retRef[0] = this.prepareTransform(transform, node, env);
    }

    // And else behave as if the module had exported an empty transform.
    return retRef[0] = this.prepareTransform({});
  }


  // prepareTransform()'s job is just to turn the childProps property of
  // the transform, if there, into an entries array and stringifying the values
  // in the process, such that the resulting childTransformsEntries is
  // ready to be passed to getTransform() above.
  prepareTransform(transform, node, env) {
    ret = {...transform};
    verifyType(transform, "object", node, env);
    let childProps = transform.childProps;
    if (childProps !== undefined) {
      verifyType(childProps, "object", node, env);
      transform.childTransformsEntries = Object.entries(childProps)
        .forEach(entry => {
          entry[1] = jsonStringify(entry[1]);
        });
    }
    else {
      ret.childTransformsEntries = [];
    }
    return ret;
  }


  // importAndPrepareStyleSheets() prepares the styleSheets object such that
  // it is ready to be passed to prepareTransformRules() below, and it also
  // imports and loads any style sheet that hasn't been done so yet (or aren't
  // already being loaded currently) by validating and transforming it, and
  // then inserting it into the document head.
  async importAndPrepareStyleSheets(
    styleSheets, settings, node, env, interpreter, retRef = []
  ) {
    verifyType(rules, "object", node, env);
    let preparedStyleSheets = {};

    // Go through each style sheet and push a promise to the following array
    // to import and apply the style sheet, returning an ID in each case, which
    // we can subsequently substitute the values in styleSheets for.
    let idArr = [], isReady = true;
    let preparedEntryPromiseArr = [];
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
        // console.warn(
        //   "A relative path was used for transform.styleSheets. " +
        //   "It is better to wrap them in an abs() call to turn them absolute, " +
        //   "most of all because this makes transforms easier to extend."
        // );
        // let curPath = env.getModuleEnv().modulePath;
        // val = getFullPath(curPath, val, node, env);
        throw new ArgTypeError(
          "Style sheet paths must be absolute, but got: " +
          `"${getString(val, node, env)}". Please wrap relative routes in a ` +
          "call to abs().",
          node, env
        );
      } 

      // Then if the style sheet is currently being loaded, in which this.
      // styleSheetIDs will hold a promise for the id, push a promise to the
      // prepared entry via #getPreparedEntry().
      let id = this.styleSheetIDs.get(val);
      if (id instanceof Promise) {
        preparedEntryPromiseArr.push(this.#getPreparedEntry(key, id));
      }

      // And if the style sheet has already been, just mutate the return value,
      // preparedStyleSheets, straightaway.
      else if (id) {
        preparedStyleSheets[key] = id;
      }

      // Else if val is an absolute route at this point, import and load the
      // style sheet, then push a promise for the prepared entry.
      else if (val[0] === "/") {
        let idPromise = this.importAndLoadStyleSheet(
          val, settings, node, env, interpreter
        );
        preparedEntryPromiseArr.push(this.#getPreparedEntry(key, id));
        this.styleSheetIDs.set(val, idPromise);
        idPromise.then(id => {
          this.styleSheetIDs.set(val, id);
        });
      }

      // Else treat val as a style sheet string and load it directly, if an
      // identical style sheet has not already been done so.
      else {
        id = this.loadStyleSheet(val, false, node, env);
        preparedStyleSheets[key] = id;
        this.styleSheetIDs.set(val, id);
      }
    }

    // Now wait for all the loading style sheet IDs, if any, and add the
    // resulting entries to preparedStyleSheets.
    if (preparedEntryPromiseArr.length > 0) {
      let preparedEntriesArr = await Promise.all(preparedEntryPromiseArr);
      preparedEntriesArr.forEach(([key, id]) => {
        preparedStyleSheets[key] = id;
      });
    }

    return retRef[0] = preparedStyleSheets;
  }


  async #getPreparedEntry(key, idPromise) {
    let id = await idPromise;
    return [key, id];
  }



  async importAndLoadStyleSheet(route, settings, node, env, interpreter) {
    let [styleSheet, isTrusted] = await Promise.all([
      interpreter.import(route, node, env),
      settings.getStyleSheetTrust(route),
    ]);
    return loadStyleSheet(styleSheet, isTrusted, node, env);
  }

  loadStyleSheet(styleSheet, isTrusted, node, env) {
    // First get a new, unique ID for the style sheet.
    let id = this.getNextStyleSheetID();

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


  // prepareStyleAndCheck() prepares a rules array such that it is ready to be
  // used by transformInstance() below. It also takes a prepared styleSheets
  // object, whose keys are still the keys used in the classes of the rules,
  // but where the value has been exchanged for a valid style sheet ID. 
  async prepareStyleAndCheck(rules, node, env, interpreter, retRef = []) {
    verifyType(rules, "array", node, env);

    let ruleIndAndStylePromises = [];
    let semiPreparedRules = rules.map((rule, ind) => {
      let preparedRule = {};
      let {selector, classes, style, check} = rule;

      // And we need to validate (and possibly stringify) the inline styles.
      if (style) {
        // If style is a plain object, prepare it by turning it into an entries
        // array where each key and value has been validated.
        if (typeof style === "object") {
          preparedRule.styleEntries = this.prepareStyleEntires(
            style, node, env
          );  
        }
        else if (typeof style !== "string") throw new ArgTypeError(
          `Invalid inline style: ${getString(style, node, env)}`,
          node, env
        );
        else if (RELATIVE_ROUTE_START_REGEX.test(val)) throw new ArgTypeError(
          "Style function routes must be absolute, but got: " +
          `"${getString(style, node, env)}". Please wrap relative routes in ` +
          "a call to abs().",
          node, env
        );

        // If style is an absolute route, expect a ';get' route to a function
        // or an object.
        else if (style[0] === "/") {
          let route = style;
          let importedStyleValue = this.importedStyleValues.get(route);
          if (importedStyleValue) {
            if (importedStyleValue instanceof FunctionObject) {
              preparedRule.styleFun = importedStyleValue;
            }
            else {
              preparedRule.styleEntries = importedStyleValue;
            }
          }
          else {
            let importedValuePromise = interpreter.fetch(route, node, env);
            let 

          }
          importedStylePromises.push([
            interpreter.fetch(route, node, env), ind, route
          ]);
        }
        else throw new ArgTypeError(
          "The style value of a transform rule has to be either a plain " +
          "object or an absolute route, but got: " +
          `"${getString(style, node, env)}"`,
          node, env
        );
      }

      // Now wait for all the imported 

      // This method assumes that the 'selector' and 'classes' properties will
      // be prepared later on (by prepareSelectorAndClasses()), so we just copy
      // those properties here.
      preparedRule.selector = selector;
      preparedRule.classes = classes;

      return preparedRule;
    });

    return semiPreparedRules;
  }

  prepareStyleEntires(styleObj, node, env) {
    verifyType(styleObj, "object", node, env);

    // ...

    // Parse the style string, throwing a syntax error if the inline style
    // is invalid or illegal (or not implemented yet).
    style = style.trim();
    parseString(style, node, env, cssParser, "declaration!1*$");
  }

  // prepareSelectorAndClasses() prepares the 'selector' and 'classes'
  // properties of transform rules such that these rules is ready to be used by
  // transformInstance() below. It also takes a prepared styleSheets object,
  // whose keys are still the keys used in the classes of the rules, but where
  // the values has been exchanged for a valid style sheet IDs. 
  prepareSelectorAndClasses(rules, preparedStyleSheets, node, env) {
    let preparedRules = rules.map(rule => {
      let preparedRule = {};
      let {selector, classes = [], styleEntries, check} = rule;
      verifyTypes([selector, classes], ["string", "array"], node, env);

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
      preparedRule.classes = classes.map(className => {
        className = getString(className, node, env);
        if (typeof className !== "string") return;
        let [match, classNameRoot, styleSheetKey] = CLASS_STRING_REGEX.exec(className);
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

      // This method assumes that the 'styleEntries' and 'check' properties
      // have already been prepared (by prepareStyleAndCheck()), so we just
      // copy those properties here.
      preparedRule.styleEntries = styleEntries;
      preparedRule.check = check;

      return preparedRule;
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
