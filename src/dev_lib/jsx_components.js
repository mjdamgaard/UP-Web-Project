
import sassTranspiler from "../interpreting/SASSTranspiler.js";
import {
  DevFunction, JSXElement, LiveModule, RuntimeError, turnImmutable,
  ArrayWrapper, ObjectWrapper, Signal, PromiseObject, StyleObject, parseString,
  passedAsMutable, getExtendedErrorMsg, TypeError, MapWrapper,
} from "../interpreting/ScriptInterpreter.js";
import {sassParser} from "../interpreting/parsing/SASSParser.js";


const CLASS_NAME_REGEX =
/^ *([a-zA-Z][a-z-A-Z0-9\-]*_[a-zA-Z][a-z-A-Z0-9\-]* *)*$/;


export const CAN_CREATE_APP_FLAG = Symbol("can_create_app");
export const IS_APP_ROOT_FLAG = Symbol("can_create_app");

export const CAN_CREATE_APP_SIGNAL = new Signal(
  "can_create_app",
  function(flagEnv) {
    flagEnv.setFlag(CAN_CREATE_APP_FLAG);
  }
);

export const WILL_CREATE_APP_SIGNAL = new Signal(
  "will_create_app",
  function(flagEnv, node, env) {
    let [wasFound] = flagEnv.getFlag(CAN_CREATE_APP_FLAG, 1);
    if (!wasFound ) throw new RuntimeError(
      "Cannot create a new the app from here",
      node, env
    );
    flagEnv.setFlag(IS_APP_ROOT_FLAG);
  }
);





// Create a JSX (React-like) app and mount it in the index HTML page, in the
// element with an id of "up-app-root".
export const createJSXApp = new DevFunction(
  {isAsync: true, initSignals: [[WILL_CREATE_APP_SIGNAL]]},
  async function(
    {callerNode, execEnv, interpreter},
    [appComponent, props, getStyle, styleParams = new ObjectWrapper()]
  ) {
    // First create an JSXAppStyler, which uses the input getStyle() and
    // styleParams to style each JSX component.
    let jsxAppStyler = new JSXAppStyler(getStyle, styleParams, interpreter);

    // Then create the app's root component instance, render it, and insert it
    // into the document.
    let rootInstance = new JSXInstance(
      appComponent, "root", undefined, callerNode, execEnv, jsxAppStyler
    );
    let rootParent = document.getElementById("up-app-root");
    let appNode = rootInstance.render(
      props, false, interpreter, callerNode, execEnv, false, true, true
    );
    rootParent.replaceChildren(appNode);

    // Also add a "pending-style" class to the app's DOM node, which is removed
    // once the style-related promise below resolves.
    appNode.classList.add("pending-style");

    // Now use the jsxAppStyler to fetch and load the styles of all statically
    // imported JSX modules (with file extensions ending in ".jsx").
    let {liveModules} = execEnv.scriptVars;
    await jsxAppStyler.loadStylesOfAllStaticJSXModules(liveModules);

    // And once the styles are ready, we can remove the "pending-style" class
    // from the app node.
    appNode.classList.remove("pending-style");
  }
);







class JSXInstance {

  constructor (
    componentModule, key = undefined, parentInstance = undefined,
    callerNode, callerEnv, jsxAppStyler = undefined,
  ) {
    if (!(componentModule instanceof LiveModule)) throw new RuntimeError(
      "JSX component needs to be an imported module namespace object",
      callerNode, callerEnv
    );
    this.componentModule = componentModule;
    this.key = `${key}`;
    this.parentInstance = parentInstance;
    this.jsxAppStyler = jsxAppStyler ?? this.parentInstance?.jsxAppStyler;
    this.jsxComponentStyler = new JSXComponentStyler(
      this.jsxAppStyler, this.componentPath
    );
    this.domNode = undefined;
    this.ownDOMNodes = undefined;
    this.isDecorated = undefined;
    this.childInstances = new Map(); // : key -> JSXInstance.
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
    this.lastCallerNode = undefined;
    this.lastCallerEnv = undefined;
    this.isDiscarded = undefined;
    this.rerenderPromise = undefined;
  }

  get componentPath() {
    return this.componentModule.componentPath;
  }
  get loadedStyleSheetIDs() {
    return this._loadedStyleSheetIDs ?? this.parent?.loadedStyleSheetIDs;
  }
  get styleParams() {
    return this._styleParams ?? this.parent?.styleParams;
  }


