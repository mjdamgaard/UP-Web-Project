import {DevFunction, RuntimeError} from "../interpreting/ScriptInterpreter.js";
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
  const rootInstance = new JSXComponentInstance(component, props);
  // ...
});



class JSXComponentInstance {

  constructor (
    component, htmlElement, parentInstance = null, key = null,
    isDecorated = false,
  ) {
    this.component = component;
    this.htmlElement = htmlElement;
    this.parentInstance = parentInstance;
    this.key = key;
    if (isDecorated) this.isDecorated = true;
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
    // childInstances : [child : JSXComponentInstance, mark : boolean].
    this.childInstances = new Map();
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


  render(props = new Map(), interpreter, callerNode, callerEnv) {
    // Return early of the props are the same as on the last render.
    if (this.props !== undefined && compareProps(props, this.props)) {
      return;
    }
    this.props = props;

    // Record the refs property on the first render, and only then. 
    if (this.refs === undefined) {
      this.refs = props.get("refs") ?? new Map();
    }

    // Call the component's render() method in order to get the props-dependent
    // JSXElement.
    let fun = this.component.get("render");
    let inputArr = [props, this];
    let jsxElement = interpreter.executeFunction(
      fun, inputArr, callerNode, callerEnv, this.component
    );

    // Call updateHTML() to update the HTMLElement held in this.htmlElement
    // according to jsxElement. We also assign the return value of said method
    // to this.htmlElement, in case the outer element was updated. 
    this.htmlElement = this.updateHTML(
      this.htmlElement, jsxElement, interpreter, callerNode, callerEnv
    );

    // And in case this component instance is "decorated" by its  parent, by
    // which we mean that this component is the outer element returned by the
    // parent's render() method, we also need to update this.htmlElement of
    // the parent, as well as of all decorating ancestors.
    this.updateDecoratingAncestors();
  
    // Finally, remove any existing child that wasn't marked during the
    // execution of updateHTML(), and make sure to un-mark all others again.
    this.childInstances.forEach((val, key, map) => {
      if (!val[1]) {
        map.delete(key);
      } else {
        val[1] = false;
      }
    });
  }


  updateDecoratingAncestors() {
    if (this.isDecorated) {
      this.parentInstance.htmlElement = this.htmlElement;
      this.parentInstance.updateDecoratingAncestors();
    }
  }



  updateHTML(
    htmlElement, jsxElement, interpreter, callerNode, callerEnv,
    isOuterElement = true
  ) {
    let component = jsxElement.component;
    if (component) {
      // If the component value is a reference to a dev component, get the
      // HTML element directly from the dev component
      let devComponent = devComponents(component);
      if (devComponent) {
        return devComponent.updateHTML(
          htmlElement, jsxElement, callerEnv, interpreter, callerNode,
          callerEnv, isOuterElement // ..?
        );
      }

      // Else, we first check if the childInstances to see if the child
      // component instance already exists, and if not, create a new one. In
      // both case, we also make sure to mark the childInstance as being used.
      let key = jsxElement.key;
      let childInstanceEntry;
      let [childInstance] = childInstanceEntry = this.childInstances.get(key);
      if (!childInstance) {
        childInstance = new JSXComponentInstance(
          component, htmlElement, this, key, isOuterElement
        );
        this.childInstances.set(key, [childInstance, true])
      }
      else {
        // Mark the childInstance as being used, and also make sure to update
        // the child instance's isDecorated property, as this might have
        // changed.
        childInstanceEntry[1] = true;
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
      if (htmlElement.tagName !== tagName) {
        let newHTMLElement = document.createElement(tagName);
        htmlElement.replaceWith(newHTMLElement);
        htmlElement = newHTMLElement;
      }

      // Update allowed selection of attributes, and throw an invalid/non-
      // implemented attribute is set. Also record the children prop for the
      // next step afterwards.
      let children;
      jsxElement.props.forEach((val, key) => {
        switch (key) {
          case "children" : {
            if (tagName === "br" || tagName === "hr") throw new RuntimeError(
               `Elements of type "${tagName}" cannot have children`,
              jsxElement.node, jsxElement.decEnv
            );
            children = val;
          }
          case "className" : {
            if (typeof val !== "string") throw new RuntimeError(
              "Non-string value used for a className attribute",
              jsxElement.node, jsxElement.decEnv
            );
            htmlElement.setAttribute("class", val);
          }
          case "onclick" : {
            htmlElement.onclick = () => {
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

    // Then remove all current children, and replace them with the rendered 
    // elements corresponding to the contents of children.

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
