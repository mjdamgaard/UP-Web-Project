

import sassTranspiler from "../../interpreting/SASSTranspiler.js";
import {
  RuntimeError, UHArray, PromiseObject, ArgTypeError, unwrapValue,
} from "../../interpreting/ScriptInterpreter.js";
import {sassParser} from "../../interpreting/parsing/SASSParser.js";


const CLASS_TRANSFORM_OUTPUT_REGEX =
  /^(rm_)?([a-zA-Z][a-z-A-Z0-9\-]*_[a-zA-Z][a-z-A-Z0-9\-]*)$/;






export class JSXAppStyler {

  constructor(getStyle, styleParams, interpreter) {
    this.getStyle = getStyle;
    this.styleParams = styleParams;
    this.interpreter = interpreter;
    this.loadedStyleSheetIDs = new Map();
    this.classTransformPromises = new Map();
  }

  getClassTransformPromise(componentPath) {
    return this.classTransformPromises.get(componentPath);
  }

  // loadStylesOfAllStaticJSXModules() fetches and apply the styles of all
  // current imported and live modules that has a '.jsx' extension.
  async loadStylesOfAllStaticJSXModules(liveModules, callerNode, callerEnv) {
    let promiseArr = [];
    liveModules.forEach((liveModule) => {
      if (liveModule.modulePath.slice(-4) === ".jsx") {
        let componentPath = liveModule.modulePath;
        let classTransformPromise = this.loadStyle(
          liveModule, componentPath, callerNode, callerEnv
        );
        this.classTransformPromises.set(componentPath, classTransformPromise);
        promiseArr.push(classTransformPromise);
      }
    });

    await Promise.all(promiseArr);
    return;
  }

  // loadStyle() receives a live module and uses getStyle() to get a list of
  // routes of all the style sheets that the component is "subscribed to," as
  // well as the component's "class transform" used for potentially
  // transforming the class attributes set by the component's render() function.
  // It also creates a promise to said classTransform in the same process, and
  // insert this in this.classTransformPromises.
  async loadStyle(liveModule, componentPath, callerNode, callerEnv) {
    // First we get the "styleSpecs" output of getStyle(), which is possibly
    // a PromiseObject to a styleSpecs object, in which case wait for it and
    // unwrap it.
    let styleSpecs = this.interpreter.executeFunction(
      this.getStyle, [componentPath, liveModule],
      callerNode, callerEnv
    );
    if (styleSpecs instanceof PromiseObject) {
      styleSpecs = await styleSpecs.promise;
    }

    // Once the styleSpecs is gotten, which is supposed to be an array
    // (wrapper) of the form [styleSheetPaths?, classTransform?], get the
    // style sheet paths/routes and load each one. Then return the obtained
    // classTransform.
    styleSpecs = unwrapValue(styleSpecs);
    let [styleSheetPaths, classTransform] = styleSpecs;
    await this.loadStyleSheets(styleSheetPaths, callerNode, callerEnv);
    return classTransform;
  }


  async loadStyleSheets(styleSheetPaths, callerNode, callerEnv) {
    // First create a promise array that when resolved will have fetched
    // and and applied all style sheets pointed to by styleSheetPaths that has
    // not yet been loaded.
    let promiseArr = [];
    styleSheetPaths.forEach((route, id) => {
      if (typeof id !== "string" || !/[a-zA-Z][a-zA-Z0-9\-]*/.test(id)) {
        throw new ArgTypeError(
          `Invalid style sheet ID: "${id}"`,
          callerNode, callerEnv
        );
      }

      // If route is an ArrayWrapper, treat it as a [route, isTrusted] pair
      // instead.
      let isTrusted;
      if (route instanceof UHArray) {
        isTrusted = route.get(1);
        route = route.get(0);
      }

      // See if the style sheet is already loaded/loading, and return early if
      // so, continuing the iteration. And else, set the entry in this.
      // loadedStyleSheetIDs immediately, and start fetching and loading it.
      let isLoaded = this.loadedStyleSheetIDs.get(route);
      if (isLoaded) return;
      this.loadedStyleSheetIDs.set(route, id);

      // Push a promise to promiseArr for fetching and loading the style. (Note
      // that since we await styleSheet within this promise, the transpilation
      // will occur on the next tick soonest, meaning that all the routes and
      // IDs from styleSheetPaths will have been added to loadedStyleSheetIDs,
      // which is required.)
      promiseArr.push(new Promise(async (resolve) => {
        let styleSheet = await this.interpreter.import(
          route, callerNode, callerEnv
        );
        this.transpileAndInsertStyleSheet(
          styleSheet, route, id, isTrusted, callerNode, callerEnv
        );
        resolve();
      }));
    });
    await Promise.all(promiseArr);
    return;
  }