  render(
    props = new ObjectWrapper(), isDecorated, interpreter,
    callerNode, callerEnv, replaceSelf = true, force = false,
  ) {  
    this.isDecorated = isDecorated;
    this.lastCallerNode = callerNode;
    this.lastCallerEnv = callerEnv;

    // Return early if the props are the same as on the last render, and if the
    // instance is not forced to rerender.
    if (
      !force && this.props !== undefined && compareProps(props, this.props)
    ) {
      return this.domNode;
    }

    // Record the props. And on the first render only, initialize the state,
    // and record the refs as well (which cannot be changed by a subsequent
    // render).
    this.props = props;
    if (this.state === undefined) {
      // Initialize the state.
      this.state = this.componentModule.call(
        "getInitState", [props], callerNode, callerEnv, true
      ) ?? new ObjectWrapper();

      // And store the refs object.
      this.refs = props.get("refs") ?? new ObjectWrapper();
    }

    // Then get the component module's render() method.
    let fun = this.componentModule.get("render");
    if (!fun) throw new RuntimeError(
      "Component module is missing a render function " +
      '(absolute instance key = "' + this.getFullKey() + '")',
      callerNode, callerEnv
    );
    
    // And construct the resolve() callback that render() should call (before
    // returning) on the JSXElement to be rendered. This resolve() callback's
    // job is to get us the newDOMNode to insert in the DOM.
    let newDOMNode, ownDOMNodes = [], resolveHasBeenCalled = false;
    let resolve = new DevFunction({decEnv: callerEnv}, (
      {interpreter, callerNode, execEnv}, [jsxElement]
    ) => {
      resolveHasBeenCalled = true;

      // Initialize a marks Map to keep track of which existing child instances
      // was used or created in the render, such that instances that are no
      // longer used can be removed afterwards.
      let marks = new Map(); 
  
      // Call getDOMNode() to generate the instance's new DOM node, unless
      // render() is a dev function that returns a DOM node directly, wrapped
      // in the DOMNodeWrapper class exported below, in which case just use
      // that DOM node.
      // getDOMNode() also pushes to ownDOMNodes array argument all the non-
      // instance nodes that this instance renders. This is done solely because
      // we use this when styling the instance's node (which might change in a
      // future implementation).
      if (jsxElement instanceof DOMNodeWrapper) {
        newDOMNode = jsxElement.domNode;
      }
      else {
        newDOMNode = this.getDOMNode(
          jsxElement, marks, interpreter, callerNode, execEnv, ownDOMNodes
        );
      }
  
      // Then remove any existing child instances that wasn't marked during the
      // execution of getDOMNode().
      this.childInstances.forEach((_, key, map) => {
        if (!marks.get(key)) {
          map.get(key).isDiscarded = true;
          map.delete(key);
        }
      });
  
      // If replaceSelf is true, replace the previous DOM node with the new one
      // in the DOM tree. Also call updateDecoratingAncestors() to update the
      // this.domNode property of any potential decorating ancestor (i.e. one
      // that shares the same DOM node as this one).
      if (replaceSelf) {
        this.domNode.replaceWith(newDOMNode);
        this.domNode = newDOMNode;
        this.updateDecoratingAncestors(newDOMNode);
      }
    });

    // Also define a dispatch callback used for dispatching calls to the
    // component's action methods (any method of the component module that is
    // not called 'render' or 'getInitState') in order to change the state and
    // queue a rerender.
    let dispatch = new DispatchFunction(this, callerEnv);

    // Now call the component module's render() method, and check that resolve
    // has been called synchronously by it.
    let error;
    try {
      let inputArr = [
        resolve, props, dispatch, this.state, passedAsMutable(this.refs),
      ];
      interpreter.executeFunction(
        fun, inputArr, callerNode, callerEnv, this.componentModule
      );
    }
    catch (err) {
      error = err;
    }
    // If an error occurred, or if the resolve() callback was not called, log
    // the error with getExtendedErrorMsg(), which itself throws the error
    // again if it is unrecognized, and then return a placeholder element
    // with a "s0_failed" class. Note that the "s0_" in front means that this
    // class can be styled by the users (in particular by the style sheet that
    // getStyle() assigns the ID of "s0").
    if (error || !resolveHasBeenCalled) {
      let errorMsg = error ? getExtendedErrorMsg(error) : (
        "A JSX component's render() method did not call its resolve() " +
        "callback before returning"
      );
      console.error(errorMsg);
      let ret = document.createElement("span");
      ret.setAttribute("class", "s0_failed");
      return ret;
    }

    // Before returning the new DOM node, we also use this.jsxComponentStyler
    // to transform the class attributes of the instance in order to style it.
    this.jsxComponentStyler.transformClasses(
      newDOMNode, ownDOMNodes, callerNode, callerEnv
    );

    // Then on success, return the instance's new DOM node.
    return newDOMNode;
  }



