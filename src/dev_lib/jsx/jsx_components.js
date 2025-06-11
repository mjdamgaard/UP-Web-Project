
import {
  DevFunction, JSXElement, LiveModule, RuntimeError, turnImmutable,
  PlainObject, Signal, getExtendedErrorMsg, getString, UserHandledObject,
  forEach, getValues, unwrapValue,
} from "../../interpreting/ScriptInterpreter.js";
import {CAN_POST_FLAG} from "../query/src/signals.js";

import {JSXAppStyler, JSXComponentStyler} from "./jsx_styling.js";



const CLASS_NAME_REGEX =
  /^ *([a-zA-Z][a-z-A-Z0-9\-]*_[a-zA-Z][a-z-A-Z0-9\-]* *)*$/;



export const CAN_CREATE_APP_FLAG = Symbol("can-create-app");

export const IS_APP_ROOT_FLAG = Symbol("id-app-root");


export const WILL_CREATE_APP_SIGNAL = new Signal(
  "will-create-app",
  function(flagEnv, node, env) {
    let [wasFound] = flagEnv.getFlag(CAN_CREATE_APP_FLAG, 1);
    if (!wasFound ) throw new RuntimeError(
      "Cannot create a new the app from here",
      node, env
    );
    flagEnv.setFlag(IS_APP_ROOT_FLAG);
  }
);

export const GET_IS_APP_ROOT_SIGNAL = new Signal(
  "get-is-app-root",
  function(flagEnv, node, env) {
    return flagEnv.getFlag(IS_APP_ROOT_FLAG, 0) ? true : false;
  }
);




// TODO: Make createJSXApp() take an argument of a function to get component
// trust (for the FlagTransmitter to use), and also make the app component get
// the URL substring after the domain as part of its props. 