  transpileAndInsertStyleSheet(
    styleSheet, route, id, isTrusted, callerNode, callerEnv
  ) {
    // First transpile the style sheet.
    let styleSheetParams = this.styleParams.get(route);
    let transpiledStyleSheet = sassTranspiler.transpile(
      styleSheet, route, id, this.loadedStyleSheetIDs, styleSheetParams,
      isTrusted, callerNode, callerEnv
    );

    // Then get or create the style element with a calls of "up-style <id>".
    let styleElement = document.querySelector(`head style.up-style.${id}`);
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.setAttribute("class", `up-style ${id}`);
      let headElement = document.querySelector(`head`);
      headElement.appendChild(styleElement);
    }

    // Now replace that style element's contents with the transpiled style
    // sheet.
    styleElement.replaceChildren(transpiledStyleSheet);
  }


}


export class JSXComponentStyler {
  constructor(jsxAppStyler, componentPath) {
    this.componentPath = componentPath;
    this.classTransformPromise =
      jsxAppStyler.getClassTransformPromise(componentPath);
  }

  transformClasses(newDOMNode, ownDOMNodes, callerNode, callerEnv) {
    // If classTransform is undefined, it ought to mean that the style for
    // this component has not yet been loaded, in which case throw an error.
    if (this.classTransformPromise === undefined) throw new RuntimeError(
      `Style missing for JSX component at ${this.componentPath}, ` +
      "possibly due to importing a JSX module with a '.js' extension rather" +
      "than '.jsx', or due to importing it dynamically using the regular" +
      "import() function rather than JSXInstance.import()",
      callerNode, callerEnv
    );

    this.classTransformPromise.then(classTransform => {
      // Check that the instance hasn't been rerendered by verifying that
      // this.domNode is still === newDOMNode, and otherwise return early.
      if (this.domNode !== newDOMNode) {
        return;
      }
  
      // Also return early if classTransform is false or nodeArray is empty.
      if (!classTransform || ownDOMNodes.length === 0) return;

      // Else we first go through each node and mark them with a special class
      // used for filtering out all other nodes when constructing our selectors.
      // This class is then removed again before this function returns. We also
      // mark the outer node with a .transforming-root class, which can be used
      // as a substitute for '&' in the selector.
      ownDOMNodes.forEach(node => {
        node.classList.add("transforming");
      });
      newDOMNode.classList.add("transforming-root");

      // Then iterate through each an any transform instruction in
      // classTransform and carry it out.
      classTransform.values().forEach(inst => {
        // Each transform instruction (user-defined) is supposed to be of the
        // form [selector, classStr]. Extract these values.
        if (!(inst instanceof UHArray)) throw new RuntimeError(
          "Invalid class transform instruction",
          callerNode, callerEnv
        );
        let selector = inst.get(0);
        let classStr = inst.get(1).toString();

        // Then validate the selector as a complex selector (with no pseudo-
        // element).
        let isValid = false;
        if (typeof selector === "string") {
          if (selector.indexOf("/*") !== -1) isValid = false;
          let [{error}] = sassParser.parse(
            selector, "relative-complex-selector"
          );
          if (!error) isValid = true;
        }
        if (!isValid) throw new RuntimeError(
          "Invalid class transform instruction",
          callerNode, callerEnv
        );

        // Then replace any leading "&" with ".transforming-root", and add a
        // ".transforming" class selector to it at the end, and use this to
        // select a NodeList of all element to transform.
        selector = selector.replace(/^\s*&/, ".transforming-root") +
          ".transforming";
        let nodeList = newDOMNode.parentElement.querySelectorAll(selector);
        classStr.split(/\s+/).forEach(classTransformInst => {
          let [match, rmFlag, fullClassName] =
            CLASS_TRANSFORM_OUTPUT_REGEX.exec(classTransformInst);
          if (!match) throw new RuntimeError(
            "Invalid class transform instruction",
            callerNode, callerEnv
          );
          if (rmFlag) {
            nodeList.forEach(node => node.classList.remove(fullClassName));
          } else {
            nodeList.forEach(node => node.classList.add(fullClassName));
          }
        });
      });

      // And finally remove the ".transforming(-root)" classes again.
      ownDOMNodes.forEach(node => {
        node.classList.remove("transforming");
      });
      newDOMNode.classList.remove("transforming-root");
    });
  }


}