  updateDecoratingAncestors(newDOMNode) {
    if (this.isDecorated) {
      this.parentInstance.domNode = newDOMNode;
      this.parentInstance.updateDecoratingAncestors(newDOMNode);
    }
  }



  getDOMNode(
    jsxElement, marks, interpreter, callerNode, callerEnv, ownDOMNodes,
    isOuterElement = true
  ) {
    // If jsxElement is not a JSXElement instance, return a sanitized string
    // derived from JSXElement, but throw if jsxElement is the outer element of
    // a component instance.
    if (!(jsxElement instanceof JSXElement)) {
      if (isOuterElement) throw new RuntimeError(
        "Components rendering as non-JSX values is not implemented",
        callerNode, callerEnv
      );
      return sanitize(jsxElement.toString());
    }

    // If jsxElement is a fragment, we also check against it being an outer
    // element, as fragment components are also not implemented (at least yet).
    // And if not, we render each contained JSX element/content individually,
    // and return an array of all these values, some of which are DOM nodes and
    // some of which are strings.
    if (jsxElement.isFragment) {
      let children = jsxElement.props.get("children") ?? new Map();
      return children.values().map(val => (
        this.getDOMNode(
          val, marks, interpreter, callerNode, callerEnv, ownDOMNodes, false
        )
      ));
    }

    // If componentModule is defined, render the component instance.
    let componentModule = jsxElement.componentModule;
    if (componentModule) {
      // First we check if the childInstances to see if the child component
      // instance already exists, and if not, create a new one. In both cases,
      // we also make sure to mark the childInstance as being used.
      let key = jsxElement.key;
      let childInstance = this.childInstances.get(key);
      if (
        !childInstance ||
        childInstance.componentPath !== componentModule.componentPath
      ) {
        childInstance = new JSXInstance(
          componentModule, key, this, jsxElement.node, jsxElement.decEnv
        );
        this.childInstances.set(key, childInstance);
      }
      else {
        if (marks.get(key)) throw new RuntimeError(
          `Key "${key}" is already being used by another child component ` +
          "instance",
          jsxElement.node, jsxElement.decEnv
        );
      }
      marks.set(key, true);

      // Then we call childInstance.render() to render/rerender (if its props
      // have changed) the child instance and get its DOM node, which can be
      // returned straightaway.
      return childInstance.render(
        jsxElement.props, isOuterElement, interpreter, callerNode, callerEnv,
        false
      );
    }

    // If the JSXElement is not a component element, create a new DOM node of
    // the type given by jsxElement.tagName, and then potentially add some
    // attributes and/or append some content to it.
    else {
      let tagName = jsxElement.tagName;
      let newDOMNode = document.createElement(tagName);

      // Update allowed selection of attributes, and throw an invalid/non-
      // implemented attribute is set. Also record the children prop for the
      // next step afterwards.
      let childArr = [];
      jsxElement.props.forEach((val, key) => {
        switch (key) {
          case "children" : {
            if (tagName === "br" || tagName === "hr") throw new RuntimeError(
               `Elements of type "${tagName}" cannot have children`,
              jsxElement.node, jsxElement.decEnv
            );
            if (!(childArr.values instanceof Function)) throw new RuntimeError(
              `A non-iterable 'children' prop was used`,
             jsxElement.node, jsxElement.decEnv
           );
            childArr = val.values();
            break;
          }
          case "className" : {
            let className = val.toString();
            if (!CLASS_NAME_REGEX.test(className)) throw new RuntimeError(
              `Invalid class name: "${className}" (each class name needs to ` +
              "be of the form '<id>_<name>' where both id and name are of " +
              "the form /[a-zA-Z][a-z-A-Z0-9\-]*/)",
              jsxElement.node, jsxElement.decEnv
            );
            newDOMNode.setAttribute("class", className);
            break;
          }
          case "onclick" : {
            newDOMNode.onclick = () => {
              interpreter.executeFunction(val, [this], callerNode, callerEnv);
            }
            break;
          }
          default: throw new RuntimeError(
            `Invalid or not-yet-implemented attribute, "${key}" for ` +
            "non-component elements",
            jsxElement.node, jsxElement.decEnv
          );
        }
      });

      // Then call a recursive helper method which calls getDOMNode() on any
      // and all children, and append each one to the new DOM node. And if a
      // child returns an array, it also calls itself recursively to append
      // any and all nested children inside that array (at any depth).
      this.createAndAppendChildren(
        newDOMNode, childArr, marks, interpreter, callerNode, callerEnv,
        ownDOMNodes,
      );

      // Then return the DOM node of this new element, and also push the node
      // to ownDOMNodes, which is used when styling the component instance.
      ownDOMNodes.push(newDOMNode);
      return newDOMNode;
    }
  }