// Create a JSX (React-like) app and mount it in the index HTML page, in the
// element with an id of "up-app-root".
export const createJSXApp = new DevFunction(
  {isAsync: true, minArgNum: 3, initSignals: [[WILL_CREATE_APP_SIGNAL]]},
  async function(
    {callerNode, execEnv, interpreter},
    [appComponent, props, getStyle, styleParams = new PlainObject()]
  ) {
    // First create an JSXAppStyler, which uses the input getStyle() and
    // styleParams to style each JSX component.
    let jsxAppStyler = new JSXAppStyler(getStyle, styleParams, interpreter);
    let staticStylesPromise = jsxAppStyler.loadStylesOfAllStaticJSXModules(
      execEnv.scriptVars.liveModules, callerNode, execEnv
    );

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
    await staticStylesPromise;

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
    this.key = getString(key);
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
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;
    this.isDiscarded = undefined;
    this.rerenderPromise = undefined;
  }

  get componentPath() {
    return this.componentModule.modulePath;
  }


  render(
    props = new PlainObject(), isDecorated, interpreter,
    callerNode, callerEnv, replaceSelf = true, force = false,
  ) {  
    this.isDecorated = isDecorated;

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
      // Get the initial state if the component module declares one, which is
      // done either by exporting a 'getInitState()' function, or a constant
      // object called 'initState'.
      let state;
      let getInitState = this.componentModule.$get("getInitState");
      if (getInitState) {
        state = interpreter.executeFunction(
          getInitState, [props], callerNode, callerEnv
        );
      } else {
        state = this.componentModule.$get("getInitState") ||
          new PlainObject();
      }
      this.state = state;

      // And store the refs object.
      this.refs = props["refs"] ?? {};
    }

    // Then get the component module's render() function.
    let renderFun = this.componentModule.$get("render");
    if (!renderFun) throw new RuntimeError(
      'Component module is missing a render() function at "' +
      this.componentPath + '"',
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
          map.get(key).dismount();
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

    // Now call the component module's render() function, and check that
    // resolve() has been called synchronously by it.
    let error;
    try {
      let inputArr = [
        resolve, new JSXInstanceInterface(this, callerEnv),
      ];
      interpreter.executeFunction(
        renderFun, inputArr, callerNode, callerEnv
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
        "A JSX component's render() function did not call its resolve() " +
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

  dismount() {
    this.childInstances.forEach(child => {
      child.dismount();
    });
    this.unsubscribeFromContexts();
    this.isDiscarded = true;
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
      let children = unwrapValue(jsxElement.props["children"]) ?? {};
      return getValues(children).map(val => (
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
      forEach(jsxElement.props, (val, key) => {
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
            childArr = getValues(val);
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
              interpreter.executeFunction(
                val, [new JSXInstanceInterface(this, callerEnv, "?..")],
                callerNode, callerEnv, undefined, CAN_POST_FLAG
              );
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



  // dispatch(actionKey, input?) dispatches an action to the first among
  // the instance itself and its ancestors who has an action of that key (which
  // might be a Symbol). The actions are declared by the 'actions' object
  // exported by a component module. If no ancestors has an action of a
  // matching key, dispatch() just fails silently and nothing happens.
  dispatch(actionKey, input, interpreter, callerNode, callerEnv) {
    let actions = this.componentModule.$get("actions");
    let actionFun;
    if (actions instanceof PlainObject) {
      actionFun = actions.$get(actionKey);
    }
    if (actionFun) {
      interpreter.executeFunction(
        actionFun, [new JSXInstanceInterface(this, callerEnv), input],
        callerNode, callerEnv, this.componentModule
      );
    }
    else {
      if (this.parentInstance) {
        this.parentInstance.dispatch(
          actionKey, input, interpreter, callerNode, callerEnv
        );
      }
    }

  }


  // call(instanceKey, methodKey, input?) either calls one of the instance's
  // own methods, if instanceKey is falsy or equal to "self", or otherwise
  // calls a method of the child instance with the same key. The method called
  // is the one with the key of methodKey in the 'methods' object exported by
  // the component module of the target instance.
  call(
    instanceKey, methodKey, input, interpreter, callerNode, callerEnv
  ) {
    // First get the target instance.
    let targetInstance;
    if (!instanceKey || instanceKey === "self") {
      targetInstance = this;
    }
    else {
      targetInstance = this.childInstances.get(instanceKey);
    }
    if (!targetInstance) throw new RuntimeError(
      `No child instance found with the key of "${instanceKey}"`,
      callerNode, callerEnv
    );

    // Then find and call its targeted method.
    let methods = targetInstance.componentModule.$get("methods");
    let methodFun;
    if (methods instanceof PlainObject) {
      methodFun = methods.$get(methodKey);
    }
    if (methodFun) {
      interpreter.executeFunction(
        methodFun, [new JSXInstanceInterface(targetInstance, callerEnv), input],
        callerNode, callerEnv
      );
    }
    else throw new RuntimeError(
      `Call to a non-existent method, "${methodKey}", to a component ` +
      `instance of "${targetInstance.componentPath}"`,
      callerNode, callerEnv
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
            this.callerNode, this.callerEnv, true, true
          );
        }
      });
    }
  }




  // TODO: Implement unsubscribeFromContexts(), and impl. contexts in general.
  unsubscribeFromContexts() {

  }

}







class JSXInstanceInterface extends UserHandledObject {
  constructor(jsxInstance, decEnv) {
    super("JSXInstance");
    this.jsxInstance = jsxInstance;
    this.decEnv = decEnv;

    Object.assign(this.$members, {
    /* Properties */
      "props": this.jsxInstance.props,
      "state": this.jsxInstance.state,
      "refs": this.jsxInstance.refs,
      /* Methods */
      "dispatch": this.dispatch,
      "call": this.call,
      "setState": this.setState,
      "rerender": this.rerender,
      "provideContext": this.provideContext,
      "subscribeToContext": this.subscribeToContext,
    });
  }

  // This property makes the class instances "confined" (which is also why we
  // include the decEnv property above).
  get isConfined() {
    return true;
  }


  // See the comments above for what dispatch() and call() does.
  dispatch = new DevFunction(
    {},
    ({callerNode, execEnv, interpreter}, [actionKey, input]) => {
      this.jsxInstance.dispatch(
        actionKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  call = new DevFunction(
    {},
    ({callerNode, execEnv, interpreter}, [instanceKey, methodKey, input]) => {
      this.jsxInstance.call(
        instanceKey, methodKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  // setState() assigns to jsxInstance.state immediately, which means that the
  // state changes will be visible to all subsequently dispatched actions to
  // this instance. However, since the render() function can only access the
  // state via its 'state' argument, the state changes will not be visible in
  // the continued execution of a render() after it has dispatched an action,
  // but only be visible on a subsequent rerender. Also note that setState()
  // always queues a rerender, even if the new state is equivalent to the old
  // one.
  setState = new DevFunction({}, ({interpreter}, [newState]) => {
    this.jsxInstance.state = turnImmutable(newState);
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
    {isAsync: true, minArgNum: 1},
    async ({callerNode, execEnv, interpreter}, [route]) => {
      let liveModule = interpreter.import(route, callerNode, execEnv);
      if (route.slice(-4) === ".jsx") {
        await this.jsxInstance.jsxAppStyler.loadStyle(
          liveModule, callerNode, execEnv
        );
      }
      return liveModule;
    }
  );

  // provideContext(key, val) provides a context identified by key for all its
  // descendants, meaning that they can subscribe to it an get val in return.
  // And if this instance ever calls provideContext() with a different value
  // for that key, all the subscribing instances will rerender.
  provideContext = new DevFunction({}, ({interpreter}, []) => {
    // TODO: Implement.
  });

  // subscribeToContext(contextKey) looks through the instance's ancestors and
  // finds the first one, if any, that has provided a context of that key. If
  // one is found, the value is returned, and this current instance is
  // "subscribed" to the context (if not already), meaning that if the context's
  // value changes, this instance rerenders. If no context is found of the
  // given key, no side-effect happens, and undefined is returned.
  subscribeToContext = new DevFunction({}, ({interpreter}, []) => {
    // TODO: Implement.
  });



  // TODO: Add more instance methods at some point, such as a method to get
  // bounding box data, or a method to get a PromiseObject that resolves a
  // short time after the bounding box data, and similar data, is ready.
}







class DOMNodeWrapper extends UserHandledObject {
  constructor(domNode) {
    super("DOMNode");
    this.domNode = domNode;
  }
}


// TODO: Correct and debug.
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












export function sanitize(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}











