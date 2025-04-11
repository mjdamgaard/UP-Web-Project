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

  constructor (
    parentInstance = undefined, componentModule = undefined
  ) {
    this.domNodes = [];
    this.parentInstance = parentInstance;
    this.componentModule = componentModule;
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
    this.childInstances = new Map();
    this.jsxElement = undefined;
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



  renderInPlace(props, interpreter, callerNode, callerEnv, force) {
    // Given that the component instance was a fragment list on the previous
    // render, first remove all existing DOM nodes that makes up the instance,
    // except for one, which can then be replaced in a renderAndReplace() call.
    let remainingNode = this.removeAllDOMNodesExceptOneAndReturnThat(
      this.domNodes
    );
    return this.renderAndReplace(
      remainingNode, props, interpreter, callerNode, callerEnv, force
    );
  }


  removeAllDOMNodesExceptOneAndReturnThat(domNodes) {
    let len = domNodes.length;
    for (let i = 1; i < len; i++) {
      this.removeAllDOMNodes(domNodes[i]);
    }
    if (domNodes[0] instanceof Array) {
      return this.removeAllDOMNodesExceptOneAndReturnThat(domNodes[0]);
    } else {
      return domNodes[0];
    }
  }

  removeAllDOMNodes(domNode) {
    if (domNodes[0] instanceof Array) {
      domNode.forEach(val => this.removeAllDOMNodes(val));
    } else {
      domNode.remove();
    }
  }


  replace(domNode) {
    let explodedDomNodeArray = getExplodedArray(this.domNodes);
    domNode.replaceWith(...explodedDomNodeArray);
  }




  renderAndReplace(
    domNode, props = new Map(), interpreter, callerNode, callerEnv,
    force = false
  ) {
    // Return early of the props are the same as on the last render.
    if (this.props !== undefined && !force && compareProps(props, this.props)) {
      this.replace(domNode);
      return this.domNodes;
    }
    this.props = props;

    // Record the refs property on the first render, and only then. 
    if (this.refs === undefined) {
      this.refs = props.get("refs") ?? new Map();
    }

    // Call the componentModule's render() method in order to get the props-
    // dependent JSXElement.
    let fun = this.componentModule.get("render");
    let inputArr = [props, this];
    let jsxElement = interpreter.executeFunction(
      fun, inputArr, callerNode, callerEnv, this.componentModule
    );

    // Initialize a marks Map to keep track of which existing child instances
    // was used or created in the render, such that instances that are no
    // longer used can be removed afterwards.
    let marks = new Map(); 

    // Call generateAndReplaceHTMLElement() to generate the new HTMLElement
    // instance from the jsxElement, and replacing domNode with it.  
    let [newDOMNodes, storeJSX] = this.generateAndReplaceHTMLElement(
      domNode, jsxElement, marks, interpreter, callerNode, callerEnv
    );

    // Rather than reassigning this.domNodes, we deliberately mute it instead
    // such that the same mutations also happens in any and all of the
    // potential fragment instance ancestors, whose this.domNoes arrays contain
    // the current instance's this.domNodes array nested within them.
    this.domNodes.length = 0;
    this.domNodes.push(...newDOMNodes);

    // We store the jsxElement conditioned on the storeJSX value, which is true
    // if an instance child has no DOM element to hold on to, and needs its
    // parent, this instance, to rerender it.
    if (storeJSX) this.jsxElement = jsxElement;

    // ...

    // Then remove all previous child nodes contained in this.domNodes
    // from the DOM except one, which is then replaced with newHTMLElement.
    // Also make sure to assign the resulting array of nodes to this.domNodes.
    let domNodes = this.domNodes, len = domNodes.length;
    for (let i = 1; i < len; i++) {
      this.removeRecursively(domNodes[i]);
    }
    if (newHTMLElement instanceof Array) {
      domNodes[0].replaceWith(...newHTMLElement);
      this.domNodes = newHTMLElement;
    } else {
      domNodes[0].replaceWith(newHTMLElement);
      this.domNodes = [newHTMLElement];
    }

    // Then, in case this component instance is held in the parent instance's
    // this.domNodes (which happens if the parent is a fragment with this
    // instance as one if the fragment children, or if this instance occupies
    // the same DOM node as the parent), update the parent as well, as well as
    // potentially its parent, and so on recursively.
    this.updateAncestors();
  
    // Finally, remove any existing child that wasn't marked during the
    // execution of updateHTML(), and make sure to un-mark all others again,
    // and then return this.domNode.
    this.childInstances.forEach((val, key, map) => {
      if (!val[1]) {
        map.delete(key);
      } else {
        val[1] = false;
      }
    });
    return this.domNodes;
  }





  generateAndReplaceHTMLElement(
    domNode, jsxElement, marks, interpreter, callerNode, callerEnv
  ) {
    // If jsxElement is not a JSXElement instance (which can only occur when
    // getHTMLElement() calls itself recursively), simply return a sanitized
    // string derived from JSXElement.
    if (!(jsxElement instanceof JSXElement)) {
      return sanitize(jsxElement.toString());
    }

    // If jsxElement is a fragment, first replace domNode with a list of
    // template elements, and then replace each one in a recursive call to
    // generateAndReplaceHTMLElement().
    if (jsxElement.isFragment) {
      let ret = [];
      let children = jsxElement.props.get("children");

      // If the fragment is empty, simply insert an empty template element in
      // domNode's place.
      if (!children) {
        let emptyTemplate = document.createElement("template");
        domNode.replace(emptyTemplate);
        return [emptyTemplate];
      }
      else {
        children.forEach(child => {
          let newChildElement = this.getHTMLElement(
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