  createAndAppendChildren(
    domNode, childArr, marks, interpreter, callerNode, callerEnv, ownDOMNodes
  ) {
    childArr.forEach(val => {
      if (val instanceof Array) {
        this.createAndAppendChildren(domNode, val);
      } else {
        domNode.append(this.getDOMNode(
          val, marks, interpreter, callerNode, callerEnv, ownDOMNodes, false
        ));
      }
    });
  }


  getFullKey() {
    return this.parentInstance ?
      this.parentInstance.getFullKey() + "." + this.key :
      this.key;
  }



  // dispatch() dispatches an action, either to self, to an ancestor instance,
  // or to a child instance. If receiverComponentPath is undefined, dispatch
  // to self. Else if childKey is undefined, dispatch to parent. Else dispatch
  // to the child with the key = childKey.
  dispatch(
    action, inputArr, receiverComponentPath = undefined, childKey = undefined,
    interpreter, callerNode, callerEnv
  ) {
    childKey = `${childKey}`;

    // If receiverComponentPath is undefined, dispatch to self.
    if (receiverComponentPath === undefined) {
      this.receiveDispatch(
        action, inputArr, interpreter, callerNode, callerEnv
      );
    }

    // Else if childKey is defined, dispatch to that child, but only if the
    // receiverComponentPath is a match.
    else if (childKey !== undefined) {
      let childInstance = this.childInstances.get(childKey);
      if (!childInstance) throw new RuntimeError(
        `Dispatch to a non-existing child instance of key = ${childKey}`,
        callerNode, callerEnv
      );
      if (childInstance.componentPath !== receiverComponentPath) {
        throw new RuntimeError(
          `Dispatch to a child instance with a non-matching component path, ` +
          `"${childInstance.componentPath}" !== "${receiverComponentPath}", `
          `with child key = ${childKey}`,
          callerNode, callerEnv
        );
      }
      childInstance.receiveDispatch(
        action, inputArr, interpreter, callerNode, callerEnv
      );
    }

    // Else if both optional arguments are undefined, dispatch to the nearest
    // ancestor with the given receiverComponentPath, and do nothing if the
    // instance has no ancestor of that type.
    else {
      let parentInstance = this.parentInstance;
      if (parentInstance) {
        if (parentInstance.componentPath === receiverComponentPath) {
          parentInstance.receiveDispatch(
            action, inputArr, interpreter, callerNode, callerEnv
          );
        }
        else {
          parentInstance.dispatch(
            action, inputArr, receiverComponentPath, undefined,
            interpreter, callerNode, callerEnv
          );
        }
      }
    }
  }


  // receiveDispatch() calls the appropriate method, of the same name as held
  // by the action input, of the instance's componentModule. (A rerender of the
  // component is only queued if the called action method makes a call to
  // instance.setState() inside it.)
  receiveDispatch(
    action, inputArr, interpreter, callerNode, callerEnv
  ) {
    // Throw if the user dispatches a reserved action, such as "render" or
    // "getInitState".
    if (
      action === "render" || action === "getInitState" ||
      action === "styleSheetPaths"
    ) {
      throw new RuntimeError(
        `Dispatched action cannot be the reserved identifier, ${action}`,
        callerNode, callerEnv
      );
    }

    // Get the action method, and throw if it is not defined in the component's
    // module.
    let actionMethod = this.componentModule.get(action);
    if (!actionMethod) throw new RuntimeError(
      `Dispatched action, ${action}, does not exist for component at ` +
      `${this.componentPath}`,
      callerNode, callerEnv
    );

    // Call the dispatch method to get the new state, and assign this to
    // this.state immediately.
    this.state = interpreter.executeFunction(
      actionMethod, [new JSXInstanceObject(this, callerEnv), ...inputArr],
      callerNode, callerEnv, this.componentModule
    );

  }


