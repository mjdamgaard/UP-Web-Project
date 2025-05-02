
import {
  DevFunction, JSXElement, ModuleObject, ProtectedObject,
  RuntimeError, turnImmutable, jsxComponentPaths
} from "../interpreting/ScriptInterpreter.js";
import {
  createAppSignal, dispatchSignal,
} from "./signals/fundamental_signals.js";



// Create a JSX (React-like) app and mount it in the index HTML page, in the
// element with an id of "up-app-root".
export const createJSXApp = new DevFunction(createAppSignal, null, function(
  {callerNode, callerEnv, interpreter}, component, props
) {
  const rootInstance = new JSXInstance(component, "root", undefined);
  let rootParent = document.getElementById("up-app-root");
  let appNode = rootInstance.render(
    props, false, interpreter, callerNode, callerEnv, false
  );
  rootParent.replaceChildren(appNode);
});




class JSXInstance {

  constructor (
    componentModule, key = undefined, parentInstance = undefined,
    callerNode, callerEnv
  ) {
    if (!(componentModule instanceof ModuleObject)) throw new RuntimeError(
      "JSX component needs to be an imported module namespace object, or a " +
      "developer component",
      callerNode, callerEnv
    );
    this.componentModule = componentModule;
    this.key = `${key}`;
    this.parentInstance = parentInstance;
    this.domNode = undefined;
    this.isDecorated = undefined;
    this.childInstances = new Map(); // : key -> JSXInstance.
    this.props = undefined;
    this.state = componentModule.get("initState");
    this.refs = undefined;
    this.lastCallerNode = undefined;
    this.lastCallerEnv = undefined;
    this.isDiscarded = undefined;
    this.rerenderPromise = undefined;
  }

  get componentPath() {
    return this.componentModule.componentPath;
  }


  render(
    props = new Map(), isDecorated, interpreter, callerNode, callerEnv,
    replaceSelf = true, force = false
  ) {  
    this.isDecorated = isDecorated;
    this.lastCallerNode = callerNode;
    this.lastCallerEnv = callerEnv;

    // Return early of the props are the same as on the last render, and if not
    // forced to rerender the instance or its child instances.
    if (
      !force && this.props !== undefined && compareProps(props, this.props)
    ) {
      return this.domNode;
    }

    // Record the props, if supplied. And on the first render only, record the
    // refs as well.
    if (props) this.props = props;
    if (this.refs === undefined) this.refs = props.get("refs") ?? new Map();

    // Get the componentModule's render() function.
    let fun = this.componentModule.get("render");
    if (!fun) throw new RuntimeError(
      "Component module is missing a render function " +
      '(absolute instance key = "' + this.getFullKey() + '")',
      callerNode, callerEnv
    );
    
    // And construct the resolve() callback that render() should call (before
    // returning) on the JSXElement to be rendered. This resolve() callback's
    // job is to get us the newDOMNode to insert in the DOM.
    let newDOMNode, resolveHasBeenCalled = false;
    let resolve = new DevFunction(undefined, callerEnv, (
      {interpreter, callerNode, callerEnv}, jsxElement
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
          jsxElement, marks, interpreter, callerNode, callerEnv
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
    // not called 'render' or 'initState') in order to change the state and
    // queue a rerender.
    let dispatch = new DispatchFunction(this, callerEnv);

    // Now call the render() function, and check that resolve has been called
    // synchronously by it.
    let inputArr = [resolve, props, dispatch, this.state];
    interpreter.executeFunction(
      fun, inputArr, callerNode, callerEnv, this.componentModule
    );
    if (!resolveHasBeenCalled) throw new RuntimeError(
      "A JSX component's render() method did not call its resolve() " +
      "callback before returning",
      fun.node, fun.decEnv, callerEnv
    );

    // Then return the instance's new DOM node.
    return newDOMNode;
  }



  updateDecoratingAncestors(newDOMNode) {
    if (this.isDecorated) {
      this.parentInstance.domNode = newDOMNode;
      this.parentInstance.updateDecoratingAncestors(newDOMNode);
    }
  }



  getDOMNode(
    jsxElement, marks, interpreter, callerNode, callerEnv, isOuterElement = true
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
          val, marks, interpreter, callerNode, callerEnv, false
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
      // have changed) the child instance and get its DOM node, which we can
      // return straightaway.
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
            newDOMNode.setAttribute("class", val.toString());
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
        newDOMNode, childArr, marks, interpreter, callerNode, callerEnv
      );

      // Finally return the new DOM node.
      return newDOMNode;
    }
  }


  createAndAppendChildren(
    domNode, childArr, marks, interpreter, callerNode, callerEnv
  ) {
    childArr.forEach(val => {
      if (val instanceof Array) {
        this.createAndAppendChildren(domNode, val);
      } else {
        domNode.append(this.getDOMNode(
          val, marks, interpreter, callerNode, callerEnv, false
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
    // "initState".
    if (action === "render" || action === "initState") throw new RuntimeError(
      `Dispatched action cannot be the reserved identifier, ${action}`,
      callerNode, callerEnv
    );

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




class JSXInstanceObject extends ProtectedObject {
  constructor(jsxInstance, decEnv) {
    super(null, decEnv);
    this.instance = jsxInstance;
    // Note that we don't need to pass decEnv to DispatchFunction() here,
    // since this class extends ProtectedObject, which means that all method
    // calls can already only happen within the environmental call stack of
    // decEnv.
    this.dispatch = new DispatchFunction(jsxInstance, false);
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
  setState = new DevFunction(null, null, (
    {interpreter},
    state
  ) => {
    this.jsxInstance.state = turnImmutable(state);
    this.jsxInstance.queueRerender(interpreter);
  });

  // Rerender is equivalent of calling setState() on the current state; it just
  // forces a rerender.
  rerender = new DevFunction(null, null, (
    {interpreter},
  ) => {
    this.jsxInstance.queueRerender(interpreter);
  });



}


class DispatchFunction extends DevFunction {
  constructor(jsxInstance, decEnv) {
    super(dispatchSignal, decEnv, (
      {interpreter, callerNode, callerEnv},
      action, inputArr, componentModule, childKey
    ) => {
      if (!(inputArr instanceof Map)) throw new RuntimeError(
        "Dispatching an action with an invalid input array",
        callerNode, callerEnv
      );
      if (!(componentModule instanceof ModuleObject)) {
        throw new RuntimeError(
          "Dispatching an action with an invalid receiver component",
          callerNode, callerEnv
        );
      }
      let componentPath = componentModule.modulePath;
      jsxInstance.dispatch(
        action, [...inputArr], componentPath, childKey,
        interpreter, callerNode, callerEnv
      );
    });
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




export function sanitize(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}