import {
  DevFunction, JSXElement, RuntimeError
} from "../interpreting/ScriptInterpreter.js";
import {createAppSignal} from "./signals/fundamental_signals.js";



const devComponents = new Map(
  // TODO: Make some dev components (possibly in another module and then import
  // devComponents here instead).
);


// Create a JSX (React-like) app and mounting it in the index HTML page, in
// the element with an id of "up-root".
export const createJSXApp = new DevFunction(createAppSignal, function(
  {callerNode, callerEnv, interpreter}, component, props
) {
  const rootInstance = new JSXInstance(component, props);
  // ...
});



export class JSXInstance {

  constructor (key = undefined, parentInstance = undefined, componentModule) {
    this.key = key.toString();
    this.parentInstance = parentInstance;
    this.componentModule = componentModule;
    this.domNode = undefined;
    this.jsxElement = undefined;
    this.childInstances = new Map();
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
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
    interpreter, callerNode, callerEnv, props = undefined,
    replaceSelf = true, force = false, rerenderChildren = false
  ) {  
    // Return early of the props are the same as on the last render, and if not
    // forced to rerender the instance or its child instances.
    if (
      !force && !rerenderChildren && this.props !== undefined &&
      compareProps(props, this.props)
    ) {
      return this.domNode ?? this.jsxElement;
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

    // Call getDOMContent() to generate the instance's new DOM content.
    let newDOMContent = this.getDOMContent(
      jsxElement, marks, interpreter, callerNode, callerEnv
    );

    // If replaceSelf is true, replace the previous DOM content with the new
    // content in the DOM tree. If the current and the previous this.domContent
    // values are both DOM nodes, and if it's not decorated by the parent,
    // this can be done by a call to the Node.replaceWith() method. Else, call
    // up to the parent to make it rerender. (Note that this won't cause this
    // instance to rerender again, unless the parent changes the props.)
    if (replaceSelf) {
      if (
        this.domContent instanceof Node && newDOMContent instanceof Node &&
        !this.isDecorated
      ) {
        this.domContent.replaceWith(newDOMContent);
        this.domContent = newDOMContent;
      } else {
        // (Make sure to update this.domContent before calling the parent.)
        this.domContent = newDOMContent;
        this.parentInstance.render(
          interpreter, callerNode, callerEnv, undefined, undefined,
          true, true
        );
      }
    }

    // Then remove any existing child instance that wasn't marked during the
    // execution of getDOMContent().
    this.childInstances.forEach((_, key, map) => {
      if (!marks.get(key)) {
        map.delete(key);
      }
    });

    // And finally return the new DOM content.
    return newDOMContent;
  }



  getDOMContent(
    jsxElement, marks, interpreter, callerNode, callerEnv, isOuterElement = true
  ) {
    // If jsxElement is not a JSXElement instance, return a sanitized string
    // derived from JSXElement.
    if (!(jsxElement instanceof JSXElement)) {
      return sanitize(jsxElement.toString());
    }

    // If jsxElement is a fragment, first replace domNode with a list of
    // template elements, and then replace each one in a recursive call to
    // getDOMContent().
    if (jsxElement.isFragment) {
      let children = jsxElement.props.get("children") ?? new Map();
      return children.values().map(val => (
        this.getDOMContent(
          val, marks, interpreter, callerNode, callerEnv, false
        )
      ));

      // If the fragment is empty, simply insert an empty template element in
      // domNode's place.
      if (!children) {
        let emptyTemplate = document.createElement("template");
        domNode.replace(emptyTemplate);
        return [emptyTemplate];
      }
      else {
        children.forEach(child => {
          let newChildElement = this.getDOMContent(
            child, interpreter, callerNode, callerEnv, false
          );
        });
      }
    }

    // TODO: Correct this comment, and the one after, below.
    // If componentRef references an available dev component,
    // which are always
    // implemented as extensions of JSXInstance,
    // HTML element directly from the dev component
    let componentRef = jsxElement.componentRef;
    if (componentRef) {
      let jsxInstanceClass, componentModule;
      let devComponent = devComponents.get(componentRef);
      if (devComponent) {
        jsxInstanceClass = devComponent;
      } else {
        jsxInstanceClass = JSXInstance;
        componentModule = componentRef;
      }

      // ..., we first check if the childInstances to see if the child
      // component instance already exists, and if not, create a new one. In
      // both case, we also make sure to mark the childInstance as being used.
      let key = jsxElement.key;
      let entry;
      let [childInstance, mark] = entry = this.childInstances.get(key);
      if (!childInstance) {
        childInstance = new jsxInstanceClass(
          domNode, this, key, isOuterElement, componentModule
        );
        this.childInstances.set(key, [childInstance, true])
      }
      else {
        // Mark the childInstance as being used, unless already marked as such,
        // in which case throw an error. Also make sure to update the child
        // instance's isDecorated property, as this might have changed.
        if (mark) throw new RuntimeError(
          `Key "${key}" is already being used by another child component ` +
          "instance",
          jsxElement.node, jsxElement.decEnv
        );
        entry[1] = true;
        childInstance.isDecorated = isOuterElement;
      }

      // Now that we have the childInstance, we call its render() method to
      // render it.
      childInstance.render(jsxElement.props, callerNode, callerEnv);
    }

    // If the JSXElement is not a component element, update its type, and
    // update a small selection of attributes allowed, and then append all its
    // children, if any.
    else {
      // Update the tagName if needed.
      let tagName = jsxElement.tagName;
      if (domNode.tagName !== tagName) {
        let newHTMLElement = document.createElement(tagName);
        domNode.replaceWith(newHTMLElement);
        domNode = newHTMLElement;
      }

      // Update allowed selection of attributes, and throw an invalid/non-
      // implemented attribute is set. Also record the children prop for the
      // next step afterwards.
      let children = [];
      jsxElement.props.forEach((val, key) => {
        switch (key) {
          case "children" : {
            if (tagName === "br" || tagName === "hr") throw new RuntimeError(
               `Elements of type "${tagName}" cannot have children`,
              jsxElement.node, jsxElement.decEnv
            );
            if (!(children.values instanceof Function)) throw new RuntimeError(
              `Non-iterable 'children' prop was used`,
             jsxElement.node, jsxElement.decEnv
           );
            children = val.values();
          }
          case "className" : {
            if (typeof val !== "string") throw new RuntimeError(
              "Non-string value used for a className attribute",
              jsxElement.node, jsxElement.decEnv
            );
            domNode.setAttribute("class", val);
          }
          case "onclick" : {
            domNode.onclick = () => {
              interpreter.executeFunction(val, [this], callerNode, callerEnv);
            }
          }
          default: throw new RuntimeError(
            `Invalid or not-yet-implemented attribute, "${key}" for ` +
            "non-component elements",
            jsxElement.node, jsxElement.decEnv
          );
        }
      });
    }

    // Then remove all current children and replace them first with some
    // initial template nodes, which we then immediately replace again by
    // calling updateHTML() recursively.
    domNode.replaceChildren(...children.map(_ => (
      document.createElement("template")
    )));
    domNode.childNodes.forEach((childNode, ind) => {
      this.updateHTML(
        childNode, children[ind], interpreter, callerNode, callerEnv, false
      );
    });

    // Finally return the updated (and perhaps different, if the outer type
    // changed) element.
    return domNode;
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
    // ...
  });

  initState = new DevFunction(null, function(
    {callerNode, callerEnv, interpreter, thisVal},
    state
  ) {
    // ...
  });

  setState = new DevFunction(null, function(
    {callerNode, callerEnv, interpreter, thisVal},
    state
  ) {
    // ...
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



export function getExplodedArray(arr) {
  let ret = [];
  arr.forEach(val => {
    if (val instanceof Array) {
      ret = ret.concat(getExplodedArray(val));
    } else {
      ret.push(val);
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