  queueRerender(interpreter) {
    // Unless one is already currently queued, queue a Promise (that is
    // executed on the next tick) to rerender the instance, but only if it has
    // not been discarded since then.
    if (!this.rerenderPromise) {
      this.rerenderPromise = new Promise(resolve => resolve()).then(() => {
        delete this.rerenderPromise;
        if (!this.isDiscarded) {
          // Make sure to use the same callerNode and callerEnv as on the
          // previous render, which is done in order to not increase the memory
          // for every single action (storing the function execution
          // environment of each, action as well as that of each single render).
          this.render(
            this.props, this.isDecorated, interpreter,
            this.lastCallerNode, this.lastCallerEnv, true, true
          );
        }
      });
    }
  }


}




class JSXInstanceObject {
  constructor(jsxInstance, decEnv) {
    this.jsxInstance = jsxInstance;
    this.decEnv = decEnv;
    // Note that we don't need to pass decEnv to DispatchFunction() here,
    // since this class extends ProtectedObject, which means that all method
    // calls can already only happen within the environmental call stack of
    // decEnv.
    this.dispatch = new DispatchFunction(jsxInstance);
  }

  get isConfined() {
    return true;
  }

  get(key) {
    if (key === "dispatch") {
      return this.dispatch;
    }
    else if (key === "state") {
      return this.instance.state;
    }
    else if (key === "setState") {
      return this.setState;
    }
    else if (key === "rerender") {
      return this.rerender;
    }
    else if (key === "import") {
      return this.import;
    }
    // TODO: Add more instance methods, such as a method to get bounding box
    // data, or a method to get a PromiseObject that resolves a short time
    // after the bounding box data, and similar data, is ready.
  }

  // setState() assigns to jsxInstance.state immediately, which means that the
  // state changes will be visible to all subsequently dispatched actions to
  // this instance. However, since the render() method can only the state via
  // its arguments (i.e. the 'state' argument), the state changes will not be
  // visible in the continued execution of a render() after it has dispatched
  // an action, but only be visible on a subsequent render. setState() also
  // always queues a rerender, even if the new state is equivalent to the old
  // one.
  setState = new DevFunction({}, ({interpreter}, [state]) => {
    this.jsxInstance.state = turnImmutable(state);
    this.jsxInstance.queueRerender(interpreter);
  });

  // rerender() is equivalent of calling setState() on the current state; it
  // just forces a rerender.
  rerender = new DevFunction({}, ({interpreter}) => {
    this.jsxInstance.queueRerender(interpreter);
  });

  // import() is similar to the regular import function, except it also makes
  // the app call getStyle() to get and load the style, before the returned
  // promise resolves.
  import = new DevFunction(
    {isAsync: true},
    async ({callerNode, execEnv, interpreter}, [route]) => {
      let liveModule = interpreter.import(route, callerNode, execEnv);
      if (route.slice(-4) === ".jsx") {
        await this.jsxInstance.loadStyle(liveModule);
      }
      return liveModule;
    }
  );


}



class DispatchFunction extends DevFunction {
  constructor(jsxInstance, decEnv) {
    super(
      {decEnv: decEnv},
      (
        {interpreter, callerNode, execEnv},
        action, inputArr, componentModule, childKey
      ) => {
        if (!(inputArr instanceof ArrayWrapper)) throw new RuntimeError(
          "Dispatching an action with an invalid input array",
          callerNode, execEnv
        );
        if (!(componentModule instanceof LiveModule)) {
          throw new RuntimeError(
            "Dispatching an action with an invalid receiver component",
            callerNode, execEnv
          );
        }
        let componentPath = componentModule.modulePath;
        jsxInstance.dispatch(
          action, [...inputArr], componentPath, childKey,
          interpreter, callerNode, execEnv
        );
      }
    );
  }
}






class DOMNodeWrapper {
  constructor(domNode) {
    this.domNode = domNode;
  }
}



