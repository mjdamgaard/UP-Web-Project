

import scssTranspiler from "../../interpreting/SCSSTranspiler.js";
import {
  RuntimeError, ArgTypeError, forEachValue, getExtendedErrorMsg, Exception,
} from "../../interpreting/ScriptInterpreter.js";
import {scssParser} from "../../interpreting/parsing/SCSSParser.js";


const RM_SEPARATOR_REGEX = /(^|\s+)RM(\s+|$)/;






export class JSXAppStyler {

  constructor(settingsStore, appComponent, interpreter, node, env) {
    this.settingsStore = settingsStore;
    this.appSettings = settingsStore.get(appComponent, node, env);
    this.interpreter = interpreter;
    this.loadedStyleSheetIDs = new Map();
  }

  // loadStylesOfAllStaticJSXModules() fetches and applies the styles of all
  // current imported and live modules that has a '.jsx' extension.
  async loadStylesOfAllStaticJSXModules(liveModules, callerNode, callerEnv) {
    let promiseArr = [];
    liveModules.forEach((liveModule) => {
      if (liveModule.modulePath.slice(-4) === ".jsx") {
        let stylePromise = this.loadStyle(liveModule, callerNode, callerEnv);
        promiseArr.push(stylePromise);
      }
    });

    await Promise.all(promiseArr);
    return;
  }

  // loadStyle() receives a component module and uses the given module's
  // settings.styleSheets property to get a list of routes of all the style
  // sheets that the component "subscribes to," then load anyone of these that
  // hasn't been so already, namely by fetching them, transpiling them to CSS,
  // and inserting this in a style element in the document head.
  async loadStyle(componentModule, callerNode, callerEnv) {
    // First get/wait for the styleSheets of the component.
    let styleSheets = await this.settingsStore.get(
      componentModule, callerNode, callerEnv
    ).styleSheets.promise ?? {};

    // Then create a promise array that when resolved will have fetched and
    // applied all style sheets pointed to by styleSheets that has not yet been
    // loaded.
    let promiseArr = [];
    forEachValue(styleSheets, callerNode, callerEnv, (route, id) => {
      if (typeof id !== "string" || !/[a-zA-Z][a-zA-Z0-9\-]*/.test(id)) {
        throw new ArgTypeError(
          `Invalid style sheet ID: "${id}"`,
          callerNode, callerEnv
        );
      }

      // See if the style sheet is already loaded/loading, and return early if
      // so, continuing the iteration. And else, set the entry in this.
      // loadedStyleSheetIDs immediately, and start fetching and loading it.
      let isLoaded = this.loadedStyleSheetIDs.get(route);
      if (isLoaded) return;
      this.loadedStyleSheetIDs.set(route, id);

      // Push a promise to promiseArr for fetching and loading the style.
      promiseArr.push(new Promise(async (resolve) => {
        // Fetch the style sheet module and its settings in parallel.
        let settings = this.settingsStore.get(route, callerNode, callerEnv);
        let [styleSheetModule, isTrusted] = await Promise.all([
          this.interpreter.import(route, callerNode, callerEnv),
          settings.isTrusted?.promise ??
            new Promise(resolve => resolve(false))
        ]);
        let styleSheet = styleSheetModule.styleSheet;

        // Then transpile the SCSS style sheet into CSS (with some additional
        // restrictions and added transformations on top of the regular SCSS
        // semantics) and insert it into the document head. 
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
    let transpiledStyleSheet = scssTranspiler.transpile(
      styleSheet, route, id, this.loadedStyleSheetIDs, styleSheetParams,
      isTrusted, callerNode, callerEnv
    );

    // Then get or create the style element with a class of "up-style <id>".
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



  // transformClasses() is used to transform the classes of a component from
  // the original ones determined by the component to other ones, or to add
  // classes to elements, at will. This transformation is defined by a
  // 'classTransform' setting, which is a list of transform rules consisting
  // of a CSS selector on the LHS defining which elements to target, and a
  // string on the RHS of all the classes to add or remove from those elements.
  async transformClasses(
    newDOMNode, ownDOMNodes, componentModule, callerNode, callerEnv
  ) {
    try {
      return this.#transformClasses(
        newDOMNode, ownDOMNodes, componentModule, callerNode, callerEnv
      );
    } catch(err) {
      if (err instanceof Exception) {
        console.error(getExtendedErrorMsg(err));
      }
      else throw err;
    };
  }

  async #transformClasses(
    newDOMNode, ownDOMNodes, componentModule, callerNode, callerEnv
  ) {
    // Return early if ownDOMNodes is empty.
    if (ownDOMNodes.length === 0) return;

    // Add a "pending-style" class to the outer DOM node, then wait for the
    // 'classTransform' setting (which might be ready immediately).
    newDOMNode.classList.add("pending-style");
    let settings = this.settingsStore.get(
      componentModule, callerNode, callerEnv
    );
    let classTransform = await settings.classTransform.promise;
    
    // Check that classTransform is truthy and that the instance hasn't been
    // rerendered, which is done by verifying that this.domNode is still ===
    // newDOMNode. And otherwise return early.
    if (!classTransform || this.domNode !== newDOMNode) {
      newDOMNode.classList.remove("pending-style");
      return;
    }

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
    forEachValue(classTransform, callerNode, callerEnv, rule => {
      // Each transform instruction (user-defined) is supposed to be of the
      // form [selector, classStr]. Extract these values.
      if (!(rule instanceof Array)) throw new RuntimeError(
        "Invalid class transform instruction",
        callerNode, callerEnv
      );
      let [selector, classStr] = rule;

      // Then validate the selector as a complex selector (with no pseudo-
      // element).
      let isValid = false;
      if (typeof selector === "string") {
        if (selector.indexOf("/*") !== -1) isValid = false;
        let [{error}] = scssParser.parse(
          selector, "relative-complex-selector"
        );
        if (!error) isValid = true;
      }
      if (!isValid) throw new RuntimeError(
        `Invalid selector in class transform instruction: ${selector}`,
        callerNode, callerEnv
      );
      // And verify that classStr is a string.
      if (typeof classStr !== "string") throw new RuntimeError(
        `Invalid class string in class transform instruction: ${classStr}`,
        callerNode, callerEnv
      );

      // Then replace any leading "&" with ".transforming-root", and add a
      // ".transforming" class selector to it at the end, and use this to
      // select a NodeList of all element to transform.
      selector = selector.trim().replace(/^&/, ".transforming-root") +
        ".transforming";
      let nodeList = newDOMNode.parentElement.querySelectorAll(selector);
      let [addClassStr, rmClassStr] = classStr.split(RM_SEPARATOR_REGEX);
      addClassStr.split(/\s+/).forEach(addedClass => {
        if (!addedClass) return;
        nodeList.forEach(node => node.classList.add(addedClass));
      });
      rmClassStr.split(/\s+/).forEach(removedClass => {
        if (!removedClass) return;
        nodeList.forEach(node => node.classList.remove(removedClass));
      });
    });

    // And finally remove the ".transforming(-root)" classes again, as well as
    // the "pending-style" class.
    ownDOMNodes.forEach(node => {
      node.classList.remove("transforming");
    });
    newDOMNode.classList.remove("transforming-root");
    newDOMNode.classList.remove("pending-style");
    return;
  }

}
