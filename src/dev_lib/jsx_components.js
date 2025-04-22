
import {
  DevFunction, JSXElement, JSXInstance, ModuleObject, RuntimeError
} from "../interpreting/ScriptInterpreter.js";
import {createAppSignal} from "./signals/fundamental_signals.js";



// Create a JSX (React-like) app and mount it in the index HTML page, in the
// element with an id of "up-app-root".
export const createJSXApp = new DevFunction(createAppSignal, function(
  {callerNode, callerEnv, interpreter}, component, props
) {
  const rootInstance = new UserDefinedJSXInstance("root", undefined, component);
  let rootParent = document.getElementById("up-app-root");
  let appNode = rootInstance.render(
    props, false, interpreter, callerNode, callerEnv, false
  );
  rootParent.replaceChildren(appNode);
});




class UserDefinedJSXInstance extends JSXInstance {

  constructor (
    key = undefined, parentInstance = undefined, componentModule,
    callerNode, callerEnv
  ) {
    if (!(componentModule instanceof ModuleObject)) throw new RuntimeError(
      "JSX component needs to be an imported module namespace object, or a " +
      "developer component",
      callerNode, callerEnv
    );
    super();
    this.componentPath = (componentModule instanceof ModuleObject) ?
      componentModule.modulePath : undefined;
    this.key = `${key}`;
    this.parentInstance = parentInstance;
    this.componentModule = componentModule;
    this.domNode = undefined;
    this.isDecorated = undefined;
    this.childInstances = new Map(); // : key -> JSXInstance.
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
  }

  static get isJSXInstanceClass() {
    return true;
  }

  get(key) {
    if (key === "dispatch") {
      return this.dispatch;
    }
    else if (key === "state") {
      return this.state;
    }
    else if (key === "initState") {
      return this.initState;
    }
    else if (key === "setState") {
      return this.setState;
    }
  }




  render(
    props = new Map(), isDecorated, interpreter, callerNode, callerEnv,
    replaceSelf = true, force = false
  ) {  
    this.isDecorated = isDecorated;

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

    // Call the componentModule's render() function in order to get the props-
    // dependent JSX element.
    let fun = this.componentModule.get("render");
    if (!fun) throw new RuntimeError(
      "Component module is missing a render function " +
      '(absolute instance key = "' + this.getFullKey() + '")',
      callerNode, callerEnv
    );
    let inputArr = [props, this];
    let jsxElement = interpreter.executeFunction(
      fun, inputArr, callerNode, callerEnv, this.componentModule
    );

    // Initialize a marks Map to keep track of which existing child instances
    // was used or created in the render, such that instances that are no
    // longer used can be removed afterwards.
    let marks = new Map(); 

    // Call getDOMNode() to generate the instance's new DOM node.
    let newDOMNode = this.getDOMNode(
      jsxElement, marks, interpreter, callerNode, callerEnv
    );

    // Then remove any existing child instance that wasn't marked during the
    // execution of getDOMNode().
    this.childInstances.forEach((_, key, map) => {
      if (!marks.get(key)) {
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

    // And finally return the new DOM node.
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

    // If componentRef is defined, render the component instance.
    let componentRef = jsxElement.componentRef;
    if (componentRef) {
      // componentRef is either a component module object, where .get("render")
      // is supposed to return the render function of the component, or it is
      // a JS class that extends JSXInstance.
      let jsxInstanceClass, componentModule, componentPath;
      if (componentRef instanceof JSXInstance) {
        jsxInstanceClass = componentRef;
        componentPath = jsxInstanceClass.componentPath;
      }
      else {
        jsxInstanceClass = UserDefinedJSXInstance;
        componentModule = componentRef;
        componentPath = componentModule?.modulePath;
      }

      // First we check if the childInstances to see if the child component
      // instance already exists, and if not, create a new one. In both cases,
      // we also make sure to mark the childInstance as being used.
      let key = jsxElement.key;
      let childInstance = this.childInstances.get(key);
      if (!childInstance || childInstance) {
        childInstance = new jsxInstanceClass(
          key, this, componentModule, jsxElement.node, jsxElement.decEnv
        );
        this.childInstances.set(key, childInstance);
      }
      else {
        if (marks.get(key)) throw new RuntimeError(
          `Key "${key}" is already being used by another child component ` +
          "instance",
          jsxElement.node, jsxElement.decEnv
        );
        if (childInstance.componentPath !== componentPath) {
          throw new RuntimeError(
            `A component instance was replaced by an instance of a ` +
            `different component (with shared key = "${key}", ` +
            `previous component path = ${childInstance.componentPath}, ` +
            `and new component path = ${componentPath})`,
            jsxElement.node, jsxElement.decEnv
          );
        }
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




  // If receiverModule is undefined, dispatch to self. Else if childKey is
  // undefined, dispatch to parent. Else dispatch to the child with the key =
  // childKey.
  dispatch = new DevFunction(null, function(
    {callerNode, callerEnv, interpreter, thisVal},
    action, inputArr, receiverModule = undefined, childKey = undefined
  ) {
    // TODO: Make.
  });

  initState = new DevFunction(null, function(
    {callerNode, callerEnv, interpreter, thisVal},
    state
  ) {
    // TODO: Make.
  });

  setState = new DevFunction(null, function(
    {callerNode, callerEnv, interpreter, thisVal},
    state
  ) {
    // TODO: Make.
  });

}




// TODO: Change to a deep comparison, comparing leafs of primitive, Symbol, and
// Function types.
export function compareProps(props1, props2) {
  let ret = true;
  props1.forEach((val, key) => {
    if (key !== "refs" && val !== props2[key]) {
      ret = false;
    }
  });
  if (!ret) return ret;
  props2.forEach((val, key) => {
    if (key !== "refs" && val !== props1[key]) {
      ret = false;
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