export function compareProps(props1, props2, compareRefs = false) {
  // Get the keys, and return false immediately if the two props Maps have
  // different keys.
  let keys = props1.keys;
  let unionedKeys = [...new Set(keys.concat(props2.keys))];
  if (unionedKeys.length > keys.length) {
    return false;
  }

  // Loop through each pair of values, val1 and val2, and if both are Map
  // instances, call compareProps recursively, and if not, check that they are
  // equal to each other. Also, when compareProps() is called non-recursively,
  // with a falsy compareProps, refrain from comparing the 'refs' prop.
  let ret;
  props1.forEach((val1, key) => {
    if (!compareRefs && key === "refs") {
      return;
    }
    let val2 = props2[key];
    if (val1 !== val2) {
      if (val1 instanceof Map && val2 instanceof Map) {
        ret &&= compareProps(val1, val2, true);
      }
      else {
        ret &&= val1 === val2;
      }
    }
  });
  return ret;
}





// export class TwoWayMap {

//   constructor(entries = undefined) {
//     this.map = new Map(entries);
//     this.reverseMap = new Map(entries);
//   }

//   set(key, val) {
//     this.map.set(key, val);
//     this.reverseMap.set(val, key);
//   }

//   get(key) {
//     return this.map.get(key);
//   }

//   getKey(val) {
//     return this.reverseMap.get(val);
//   }

//   remove(key, val) {
//     this.map.remove(key);
//     this.reverseMap.remove(val);
//   }
// }





class JSXAppStyler {

  constructor(getStyle, styleParams, interpreter) {
    this.getStyle = getStyle;
    this.styleParams = styleParams;
    this.interpreter = interpreter;
    this.loadedStyleSheetIDs = new Map();
    this.classTransformPromises = new Map();
  }

  getClassTransformPromise(componentPath) {
    this.classTransformPromises.get(componentPath);
  }

  // loadStylesOfAllStaticJSXModules() fetches and apply the styles of all
  // current imported and live modules that has a '.jsx' extension.
  async loadStylesOfAllStaticJSXModules(liveModules) {
    let promiseArr = [];
    liveModules.forEach((liveModule) => {
      if (route.slice(-4) === ".jsx") {
        promiseArr.push(this.loadStyle(liveModule));
      }
    });

    await Promise.all(promiseArr);
    return;
  }

  // loadStyle() receives a live module and uses getStyle() to get a list of
  // routes of all the style sheets that the component is "subscribed to," as
  // well as the component's "class transform" used for potentially
  // transforming the class attributes set by the component's render() method.
  // It also creates a promise to said classTransform in the same process, and
  // insert this in this.classTransformPromises.
  async loadStyle(liveModule, callerNode, callerEnv) {
    let componentPath = liveModule.modulePath;
    // Fetch and load the style, creating a promise to the component's
    // classTransform.
    let classTransformPromise = new Promise(async (resolve) => {
      // First we get the "styleSpecs" output of getStyle(), which is possibly
      // a PromiseObject to a styleSpecs object, in which case wait for it and
      // unwrap it.
      let styleSpecs = this.interpreter.executeFunction(
        getStyle, [componentPath, liveModule],
        callerNode, execEnv
      );
      if (styleSpecs instanceof PromiseObject) {
        styleSpecs = await styleSpecs.promise;
      }

      // Once the styleSpecs is gotten, which is supposed to be an array
      // (wrapper) of the form [styleSheetPaths?, classTransform?], get the
      // style sheet paths/routes and load each one. Then resolve with the
      // obtained classTransform.
      let styleSheetPaths = styleSpecs.get(0);
      let classTransform = styleSpecs.get(1) ?? false;
      await this.loadStyleSheets(styleSheetPaths, callerNode, callerEnv);
      resolve(classTransform);
    });

    // Then add this promise to this.classTransformPromises, and immediately
    // wait for it to resolve, before finally resolving this function.
    this.classTransformPromises.set(componentPath, classTransformPromise);
    await classTransformPromise;
    return;
  }


