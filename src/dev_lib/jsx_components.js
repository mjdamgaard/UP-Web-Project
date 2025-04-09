import {DevFunction} from "../interpreting/ScriptInterpreter.js";
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
    component, htmlElement, instanceParent = null, key = null,
    isDecorated = false,
  ) {
    this.component = component;
    this.htmlElement = htmlElement;
    this.instanceParent = instanceParent;
    this.key = key;
    if (isDecorated) this.isDecorated = true;
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
    // instanceChildren : [child : JSXComponentInstance, mark : boolean].
    this.instanceChildren = new Map();
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


  render(props = new Map(), callerNode, callerEnv) {
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
    this.htmlElement = this.updateHTML(this.htmlElement, jsxElement, callerEnv);

    // And in case this component instance is "decorated" by its  parent, by
    // which we mean that this component is the outer element returned by the
    // parent's render() method, we also need to update this.htmlElement of
    // the parent, as well as of all decorating ancestors.
    this.updateDecoratingAncestors();
  
    // Finally, remove any existing child that wasn't marked during the
    // execution of updateHTML(), and make sure to un-mark all others again.
    this.instanceChildren.forEach((val, key, map) => {
      if (!val[1]) {
        map.delete(key);
      } else {
        val[1] = false;
      }
    });
  }


  updateDecoratingAncestors() {
    if (this.isDecorated) {
      this.instanceParent.htmlElement = this.htmlElement;
      this.instanceParent.updateDecoratingAncestors();
    }
  }



  updateHTML(htmlElement, jsxElement, callerEnv) {
    let component = jsxElement.component;
    if (component) {
      // If the component value is a reference to a dev component, get the
      // HTML element directly from the dev component
      let devComponent = devComponents(component);
      if (devComponent) {
        return devComponent.updateHTML(
          htmlElement, jsxElement, callerEnv
        );
      }

      // Else, we first check if the componentChildren to see if the 
    }
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