  async loadStyleSheets(styleSheetPaths,callerNode, callerEnv) {
    // First create a promise array that when resolved will have fetched
    // and and applied all style sheets pointed to by styleSheetPaths that has
    // not yet been loaded.
    let promiseArr = [];
    styleSheetPaths.forEach((route, id) => {
      if (typeof id !== "string" || !/[a-zA-Z][a-zA-Z0-9\-]*/.test(id)) {
        throw new TypeError(
          `Invalid style sheet ID: "${id}"`,
          callerNode, callerEnv
        );
      }

      // If route is an ArrayWrapper, treat it as a [route, isTrusted] pair
      // instead.
      let isTrusted;
      if (route instanceof ArrayWrapper) {
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
        let styleSheet = await interpreter.import(route, node, env);
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


class JSXComponentStyler {
  constructor(jsxAppStyler, componentPath) {
    this.classTransformPromise =
      jsxAppStyler.getClassTransformPromise(componentPath);
  }

  transformClasses(newDOMNode, ownDOMNodes, callerNode, callerEnv) {
    this.classTransformPromise.then(classTransform => {
      // If classTransform is undefined, it ought to mean that the style for
      // this component has not yet been loaded, in which case throw an error.
      if (classTransform === undefined) throw new RuntimeError(
        `Style missing for JSX component at ${componentModule.modulePath}, ` +
        "possibly due to importing a JSX module dynamically using the " +
        "regular import() function rather than JSXInstanceObject.import()",
        callerNode, callerEnv
      );

      // Else check that the instance hasn't been rerendered by verifying that
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
      newDOMNode.classList.add("transforming-root")

      // Then iterate through each an any transform instruction in
      // classTransform and carry it out.
      classTransform.values().forEach(inst => {
        // Each transform instruction (user-defined) is supposed to be of the
        // form [selector, classStr]. Extract these values.
        if (!(inst instanceof ArrayWrapper)) throw new RuntimeError(
          "Invalid class transform instruction",
          callerNode, callerEnv
        );
        let selector = inst.get(0);
        let classStr = inst.get(1).toString();

        // Then validate the selector as a complex selector (with no pseudo-
        // element).
        let isValid = false;
        if (typeof selector === "string") {
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
        let classNames = classStr.split(/(\s+|\/\*([^*]|\*(?!\/))*(\*\/|$))+/);
        classNames.forEach(name => {
          if (!name) return;
          
        });
      });
    });
  }
}




// loadStyleSheets() fetches and applies the style sheet, also looking in
// styleParams for any SASS parameters (i.e. variables using the '!default'
// flag) to overwrite.
async function loadStyleSheets(
  styleSheetPaths, styleParams, interpreter, node, env
) {
  // First create a promise array that when resolved in parallel will have
  // filled out the following styleSheets object with style sheets (texts),
  // indexed by the ID assigned to them by getStyle().
  let styleSheets = {};
  let promiseArr = [];
  styleSheetPaths.entries().forEach(([id, route]) => {
    if (typeof id !== "string" || !/[a-zA-Z][a-zA-Z0-9\-]*/.test(id)) {
      throw new TypeError(
        `Invalid style sheet ID: "${id}"`,
        node, env
      );
    }

    // If route is an ArrayWrapper, treat it as a [route, isTrusted] pair
    // instead.
    let isTrusted = false;
    if (route instanceof ArrayWrapper) {
      isTrusted = route.get(1);
      route = route.get(0);
    }

    promiseArr.push(new Promise(async (resolve) => {
      let styleSheet = await interpreter.import(route, node, env);
      styleSheets[id] = [styleSheet, isTrusted];
      resolve();
    }));
  });
  await Promise.all(promiseArr);

  // Now that styleSheets has been filled out, go through each entry and
  // parse and transpile the style sheet to valid CSS, then insert it in the
  // document head.
  Object.entries(styleSheets).forEach(([id, [styleSheet, isTrusted]]) => {
    // First get or create the style element with a calls of "up-style <id>".
    let styleElement = document.querySelector(`head style.up-style.${id}`);
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.setAttribute("class", `up-style ${id}`);
      let headElement = document.querySelector(`head`);
      headElement.appendChild(styleElement);
    }

    // TODO: Transpile styleSheet, with isTrusted and styleParams.get(id) as
    // some additional inputs, and then replace the contents of styleElement
    // with the result.
  });
}





function applyAppStyle(appStyle, node, env) {
  if (!(appStyle instanceof StyleObject)) throw new RuntimeError(
    "createJSXApp(): app style input was not a StyleObject instance",
    node, env
  );
  let styleSheet = appStyle.styleSheet;
  let appStyleElement = document.getElementById("up-app-style");
  appStyleElement.replaceChildren(
    ``
  );
}


function applyComponentStyle(componentPath, style, node, env) {
  throw new RuntimeError(
    "applyComponentStyle() is not implemented yet",
    node, env
  );
}








export function sanitize(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}











