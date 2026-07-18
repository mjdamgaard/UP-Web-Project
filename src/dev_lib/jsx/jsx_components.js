
import {
  DevFunction, JSXElement, LiveJSModule, RuntimeError, getString, ObjectObject,
  forEachValue, CLEAR_FLAG, PromiseObject, logExtendedErrorAndTrace,
  OBJECT_PROTOTYPE, Environment, ARRAY_PROTOTYPE, FunctionObject, Exception,
  getStringOrSymbol, getPropertyFromObject, getPropertyFromPlainObject,
  jsonStringify, ArgTypeError, decrCompGas, getAbsolutePath, ErrorWrapper,
  CSSModule, isArray, verifyType, verifyTypes,
} from "../../interpreting/ScriptInterpreter.js";
import {
  CAN_POST_FLAG, CLIENT_TRUST_FLAG, REQUESTING_COMPONENT_FLAG
} from "../query/src/flags.js";

const NODE_ID = "1";

const CLASS_NAME_REGEX = /^ *([a-z][a-z0-9_-]* *)*$/;
export const HREF_REGEX =
  /^(\.{0,2}\/)?(([;.~a-zA-Z0-9_\-]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+(\/([;.~a-zA-Z0-9_\-]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)*)?$/;
export const HREF_REL_START_REGEX = /^(\.\.?|~~?)?\//;

export const CAN_CREATE_APP_FLAG = Symbol("can-create-app");

const globalStyleSheets = [...document.styleSheets].map(cssStyleSheet => {
  // We copy each cssStyleSheet element and return a new "constructed"
  // CSSStyleSheet object in order to avoid an error when assigning to shadow
  // roots.
  let constructedStyleSheet = new CSSStyleSheet();
  for (let rule of cssStyleSheet.cssRules) {
    constructedStyleSheet.insertRule(rule.cssText);
  }
  return constructedStyleSheet;
});





// createJSXApp() creates a JSX (React-like) app and mounts it in the index
// HTML page, in the element with the id of "up-app-root".
export const createJSXApp = new DevFunction(
  "createJSXApp",
  {isAsync: true, typeArr:["module", "object?"]},
  async function(
    {callerNode, execEnv, interpreter}, [appComponent, props = {}]
  ) {
    let {urlContext} = execEnv.globals.contexts;
    // Check if the caller is allowed to create an app from in the current
    // environment.
    if (!execEnv.getFlag(CAN_CREATE_APP_FLAG)) throw new RuntimeError(
      "Cannot create a new the app from here",
      callerNode, execEnv
    );

    // Create a new environment clearing the CAN_CREATE_APP_FLAG (as well as
    // other flags), and adding a CLIENT_TRUST_FLAG and CAN_POST_FLAG.
    let appEnv = new Environment(execEnv, undefined, {flags: [
      CLEAR_FLAG, CLIENT_TRUST_FLAG, CAN_POST_FLAG
    ]});

    // Provide some global contexts for getting user data and URL data.
    let globalContextProvisions = {};
    addUserContexts(globalContextProvisions, appEnv);
    let [segmentContextProvisions, segmentsRef, pathnameRef] =
      getURLContexts(urlContext);

    // Create the app's root component instance.
    let rootInstance = new JSXInstance(
      appComponent, "root", "Root", "", undefined, callerNode, appEnv, {
        rootInstance: undefined,
        rerenderQueue: {head: undefined, tail: undefined},
        globalContextProvisions: globalContextProvisions,
        segmentContextProvisions: segmentContextProvisions,
        segmentsRef: segmentsRef,
        pathnameRef: pathnameRef,
      }
    );

    // Then render the root instance and insert it into the document.
    let rootParent = document.getElementById("up-app-root");
    let appNode = rootInstance.render(
      props, false, interpreter, callerNode, appEnv, false, true,
    );
    rootParent.replaceChildren(appNode);

    // And set a time out to remove all expired localStorage items.
    setTimeout(() => {
      JSXInstance.removeAllExpiredLocalStorageItems();
    }, 15000);
  }
);





class JSXInstance {

  constructor (
    componentObject, key, keyPropStr = "", tagName, parentInstance = undefined,
    callerNode, callerEnv, globals = undefined
  ) {
    verifyType(componentObject, "object");
    this.componentObject = componentObject;
    this.key = key;
    this.keyPropStr = keyPropStr;
    this.tagName = tagName;
    this.parentInstance = parentInstance;
    this.globals = parentInstance?.globals ?? {
      ...globals, rootInstance: this
    };
    this.domNode = undefined;
    this.isDecorated = undefined;
    this.childInstances = new Map();
    this.props = undefined;
    this.state = {};
    this.prevState = undefined;
    this.contextProvisions = {};
    this.contextSubscriberMaps = new Map();
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;
    this.compEnv = undefined;
    this.isDiscarded = undefined;
    this.isFailed = undefined;
    this.isFirstRender = true;
    this.isInitializing = undefined;
    this.renderIsQueued = undefined;
    this.forceWhenRerendering = false;
    this.depth = (parentInstance?.depth ?? -1) + 1;
    this.actions = {};
    this.methods = {};
    this.events = {};
    this.segmentIndex = parentInstance?.nextSegmentIndex ?? 0;
    this.nextSegmentIndex = this.segmentIndex;
    this.hasHistoryState = undefined;
  }

  get componentPath() {
    return (this.componentObject instanceof LiveJSModule) ?
      this.componentObject.modulePath : undefined;
  }


  render(
    props = {}, isDecorated, interpreter, callerNode, callerEnv,
    replaceSelf = true, force = this.forceWhenRerendering,
  ) {
    decrCompGas(callerNode, callerEnv, 5);
    this.isDecorated = isDecorated;
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;
    this.renderIsQueued = false;
    this.forceWhenRerendering = false;

    // Return early if the props are the same as on the last render, and the
    // instance is not forced to rerender, or if the instance has failed before.
    if (
      this.isFailed || !force && this.props !== undefined &&
      deepCompareExceptMutableAndRef(props, this.props) &&
      deepCompareExceptMutableAndRef(this.state, this.prevState)
    ) {
      return this.domNode;
    }
    this.props = props;
    this.prevState = this.state;

    // Create a new environment for the component instance, and if the
    // 'untrusted' prop is true, query the CLIENT_TRUST_FLAG about whether the
    // parent instance was trusted. If so, remove the CLIENT_TRUST_FLAG, but
    // set the REQUESTING_COMPONENT_FLAG instead, allowing the untrusted
    // component to make requests with itself as the request origin (when it
    // is nested in a trusted component). But if the parent was not trusted,
    // simply clear both flags.
    let flags = undefined;
    if (props["untrusted"]) {
      let parentIsTrusted = callerEnv.getFlag(CLIENT_TRUST_FLAG);
      flags = !parentIsTrusted ? [CLEAR_FLAG] : [
        CLEAR_FLAG,
        CAN_POST_FLAG,
        [REQUESTING_COMPONENT_FLAG, this.componentPath],
      ];
    }
    let compEnv = this.compEnv =
      new Environment(callerEnv, undefined, {flags: flags});


    // On the first render only, initialize the state, and also initialize the
    // actions, methods, and events of the instance.
    if (this.isFirstRender) {
      // Set the actions, methods, and events.
      this.prepareActionsMethodsAndEvents(callerNode, callerEnv);

      // Initialize the state.
      this.initialize(interpreter, callerNode, compEnv, replaceSelf);
    }

    // Unsubscribe from all contexts and reset this.nextSegmentIndex.
    this.unsubscribeFromAllContexts();
    this.nextSegmentIndex = this.segmentIndex;


    // Then get the component's render() function.
    let renderFun = (this.componentObject instanceof FunctionObject) ?
      this.componentObject :
      getPropertyFromObject(this.componentObject, "render") ??
        getPropertyFromObject(this.componentObject, "default");
    if (!renderFun) {
      return this.failComponentAndGetDOMNode(
        new RuntimeError(
          `${this.tagName} component is missing a render() function`,
          callerNode, compEnv
        ),
        replaceSelf
      );
    }

    // Now call the component module's render() function, and if it throws the
    // "reinitialize" symbol, immediately reinitialize and rerender the
    // component instance.
    let jsxElement;
    try {
      jsxElement = interpreter.executeFunction(
        renderFun, [props], callerNode, compEnv,
        new JSXInstanceInterface(this)
      );
    }
    catch (err) {
      return this.failComponentAndGetDOMNode(err, replaceSelf);
    }
    this.isFirstRender = false;

    // Initialize a marks Map to keep track of which existing child instances
    // was used or created in the render, such that instances that are no
    // longer used can be removed afterwards.
    let marks = new Map();

    // If a JSXElement was successfully returned, call getDOMNode() to generate
    // the instance's new DOM node, unless render() is a dev function that
    // returns a DOM node directly, wrapped in the DOMNodeWrapper class
    // defined below, in which case just use that DOM node. 
    let newDOMNode;
    if (jsxElement instanceof DOMNodeObject) {
      newDOMNode = jsxElement.domNode;
      marks = jsxElement.marks ?? marks;
    }
    else {
      try {
        newDOMNode = this.getDOMNode(
          jsxElement, this.domNode, marks, interpreter, callerNode, compEnv,
          props
        );
      }
      catch (err) {
        return this.failComponentAndGetDOMNode(err, replaceSelf);
      }
      if (!newDOMNode?.tagName) {
        return this.failComponentAndGetDOMNode(
          new RuntimeError(
            "A JSX component must return "
          ),
          replaceSelf
        );
      }
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
    if (replaceSelf && this.domNode) {
      if (this.domNode !== newDOMNode) this.domNode.replaceWith(newDOMNode);
      this.updateDecoratingAncestors(newDOMNode);
    }
    this.domNode = newDOMNode;

    // Finally, return the instance's new DOM node.
    return newDOMNode;
  }



  initialize(interpreter, callerNode, compEnv, replaceSelf = true) {
    // this.isInitializing being true stops setState() calls from queuing
    // rerenders.
    this.isInitializing = true;

    // Get the initialize() function if the component module declares one.
    let state;
    let initialize = getPropertyFromObject(this.componentObject, "initialize");
    if (initialize) {
      try {
        state = interpreter.executeFunction(
          initialize, [this.props], callerNode, compEnv,
          new JSXInstanceInterface(this)
        );
      }
      catch (err) {
        return this.failComponentAndGetDOMNode(err, replaceSelf);
      }
    }

    // If initialize returns something defined, that is not a PromiseObject,
    // set the state to the return value.
    this.state = (state === undefined || state instanceof PromiseObject) ?
      {} : state;

    this.isInitializing = false;
  }


  failComponentAndGetDOMNode(error, replaceSelf) {
    this.isFailed = true;
    if (error instanceof Exception) {
      logExtendedErrorAndTrace(error);
      let newDOMNode = document.createElement("span");
      newDOMNode.setAttribute("class", "_failed");
      this.replaceDOMNode(newDOMNode, replaceSelf);
      return newDOMNode;
    }
    else {
      console.error(error);
    }
  }

  replaceDOMNode(newDOMNode, replaceSelf) {
    this.childInstances.forEach(child => child.dismount());
    this.childInstances = new Map();
    if (replaceSelf && this.domNode) {
      if (newDOMNode !== this.domNode) this.domNode.replaceWith(newDOMNode);
      this.updateDecoratingAncestors(newDOMNode);
    }
    this.domNode = newDOMNode;
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
    this.unsubscribeFromAllContexts();
    if (this.hasHistoryState) {
      let {popstateCallbacks} = this.callerEnv.globals.contexts.urlContext.val;
      popstateCallbacks.delete(this);
    }
    this.isDiscarded = true;
  }





  getDOMNode(
    jsxElement, curNode, marks, interpreter, callerNode, callerEnv, props,
    childInstanceNodes = undefined, isOuterElement = true
  ) {
    if (!childInstanceNodes) {
      childInstanceNodes = [...this.childInstances.values()].map(
        inst => inst.domNode
      );
    }
    let newDOMNode;

    // If jsxElement is not a JSXElement instance, let the new DOM node be a
    // string derived from JSXElement.
    let isArray = jsxElement instanceof Array;
    if (!(jsxElement instanceof JSXElement) && !isArray) {
      if (jsxElement !== undefined) {
        newDOMNode = new Text(getString(jsxElement, callerEnv));
      }
      else {
        newDOMNode = new Text();
      }
      if (isOuterElement) {
        let spanElement = document.createElement("span");
        spanElement.append(newDOMNode);
        newDOMNode = spanElement;
      }
    }

    // If jsxElement is a fragment, we render each of its children individually,
    // and return an array of all these values, some of which are DOM nodes and
    // some of which are strings. This is unless the element is an outer one,
    // in which case we wrap it in a div element.
    else if (jsxElement.isFragment || isArray) {
      let childArr = isArray ? jsxElement : jsxElement.props["children"] ?? [];
      if (!(childArr instanceof Array)) {
        childArr = [childArr];
      }
      let canReuse = curNode?.tagName === "DIV" &&
        !childInstanceNodes.includes(curNode);
      newDOMNode = canReuse ? clearAttributes(curNode) :
        document.createElement("div");
      this.replaceChildren(
        newDOMNode, childArr, marks, interpreter, callerNode, callerEnv,
        props, childInstanceNodes
      );
    }

    // If componentObject is defined, render the component instance.
    else if (jsxElement.isComponent) {
      let componentObject = jsxElement.componentObject;

      // First we check if the childInstances to see if the child component
      // instance already exists, and if not, create a new one. In both cases,
      // we also make sure to mark the childInstance as being used.
      let key = jsxElement.key || jsxElement.tagName;
      if (marks.get(key)) throw new RuntimeError(
        `Key "${key}" is already being used by another child component ` +
        "instance",
        jsxElement.node, jsxElement.decEnv
      );
      let childInstance = this.childInstances.get(key);
      let keyPropStr = JSXInstance.getKeyPropStr(
        componentObject, jsxElement.props, callerNode, callerEnv
      );
      if (!childInstance) {
        childInstance = new JSXInstance(
          componentObject, key, keyPropStr, jsxElement.tagName, this,
          jsxElement.node, jsxElement.decEnv
        );
        this.childInstances.set(key, childInstance);
      }
      else if (childInstance.componentObject !== componentObject) {
        throw new RuntimeError(
          `The same key, "${key}", was used for different components, ` +
          `first ${childInstance.tagName}, then ${jsxElement.tegName}`,
          jsxElement.node, jsxElement.decEnv
        );
      }
      else if (childInstance.segmentIndex !== this.nextSegmentIndex) {
        throw new RuntimeError(
          `The same child component, ${childInstance.tagName}, received ` +
          "different URL advancements on different renders",
          jsxElement.node, jsxElement.decEnv
        );
      }
      else if (childInstance.keyPropStr !== keyPropStr) {
        // If the keyProps have changed, which are props whose names are
        // contained in a 'keyProps' name array export, reset the child
        // instance, discarding the old one immediately.
        childInstance.dismount();
        childInstance = new JSXInstance(
          componentObject, key, keyPropStr, jsxElement.tagName, this,
          jsxElement.node, jsxElement.decEnv
        );
      }
      marks.set(key, true);

      // Then we call childInstance.render() to render/rerender (if its props
      // have changed) the child instance and get its DOM node.
      // In order to get better error reporting, we also create an intermediate
      // environment such that it will appear as if the render() function is
      // called from the JSXElement itself, as if it were a callback function.
      let childEnv = new Environment(
        jsxElement.decEnv, "function", {
          fun: {}, inputArr: [props], callerNode: callerNode,
          callerEnv: callerEnv,
        }
      );
      newDOMNode = childInstance.render(
        jsxElement.props, isOuterElement, interpreter,
        jsxElement.node, childEnv, false
      );
    }

    // If the JSXElement is not a component element, create a new DOM node of
    // the type given by jsxElement.tagName, and then potentially add some
    // attributes and/or append some content to it.
    else {
      let tagName = jsxElement.tagName;
      let canReuse = curNode?.tagName === tagName.toUpperCase() &&
        !childInstanceNodes.includes(curNode);
      newDOMNode = canReuse ? clearAttributes(curNode) :
        document.createElement(tagName);

      // Update allowed selection of attributes, and throw an invalid/non-
      // implemented attribute is set. Also record the children prop for the
      // next step afterwards.
      let childArr = [];
      let {node: jsxNode, decEnv: jsxDecEnv} = jsxElement;
      forEachValue(jsxElement.props, jsxNode, jsxDecEnv, (val, key) => {
        let eventProperty;
        switch (key) {
          case "children" : {
            if (tagName === "br" || tagName === "hr" || tagName === "wbr") {
              throw new RuntimeError(
                `Elements of type "${tagName}" cannot have children`,
                jsxNode, jsxDecEnv
              );
            }
            childArr = val ?? [];
            if (!(childArr instanceof Array)) {
              childArr = [childArr];
            }
            break;
          }

          case "className" : {
            let className = val.toString();
            if (!CLASS_NAME_REGEX.test(className)) throw new RuntimeError(
              `Invalid class name: "${className}"`,
              jsxNode, jsxDecEnv
            );
            newDOMNode.setAttribute("class", className);
            break;
          }

          /* Mouse events */
          case "onClick":
            eventProperty ??= "onclick";
          case "onDBLClick":
            eventProperty ??= "ondblclick";
          case "onMouseDown":
            eventProperty ??= "onmousedown";
          case "onMouseUp":
            eventProperty ??= "onmouseup";
          case "onMouseEnter":
            eventProperty ??= "onmouseenter";
          case "onMouseLeave":
            eventProperty ??= "onmouseleave";
          case "onMouseMove":
            eventProperty ??= "onmousemove";
            if (!val) break;
            else if (!(val instanceof FunctionObject)) throw new ArgTypeError(
              key + " event received a non-function value",
              jsxNode, jsxDecEnv
            );

            newDOMNode[eventProperty] = (event) => {
              // Execute the function object held in val, and pass some of the
              // properties of event.
              let {
                button, offsetX, offsetY, ctrlKey, altKey, shiftKey, metaKey
              } = event;
              let e = {
                button: button, offsetX: offsetX, offsetY: offsetY,
                ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey,
                metaKey: metaKey,
              };
              interpreter.executeFunctionOffSync(
                val, [e], callerNode, callerEnv, new JSXInstanceInterface(this)
              );
            };
            break;

          /* Keyboard events and the tabindex attribute */
          case "tabIndex":
            if (val == 0) {
              newDOMNode.tabIndex = 0;
            }
            else if (val !== undefined && val !== null) throw new ArgTypeError(
              "Only tab indices of 0 are allowed currently",
              jsxNode, jsxDecEnv
            );
            break;
          case "onKeyDown":
            eventProperty ??= "onkeydown";
          case "onKeyUp":
            eventProperty ??= "onkeyup";
            if (!val) break;
            else if (!(val instanceof FunctionObject)) throw new ArgTypeError(
              key + " event received a non-function value",
              jsxNode, jsxDecEnv
            );

            // Apart from the key event, also set a tabindex of 0,
            // automatically, as well as an onclick event that grabs the focus,
            // but only if the element has no other onclick event.
            newDOMNode.tabIndex = 0;
            newDOMNode.onclick ??= () => {
              newDOMNode.focus();
            };
            newDOMNode[eventProperty] = (event) => {
              // Do not allow can-post privileges for keyboard events at this
              // point. TODO: Consider allowing it specifically for the enter
              // key at some point, though.
              let {key, repeat, ctrlKey, altKey, shiftKey, metaKey} = event;
              let e = {
                key: key, repeat: repeat, ctrlKey: ctrlKey, altKey: altKey,
                shiftKey: shiftKey, metaKey: metaKey,
              };
              interpreter.executeFunctionOffSync(
                val, [e], callerNode, callerEnv, new JSXInstanceInterface(this)
              );
            };
            break;

          /* Animation events */
          case "onAnimationEnd":
            eventProperty ??= "onanimationend";
          case "onAnimationStart":
            eventProperty ??= "onanimationstart";
          case "onAnimationIteration":
            eventProperty ??= "onanimationiteration";
            if (!val) break;
            else if (!(val instanceof FunctionObject)) throw new ArgTypeError(
              key + " event received a non-function value",
              jsxNode, jsxDecEnv
            );

            newDOMNode[eventProperty] = (event) => {
              let {animationName, elapsedTime, pseudoElement} = event;
              let e = {
                animationName: animationName, elapsedTime: elapsedTime,
                pseudoElement: pseudoElement
              };
              interpreter.executeFunctionOffSync(
                val, [e], callerNode, callerEnv, new JSXInstanceInterface(this)
              );
            };
            break;

          // TODO: Add more events, and more element properties in general, if/
          // when desired.

          default: throw new RuntimeError(
            `Invalid or not-yet-implemented attribute, "${key}" for ` +
            "non-component elements",
            jsxNode, jsxDecEnv
          );
        }
      });

      // After the props have been set, check if the JSXElement styles its own
      // children, and if so, create a shadow root node to be inserted between
      // newDOMNode and its children, or reuse any existing shadow root, then
      // add the style to it. 
      let domNode = newDOMNode;
      if (jsxElement.innerStyle) {
        // Create or get the shadow root.
        let shadowRoot = newDOMNode.shadowRoot ??
          newDOMNode.attachShadow({mode: "open"});

        // Get the CSSStyleSheets from the innerStyle prop, and add the
        // document's outer style sheets to the shadow root as well.
        let styleSheetArray = this.getCSSStyleSheets(
          jsxElement.innerStyle, callerNode, callerEnv
        );
        styleSheetArray = (jsxElement.inheritGlobalStyle ?? true) ?
          [...globalStyleSheets, ...styleSheetArray] :
          styleSheetArray;
        shadowRoot.adoptedStyleSheets = styleSheetArray;

        // Change the domNode argument of replaceChildren() to the shadow root.
        domNode = shadowRoot;
      }

      // Then call a recursive helper method which calls getDOMNode() on any
      // and all children, and append each one to the new DOM node. And if a
      // child returns an array, it also calls itself recursively to append
      // any and all nested children inside that array (at any depth).
      this.replaceChildren(
        domNode, childArr, marks, interpreter, callerNode,
        callerEnv, props, childInstanceNodes
      );
    }

    // Return the DOM node of this new element.
    return newDOMNode;
  }


  replaceChildren(
    domNode, childArr, marks, interpreter, callerNode, callerEnv,
    props, childInstanceNodes = undefined
  ) {
    if (!childInstanceNodes) {
      childInstanceNodes = [...this.childInstances.values()].map(
        inst => inst.domNode
      );
    }
    let curChildArr = [...domNode.childNodes];
    let newChildArr = this.#getNewChildren(
      domNode, childArr, curChildArr, marks, interpreter, callerNode, callerEnv,
      props, childInstanceNodes
    );

    let len = Math.max(curChildArr.length, newChildArr.length);
    for (let i = 0; i < len; i++) {
      let prevChildNode = curChildArr[i];
      let newChildNode = newChildArr[i];
      if (!prevChildNode) {
        if (newChildNode) {
          domNode.append(newChildNode);
        }
      }
      else if (!newChildNode) {
        if (!newChildArr.includes(prevChildNode)) {
          prevChildNode.remove();
        }
      }
      else if (newChildNode !== prevChildNode) {
        prevChildNode.replaceWith(newChildNode);
      }
    }
  }

  #getNewChildren(
    domNode, childArr, curChildArr, marks, interpreter, callerNode, callerEnv,
    props, childInstanceNodes, offset = 0
  ) {
    let i = offset;
    return [].concat(...childArr.map(child => {
      let isArray = child instanceof Array;
      if (child?.isFragment || isArray) {
        let nestedChildArr = isArray ? child : child.props["children"] ?? [];
        if (!(nestedChildArr instanceof Array)) {
          nestedChildArr = [nestedChildArr];
        }
        let newChildren = this.#getNewChildren(
          domNode, nestedChildArr, curChildArr, marks, interpreter, callerNode,
          callerEnv, props, childInstanceNodes, i
        );
        i = i + newChildren.length;
        return newChildren;
      }
      else if (child !== undefined) {
        let newChild = this.getDOMNode(
          child, curChildArr[i], marks, interpreter, callerNode,
          callerEnv, props, childInstanceNodes, false
        );
        i++;
        return [newChild];
      }
      else {
        return [];
      }
    }));
  }



  static getKeyPropStr(componentObject, props, node, env) {
    let keyProps = getPropertyFromObject(componentObject, "keyProps");
    if (!keyProps) return "";
    let keyPropStr = "";
    forEachValue(keyProps, node, env, propName => {
      propName = getString(propName, env);
      keyPropStr = keyPropStr + jsonStringify(props[propName]);
    }, true);
    return keyPropStr;
  }



  getCSSStyleSheets(innerStyleProp, node, env) {
    let ret = [], isValid = true;
    if (innerStyleProp instanceof CSSModule) {
      ret.push(innerStyleProp.getCSSStyleSheet(node, env));
    }
    else if (isArray(innerStyleProp)) {
      forEachValue(innerStyleProp, node, env, cssModule => {
        if (cssModule instanceof CSSModule) {
          ret.push(cssModule.getCSSStyleSheet(node, env));
        }
        else {
          isValid = false;
        }
      });
    }
    else {
      isValid = false;
    }

    if (!isValid) throw new ArgTypeError(
      'The "innerStyle" attribute must be a either a CSSModule object or ' +
      'an array of such objects',
       node, env
    );
    return ret;
  }




  prepareActionsMethodsAndEvents(node, env) {
    forEachValue(
      getPropertyFromObject(this.componentObject, "actions"), node, env,
      (fun, key) => {
        key = getStringOrSymbol(key, env) || " ";
        this.actions[key] = fun;
      },
      true
    );
    forEachValue(
      getPropertyFromObject(this.componentObject, "methods"), node, env,
      keyOrAliasKeyPair => {
        if (typeof keyOrAliasKeyPair === "string") {
          let key = keyOrAliasKeyPair || " ";
          this.methods[key] = this.actions[key];
        }
        else {
          let alias = getPropertyFromObject(keyOrAliasKeyPair, "0");
          let key = getPropertyFromObject(keyOrAliasKeyPair, "1");
          alias = getStringOrSymbol(alias, env) || " ";
          key = getStringOrSymbol(key, env);
          this.methods[alias] = this.actions[key];
        }
      },
      true
    );
    forEachValue(
      getPropertyFromObject(this.componentObject, "events"), node, env,
      keyOrAliasKeyPair => {
        if (typeof keyOrAliasKeyPair === "string") {
          let key = keyOrAliasKeyPair || " ";
          this.events[key] = this.actions[key];
        }
        else {
          let alias = getPropertyFromObject(keyOrAliasKeyPair, "0");
          let key = getPropertyFromObject(keyOrAliasKeyPair, "1");
          alias = getStringOrSymbol(alias, env) || " ";
          key = getStringOrSymbol(key, env);
          this.events[alias] = this.actions[key];
        }
      },
      true
    );
  }


  // do(actionKey, input?) triggers the action of the instance with the given
  // actionKey, and with the optional second argument as the argument of the
  // action function.
  do(actionKey, input, interpreter, node, env) {
    actionKey = getStringOrSymbol(actionKey, env);
    let eventFun = getPropertyFromPlainObject(this.actions, actionKey);
    if (eventFun) {
      return interpreter.executeFunction(
        eventFun, [input], node, env, new JSXInstanceInterface(this),
      );
    }
    else throw new RuntimeError(
      `Call to a non-existent action, "${actionKey}", of ${this.tagName} ` +
      "component",
      node, env
    );
  }

  // trigger(eventKey, input?) triggers an event to the first among the
  // instance's ancestors who has an event that matches the eventKey. The
  // events are declared by the 'events' object exported by the component
  // module, which is an array of action keys or [eventKey, actionKey] pair
  // arrays (or a mix). If no ancestors has an event of a matching key, then
  // trigger() just fails silently.
  trigger(
    eventKey, input, interpreter, node, env, originScope = undefined,
    originKey = this.key
  ) {
    if (this.isDiscarded) return;
    originScope ??= env.getFlag(REQUESTING_COMPONENT_FLAG);
    if (!this.parentInstance) return;
    let events = this.parentInstance.events;
    eventKey = getStringOrSymbol(eventKey, env);
    let eventFun = getPropertyFromPlainObject(events, eventKey);
    if (eventFun) {
      let childKey = this.key;
      let [clientTrust, reqCompPath] = this.parentInstance.compEnv.getFlags([
        CLIENT_TRUST_FLAG, REQUESTING_COMPONENT_FLAG
      ]);
      return interpreter.executeFunction(
        eventFun, [input, childKey, originScope, originKey],
        node, env, new JSXInstanceInterface(this.parentInstance), [
          CLEAR_FLAG, CAN_POST_FLAG,
          [CLIENT_TRUST_FLAG, clientTrust],
          [REQUESTING_COMPONENT_FLAG, reqCompPath]
        ],
      );
    }
    else {
      return this.parentInstance.trigger(
        eventKey, input, interpreter, node, env, originScope, originKey
      );
    }

  }

  // call(instanceKey, methodKey, input?) calls the method of the given
  // methodKey on the the child instance of the given instanceKey. The methods
  // of an instance is declared by the 'methods' object exported by the
  // component module. As for the events, the methods are defined by an array
  // of action keys, or alias--actionKey pairs, such that all methods are
  // redirected to an action.
  call(
    instanceKey, methodKey, input, interpreter, node, env
  ) {
    instanceKey = getStringOrSymbol(instanceKey, env);

    // First get the targeted child instance.
    let targetInstance = this.childInstances.get(instanceKey);
    if (!targetInstance) throw new RuntimeError(
      `No child instance found with the key of "${instanceKey}"`,
      node, env
    );

    // Then find and call its targeted method.
    let methods = targetInstance.methods;
    methodKey = getStringOrSymbol(methodKey, env);
    let methodFun = getPropertyFromPlainObject(methods, methodKey);
    if (methodFun) {
      let [clientTrust, reqCompPath] = targetInstance.compEnv.getFlags([
        CLIENT_TRUST_FLAG, REQUESTING_COMPONENT_FLAG
      ]);
      return interpreter.executeFunction(
        methodFun, [input], node, env,
        new JSXInstanceInterface(targetInstance), [
          CLEAR_FLAG, CAN_POST_FLAG,
          [CLIENT_TRUST_FLAG, clientTrust],
          [REQUESTING_COMPONENT_FLAG, reqCompPath]
        ],
      );
    }
    else throw new RuntimeError(
      `Call to a non-existent method, "${methodKey}", of ${this.tagName} ` +
      "component",
      node, env
    );
  }




  queueRerender(force = true) {
    this.forceWhenRerendering ||= force;
    if (this.renderIsQueued || this.isInitializing) {
      return;
    }
    this.renderIsQueued = true;

    // Create the callback to add to the rerender queue.
    let rerenderCallback = () => {
      let {interpreter} = this.callerEnv.globals;
      if (!this.isDiscarded) {
        // Make sure to use the same callerNode and callerEnv as on the
        // previous render, which is done in order to not increase the memory
        // for every single triggered event or call.
        this.render(
          this.props, this.isDecorated, interpreter,
          this.callerNode, this.callerEnv, true, this.forceWhenRerendering
        );
      }
    }

    // Queue the rerender callback at the last place in the queue where
    // this.depth is still greater than or equal to those of the entries before
    // it in the queue.
    let ownDepth = this.depth;
    let nextEntry = this.globals.rerenderQueue;
    if (!nextEntry.head) {
      nextEntry.head = {depth: ownDepth, callback: rerenderCallback};
    }
    else {
      let prevEntry;
      while (nextEntry.tail?.head?.depth <= ownDepth) {
        prevEntry = nextEntry;
        nextEntry = nextEntry.tail;
      }
      let newEntry = {
        head: {depth: ownDepth, callback: rerenderCallback},
        tail: prevEntry?.tail
      };
      if (prevEntry) {
        prevEntry.tail = newEntry;
      }
      else {
        this.globals.rerenderQueue = newEntry;
      }
    }

    // Then queue a callback to run on the next tick of the event loop, which
    // goes through every entry of the rerender queue, dequeues it and calls
    // its rerender callback, and takes care that each callback might queue new
    // entries itself.
    Promise.resolve().then(() => {
      let nextHead, globals = this.globals;
      while (nextHead = globals.rerenderQueue.head) {
        globals.rerenderQueue =
          globals.rerenderQueue.tail ?? {head: undefined, tail: undefined};
        nextHead.callback();
      }
    });
  }




  static createContextProvision(val) {
    return {subscribers: new Map(), context: val};
  }

  static updateContextProvision(contextProvision, val, force = false) {
    let {context: prevVal, subscribers} = contextProvision;
    contextProvision.context = val;
    if (
      subscribers.size > 0 &&
      (force || !deepCompareExceptMutableAndRef(val, prevVal))
    ) {
      subscribers.forEach((_, jsxInstance) => {
        jsxInstance.queueRerender();
      });
    }
  }

  subscribeToContext(contextProvision, ignore = false) {
    if (!ignore) {
      let subscriberMap = contextProvision.subscribers;
      subscriberMap.set(this, true);
      this.contextSubscriberMaps.set(subscriberMap, true);
    } else {
      let subscriberMap = contextProvision.subscribers;
      subscriberMap.delete(this);
      this.contextSubscriberMaps.delete(subscriberMap);
    }
    return contextProvision.context;
  }

  unsubscribeFromContext(contextProvision) {
    let subscriberMap = contextProvision.subscribers;
    subscriberMap.delete(this);
    this.contextSubscriberMaps.delete(subscriberMap);
  }

  unsubscribeFromAllContexts() {
    this.contextSubscriberMaps.forEach((_, subscriberMap) => {
      subscriberMap.delete(this);
    });
    this.contextSubscriberMaps.clear();
  }


  setContext(key, val, force = false) {
    let contextProvision = this.contextProvisions[key];
    if (!contextProvision) {
      this.contextProvisions[key] = JSXInstance.createContextProvision(val);
    }
    else {
      JSXInstance.updateContextProvision(contextProvision, key, val, force);
    }
  }

  getContext(key, ignore = false) {
    let {parentInstance, globals} = this;
    let contextProvisions =
      parentInstance?.contextProvisions ?? globals.globalContextProvisions;
    while (contextProvisions) {
      let contextProvision = contextProvisions[key];
      if (contextProvision) {
        return this.subscribeToContext(
          this, contextProvision, ignore
        );
      }
      ({parentInstance, globals} = parentInstance ?? {});
      contextProvisions =
        parentInstance?.contextProvisions ?? globals?.globalContextProvisions;
    }
  }

  getOwnContext(key) {
    let contextProvisions = this.contextProvisions;
    if (contextProvisions) {
      return contextProvisions[key].context;
    }
  }


  reset(interpreter, node, env) {
    this.initialize(interpreter, node, env);
    this.queueRerender(true);
  }


  canGrabFocus() {
    let focusedNode = document.activeElement;
    return !(focusedNode && focusedNode.classList.contains("locked-focus"));
  }


  /* URL-related methods */

  advanceURL(increment = 1) {
    this.nextSegmentIndex += increment;
  }

  getSegments(start = 0, end = undefined) {
    let {segmentsRef, segmentContextProvisions} = this.globals;
    let segments = segmentsRef[0];
    let firstInd = this.segmentIndex + start;
    let lastInd = (end === undefined || end < 0) ?
      segments.length - 1 + (end ?? 0) :
      this.segmentIndex + end - 1;
    let ret = segments.slice(firstInd, lastInd);
    for (let i = firstInd; i <= lastInd; i++) {
      this.subscribeToContext(segmentContextProvisions[i]);
    }
    return ret;
  }

  // unsubscribeFromAllSegments() {
  //   let {nextSegmentIndex, globals: {segmentContextProvisions}} = this;
  //   if (nextSegmentIndex > this.segmentIndex) {
  //     for (let i = this.segmentIndex; i <= nextSegmentIndex; i++) {
  //       this.unsubscribeFromContext(segmentContextProvisions[i]);
  //     }
  //   }
  // }


  pushOrReplaceURLAndState(
    url, state = null, copyOtherStates = false, doReplace,
    triggerPopstate = true, signal = undefined, callerNode, execEnv
  ) {
    // Transform the url argument if it is a relative path. Here we also
    // extend the relative path syntax to include either "~/", or "~~/", or a
    // sequence of "~~/"'s, at the start, where "~/" goes up to the nearest
    // point in the URL that was "advanced" to by an advanceURL() call, which
    // can include the current point as well (meaning the "~/" won't subtract
    // from the URL), and "~~/" goes up to the second-nearest point (again
    // where we include the current position as potential "nearest point"). In
    // other wards, "~/" and "~~/" works very similarly to "./" and "../", only
    // where whole segment groups, defined by advanceURL() calls, are skipped
    // at once, rather than only single segments. 
    let pathname = this.getValidatedPathname(url, callerNode, execEnv);

    // And sanitize state by calling jsonStringify and then parsing it back.
    state = JSON.parse(jsonStringify(state));

    // If copyOtherStates is true, add a new item to the existing history.state,
    // and else set and keep only that item in the new state.
    let {urlContext} = execEnv.globals.contexts;
    let prevURLData = urlContext.val;
    let {popstateCallbacks, state: prevState, pathname: prevPathname} =
      prevURLData;
    prevState ??= {};
    let itemKey = this.getItemKey("");
    let newState = copyOtherStates ? {...prevState, [itemKey]: state} :
      {[itemKey]: state};

    // Now call window.history.pushState()/replaceState().
    let funName = doReplace ? "replaceState" : "pushState";
    try {
      window.history[funName](newState, "", pathname);
    } catch (_) {
      console.warn(JSXInstance.getCacheExceededWarning("history"));
    }

    // And finally also update the urlContext, and if triggerPopstate is true,
    // call all popstateCallbacks, simulating a "popstate" event, but
    // potentially with an added signal argument to the callback.
    let newURLData = {
      pathname: pathname,
      segments: pathname.replace(/^\//, "").replace(/\/$/, "").split("/"),
      state: newState,
      popstateCallbacks: popstateCallbacks,
    };
    urlContext.setVal(newURLData);
    if (triggerPopstate) {
      popstateCallbacks.forEach(
        callback => callback(newURLData, prevURLData, signal)
      );
    }
  }


  getValidatedPathname(url, node, env) {
      let {globals: {pathnameRef: [prevPathname]}, segmentIndex} = this;

    // Prepend './' to the url if it doesn't start with "/", "./", "~/", etc.
    if (!HREF_REL_START_REGEX.test(url)) url = './' + url;

    // If if it starts with (~/)+, prepend the rest to "/" + segments-
    // .slice(0, this.segmentIndex + 1).
    if (url.substring(0, 2) === "~/") {
      do {
        url = url.substring(2);
      } while (url.substring(0, 2) === "~/");
      url = prevPathname + "/" + url;
    }

    // Else if the url start with a number of  "~~/"'s, go up the ancestor
    // instances until that number of ancestor instances have had a different
    // segmentIndex, and then use the last segmentIndex that was reached.
    if (url.substring(0, 3) === "~~/") {
      let segmentIndex, parentInstance = this.parentInstance;
      do {
        while (parentInstance?.segmentIndex === segmentIndex) {
          parentInstance = parentInstance.parentInstance;
        }
        if (!parentInstance) throw new RuntimeError(
          'Relative URL using "~~/" goes beyond the start of the current URL',
          node, env
        );
        segmentIndex = parentInstance.segmentIndex;
        url = url.substring(3);
      } while (url.substring(0, 3) === "~~/");
      url = prevPathname + "/" + url;
    }

    // Then call getAbsolutePath() to handle any "./" and "../" segments.
    let pathname = getAbsolutePath(prevPathname, url, node, env);
    pathname = pathname.replace(/\/$/, "");

    // Finally validate pathname before returning it.
    this.validatePathname(pathname, node, env);
    return pathname;
  }


  validatePathname(pathname, node, env) {
    // Validate url, and prepend './' to it if doesn't start with /.?.?\//.
    if (!HREF_REGEX.test(pathname)) throw new ArgTypeError(
      "Invalid URL: " + pathname,
      node, env
    );
  }

  static getCacheExceededWarning = (type) => (
    `A ${type} state failed to update since the maximum size was exceeded.`
  );



  getFullInstanceKey() {
    let ret = "";
    this.forEachAncestor(true, instance => {
      ret = ret + JSON.stringify(instance.key) + instance.keyPropStr;
    });
    return ret;
  }

  getItemKey(key) {
    return "jsx-" + this.getFullInstanceKey() + "-" + JSON.stringify(key);
  }

  forEachAncestor(includeSef, callback, indRef = [0]) {
    let {parentInstance} = this;
    if (parentInstance) {
      parentInstance.forEachAncestor(true, callback, indRef);
    }
    if (includeSef) {
      callback(this, indRef[0]++);
    }
  }


  setLocalStorageItem(key, val, expireDelay = 604800000) {
    let itemKey = this.getItemKey(key);
    try {
      JSXInstance.setExpireTime(itemKey, expireDelay);
      localStorage.setItem(itemKey, val);
    }
    catch (_) {
      console.warn("Failed to set local storage item");
    }
  }

  getLocalStorageItem(key, expireDelay = undefined) {
    let itemKey = this.getItemKey(key);
    let ret = localStorage.getItem(itemKey);
    if (expireDelay !== undefined) {
      try {
        JSXInstance.setExpireTime(itemKey, expireDelay);
      }
      catch (_) {
        console.warn("Failed to update local storage item expiration time");
      }
    }
    return ret;
  }

  removeLocalStorageItem(key) {
    let itemKey = this.getItemKey(key);
    let ret = localStorage.removeItem(itemKey);
    localStorage.removeItem(itemKey + "-expTime");
  }

  static setExpireTime(itemKey, expireDelay) {
    let expireTime = Date.now() + Math.min(expireDelay, 604800000);
    localStorage.setItem(itemKey + "-expTime", expireTime);
  }

  static removeAllExpiredLocalStorageItems() {
    let now = Date.now();
    let len = localStorage.length;
    for (let i = 0; i < len; i++) {
      let key = localStorage.key(i);
      if (key.slice(0, 4) === "jsx-" && key.slice(-8) === "-expTime") {
        let expTime = parseInt(localStorage.getItem(key));
        if (expTime < now) {
          localStorage.removeItem(key.slice(0, -8));
          localStorage.removeItem(key);
        }
      }
    }
  }


  setSessionStorageItem(key, val) {
    let itemKey = this.getItemKey(key);
    try {
      sessionStorage.setItem(itemKey, val);
    }
    catch (_) {
      console.warn("Failed to set session storage item");
    }
  }

  getSessionStorageItem(key) {
    let itemKey = this.getItemKey(key);
    return sessionStorage.getItem(itemKey);
  }

  removeSessionStorageItem(key) {
    let itemKey = this.getItemKey(key);
    sessionStorage.removeItem(itemKey);
  }


  getHistoryState(onChanceFun = undefined, interpreter, callerNode, execEnv) {
    let itemKey = this.getItemKey("");
    let {state, popstateCallbacks} = execEnv.globals.contexts.urlContext.val;
    if (onChanceFun) {
      this.hasHistoryState = true;
      popstateCallbacks.set(
        this, ({state: newState}, {state: prevState}, signal) => {
          newState ??= {}; prevState ??= {};
          let newInstanceState = newState[itemKey];
          let prevInstanceState = prevState[itemKey];
          if (!deepCompare(newInstanceState, prevInstanceState)) {
            interpreter.executeFunctionOffSync(
              onChanceFun, [newInstanceState, prevInstanceState, signal],
              callerNode, execEnv, new JSXInstanceInterface(this)
            );
          }
        }
      );
    }
    return state && state[itemKey];
  }

  setHistoryState(newInstanceState) {
    newInstanceState = JSON.parse(jsonStringify(newInstanceState));
    let itemKey = this.getItemKey("");
    let {state, pathname} = this.callerEnv.globals.contexts.urlContext.val;
    let newState = {...state, [itemKey]: newInstanceState};
    try {
      window.history.replaceState(newState, "", pathname);
    } catch (_) {
      console.warn(JSXInstance.getCacheExceededWarning("history"));
    }
  }


}







export class JSXInstanceInterface extends ObjectObject {
  constructor(jsxInstance) {
    super("JSXInstance");
    this.jsxInstance = jsxInstance;

    Object.assign(this.members, {
      /* Properties */
      "props": this.jsxInstance.props,
      "state": this.jsxInstance.state ?? {},
      "component": this.jsxInstance.componentObject,
      "isFirstRender": this.jsxInstance.isFirstRender,
      /* Methods */
      "setState": this.setState,
      "do": this.do,
      "trigger": this.trigger,
      "call": this.call,
      "doAfterRender": this.doAfterRender,
      "getCurrent": this.getCurrent,
      "rerender": this.rerender,
      "setContext": this.setContext,
      "getContext": this.getContext,
      "getOwnContext": this.getOwnContext,
      "reset": this.reset,
      "advanceURL": this.advanceURL,
      "getSegments": this.getSegments,
      "getFirstSegment": this.getFirstSegment,
      "getPath": this.getPath,
      "pushURL": this.pushURL,
      "replaceURL": this.replaceURL,
      "back": this.back,
      "forward": this.forward,
      "go": this.go,
      "getLocalStorageItem": this.getLocalStorageItem,
      "setLocalStorageItem": this.setLocalStorageItem,
      "removeLocalStorageItem": this.removeLocalStorageItem,
      "getSessionStorageItem": this.getSessionStorageItem,
      "setSessionStorageItem": this.setSessionStorageItem,
      "removeSessionStorageItem": this.removeSessionStorageItem,
      "getHistoryState": this.getHistoryState,
      "setHistoryState": this.setHistoryState,
      "canGrabFocus": this.canGrabFocus,
      "getBoundingClientRect": this.getBoundingClientRect,
      "getScrollData": this.getScrollData,
      "blur": this.blur,
      "delay": this.delay,
      "loop": this.loop,
    });
  }

  // setState() assigns to jsxInstance.state immediately, but will not reassign
  // this.state. However, whenever an action is called, method, or event is
  // called/triggered, the JSXInstanceInterface object bound to 'this' for the
  // corresponding action will always be a fresh instance with an (initially)
  // up-to-date this.state. And if wanting to access the current state after it
  // has potentially been changed, you can always call this.getCurrent().state
  // rather than this.state.
  setState = new DevFunction(
    "setState", {}, (
      {callerNode, execEnv, interpreter}, [newStateOrCallback, force = false]
    ) => {
      let newState = newStateOrCallback;
      if (newState instanceof FunctionObject) {
        newState = interpreter.executeFunction(
          newStateOrCallback, [this.jsxInstance.state], callerNode, execEnv
        );
      }
      this.jsxInstance.state = newState;
      this.jsxInstance.queueRerender(force);
    }
  );


  // See the comments above for what do(), trigger(), and call() does.
  do = new DevFunction(
    "do", {},
    ({callerNode, execEnv, interpreter}, [actionKey, input]) => {
      return this.jsxInstance.do(
        actionKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  trigger = new DevFunction(
    "trigger", {},
    ({callerNode, execEnv, interpreter}, [eventKey, input]) => {
      return this.jsxInstance.trigger(
        eventKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  call = new DevFunction(
    "call", {},
    ({callerNode, execEnv, interpreter}, [instanceKey, methodKey, input]) => {
      return this.jsxInstance.call(
        instanceKey, methodKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  // doAfterRender() simply waits to a subsequent tick of the JS event loop
  // before calling do(). And it therefore also doesn't return anything.
  doAfterRender = new DevFunction(
    "doAfterRender", {},
    ({callerNode, execEnv, interpreter}, [actionKey, input]) => {
      setTimeout(
        () => this.jsxInstance.do(
          actionKey, input, interpreter, callerNode, execEnv
        ),
        0
      );
    }
  );

  // getCurrent() returns a copy of this JSXInstanceInterface, only with all
  // the properties (like props and state) updated to the current ones.
  getCurrent = new DevFunction(
    "getCurrent", {}, () => {
      return new JSXInstanceInterface(this.jsxInstance);
    }
  );

  // rerender() is equivalent of calling setState() on the current state; it
  // just forces a rerender.
  rerender = new DevFunction("rerender", {}, (_, [force = true]) => {
    this.jsxInstance.queueRerender(force ? true : false);
  });


  // setContext(key, context, force = false) provides a context identified by
  // key for all its descendants, meaning that they can subscribe to it an get
  // the context value in return. And if this instance ever calls setContext()
  // with a different value for that key, or with the force argument set to
  // true, all the subscribing instances will rerender.
  setContext = new DevFunction(
    "setContext", {typeArr: ["object key|array", "any?", "any?"]},
    (_, [key, context, force = false]) => {
      this.jsxInstance.setContext(key, context, force);
    },
  );

  // getContext(key, ignore = false) looks through the instance's ancestors and
  // finds the first one, if any, that has provided a context of that key. If
  // one is found, the value is returned, and unless the ignore argument is
  // true, this current instance is subscribed to the context (if not already),
  // meaning that if the context's value changes, this instance rerenders. If
  // no context is found of the given key, no side-effect happens, and
  // undefined is returned.
  getContext = new DevFunction(
    "getContext", {typeArr: ["object key", "any?"]},
    (_, [key, ignore = false]) => {
      return this.jsxInstance.getContext(key, ignore);
    }
  );

  // getOwnContext(key) the instance's own context of the given key.
  getOwnContext = new DevFunction(
    "getOwnContext", {typeArr: ["object key"]}, (_, [key]) => {
      return this.jsxInstance.getOwnContext(key);
    }
  );


  // reset() reinitializes the state and rerenders the instance. 
  reset = new DevFunction(
    "reset", {}, ({interpreter, callerNode, execEnv}, []) => {
      this.jsxInstance.reset(interpreter, callerNode, execEnv);
    }
  );


  // advanceURL() is used to advance the URL a number of segments, which
  // changes the segments the child instances get by calling getFirstSegment()
  // or getSegments(). 
  advanceURL = new DevFunction(
    "advanceURL", {typeArr: ["integer unsigned?"]}, (_, [increment = 1]) => {
      this.jsxInstance.advanceURL(increment);
    }
  );

  // getSegments(start, end?) returns an array of URL segments starting from
  // the point that the ancestor instances have advanced the URL to, plus the
  // start argument, and ending in the segment specified by the end argument,
  // which can also be undefined or a negative number, similar to how Array-
  // .slice() works. And the method also subscribes the instance to the
  // contexts of the returned segments, such that it updates automatically
  // when they do.
  getSegments = new DevFunction(
    "getSegments", {typeArr: ["integer unsigned?", "integer unsigned?"]},
    (_, [start = 0, end = undefined]) => {
      this.jsxInstance.getSegments(start, end);
    }
  );

  // getFirstSegment() is similar to calling this.getSegments(0, 1)[0].
  getFirstSegment = new DevFunction("getFirstSegment", {}, () => {
    let [firstSegment] = this.jsxInstance.getSegments(0, 1);
    return firstSegment;
  });

  // getFirstSegment() is similar to "/" + join(this.getSegments(), "/").
  getPath = new DevFunction("getPath", {}, () => {
    return "/" + this.jsxInstance.getSegments().join("/");
  });


  pushURL = new DevFunction(
    "pushURL", {typeArr: ["string", "any?", "any?", "any?"]},
    ({callerNode, execEnv}, [
      url = 0, state = null, copyOtherStates = false, signal = undefined
    ]) => {
      this.jsxInstance.pushOrReplaceURLAndState(
        url, state, copyOtherStates, false, true, signal, callerNode, execEnv
      );
    }
  );

  replaceURL = new DevFunction(
    "replaceURL", {typeArr: ["string", "any?", "any?", "any?"]},
    ({callerNode, execEnv}, [
      url = 0, state = null, copyOtherStates = false, signal = undefined
    ]) => {
      this.jsxInstance.pushOrReplaceURLAndState(
        url, state, copyOtherStates, true, true, signal, callerNode, execEnv
      );
    }
  );

  back = new DevFunction("back", {}, () => {
    window.history.back();
  });
  forward = new DevFunction("forward", {}, () => {
    window.history.forward();
  });
  go = new DevFunction("go", {typeArr: ["integer"]}, (_, [delta]) => {
    window.history.go(delta);
  });


  getLocalStorageItem = new DevFunction(
    "getLocalStorageItem", {typeArr: ["string", "positive integer?"]},
    (_, [key, expireDelay = 604800000]) => {
      return this.jsxInstance.getLocalStorageItem(key, expireDelay);
    }
  );
  setLocalStorageItem = new DevFunction(
    "setLocalStorageItem", {typeArr: ["string", "string", "positive integer?"]},
    (_, [key, val, expireDelay = 604800000]) => {
      return this.jsxInstance.setLocalStorageItem(key, val, expireDelay);
    }
  );
  removeLocalStorageItem = new DevFunction(
    "removeLocalStorageItem", {typeArr: ["string"]}, (_, [key]) => {
      return this.jsxInstance.removeLocalStorageItem(key);
    }
  );

  getSessionStorageItem = new DevFunction(
    "getSessionStorageItem", {typeArr: ["string"]}, (_, [key]) => {
      return this.jsxInstance.getSessionStorageItem(key);
    }
  );
  setSessionStorageItem = new DevFunction(
    "setSessionStorageItem", {typeArr: ["string", "string"]},
    (_, [key, val]) => {
      return this.jsxInstance.setSessionStorageItem(key, val);
    }
  );
  removeSessionStorageItem = new DevFunction(
    "removeSessionStorageItem", {typeArr: ["string"]}, (_, [key]) => {
      return this.jsxInstance.removeSessionStorageItem(key);
    }
  );

  getHistoryState = new DevFunction(
    "getHistoryState", {typeArr: ["function?"]},
    ({callerNode, execEnv, interpreter}, [onChangeFun]) => {
      return this.jsxInstance.getHistoryState(
        onChangeFun, interpreter, callerNode, execEnv
      );
    }
  );
  setHistoryState = new DevFunction(
    "setHistoryState", {typeArr: ["any?"]}, (_, [state]) => {
      return this.jsxInstance.setHistoryState(state);
    }
  );


  canGrabFocus = new DevFunction("canGrabFocus", {}, () => {
    return this.jsxInstance.canGrabFocus();
  });


  getBoundingClientRect = new DevFunction(
    "getBoundingClientRect", {}, () => {
      let domNode = this.jsxInstance.domNode;
      if (!domNode.getBoundingClientRect) {
        return undefined;
      }
      let {
        x, y, width, height, top, right, bottom, left
      } = domNode.getBoundingClientRect();
      return {
        x: x, y : y, width: width, height: height,
        top: top, right: right, bottom: bottom, left: left,
      };
    }
  );


  getScrollData = new DevFunction(
    "getScrollData", {}, () => {
      let domNode = this.jsxInstance.domNode;
      let {scrollTop, scrollHeight, scrollLeft, scrollWidth} = domNode;
      return {
        scrollTop: scrollTop, scrollHeight: scrollHeight,
        scrollLeft: scrollLeft, scrollWidth: scrollWidth
      };
    }
  );

  // delay() and loop() are much like setTimeout() and setInterval(),
  // respectively, only where the arguments are switched, where the return
  // value is a clear() callback to unset the timeout/interval, and where the
  // timeout/interval clears itself when the component is discarded or failed.
  delay = new DevFunction(
    "delay", {typeArr: ["integer unsigned", "function"]},
    ({callerNode, execEnv, interpreter}, [delay, callback, ...rest]) => {
      let timeoutID;
      timeoutID = setTimeout(
        () => {
          let {isDiscarded, isFailed} = this.jsxInstance;
          timeoutID = undefined;
          if (!isDiscarded && !isFailed) {
            interpreter.executeFunctionOffSync(
              callback, rest, callerNode, execEnv
            );
          }
        },
        delay
      );
      return new DevFunction(
        "clear", {}, ({}, []) => {
          if (timeoutID !== undefined) {
            clearTimeout(timeoutID);
            timeoutID = undefined;
          }
        }
      );
    }
  );

  loop = new DevFunction(
    "loop", {typeArr: ["integer positive", "function"]},
    ({callerNode, execEnv, interpreter}, [delay, callback, ...rest]) => {
      let intervalID;
      intervalID = setInterval(
        () => {
          let {isDiscarded, isFailed} = this.jsxInstance;
          if (isDiscarded || isFailed) {
            if (intervalID !== undefined) {
              clearInterval(intervalID);
              intervalID = undefined;
            }
          }
          else {
            interpreter.executeFunctionOffSync(
              callback, rest, callerNode, execEnv
            );
          }
        },
        delay
      );
      return new DevFunction(
        "clear", {}, ({}, []) => {
          if (intervalID !== undefined) {
            clearInterval(intervalID);
            intervalID = undefined;
          }
        }
      );
    }
  );
}






// DOMNodeObjects can be returned by the render() functions of dev components.
export class DOMNodeObject extends ObjectObject {
  constructor(domNode, marks = undefined) {
    super("DOMNode");
    this.domNode = domNode;
    this.marks = marks;
  }
}





export function clearAttributes(elementNode, exceptions) {
  let attributeNames = [...elementNode.attributes].map(
    attrNode => attrNode.name
  );
  attributeNames.forEach(name => {
    if (!exceptions || !exceptions.includes(name)) {
      elementNode.removeAttribute(name);
    }
  });
  return elementNode;
}




function deepCompareExceptMutableAndRef(props1, props2) {
  if (props1 === props2) return true;
  if (typeof props1 !== typeof props2) return false;
  if (typeof props1 !== "object") return false;

  // Get the keys, and return false immediately if the two props have different
  // sets of keys.
  let keys1 = Object.keys(props1);
  let keys2 = Object.keys(props2);
  let unionedKeys = [...new Set(keys1.concat(keys2))];
  if (unionedKeys.length > keys1.length) {
    return false;
  }

  // Loop through each pair of properties that are not the 'ref' property and
  // deep-compare them.
  let ret = true;
  Object.entries(props1).some(([key, val1]) => {
    if (key === "ref") {
      return false; // continue the some() iteration.
    }
    let val2 = Object.hasOwn(props2, key) ? props2[key] : undefined;
    if (!deepCompare(val1, val2, true)) {
      ret = false;
      return true; // break the some() iteration.
    }
  });
  return ret;
}


export function deepCompare(val1, val2, excludeMutableProps = false) {
  if (val1 === val2) return true;

  if (!val1 || !val2 || !(val1 instanceof Object && val2 instanceof Object)) {
    return false;
  }

  if (val1 instanceof ObjectObject) {
    if (!(val2 instanceof ObjectObject)) {
      return false;
    }
    if (
      excludeMutableProps && val1.isMutable &&
      val2 instanceof ObjectObject && val2.isMutable
    ) {
      return true;
    }
    if (val1.compareWith) {
      return val1.compareWith(val2);
    }
    if (val2.compareWith) {
      return val2.compareWith(val1);
    }
    if (
      val1.isComparable && val2 instanceof ObjectObject && val2.isComparable
      && val1.constructor === val2.constructor
    ) {
      val1 = val1.members;
      val2 = val2.members;
    }
  }

  let proto1 = Object.getPrototypeOf(val1);
  let proto2 = Object.getPrototypeOf(val2);
  if (proto1 !== proto2) return false;

  if (proto1 === OBJECT_PROTOTYPE) {
    let keys1 = Object.keys(val1);
    let keys2 = Object.keys(val2);
    let unionedKeys = [...new Set(keys1.concat(keys2))];
    if (unionedKeys.length > keys1.length) {
      return false;
    }
    let ret = true;
    Object.entries(val1).some(([key, prop1]) => {
      let prop2 = Object.hasOwn(val2, key) ? val2[key] : undefined;
      if (!deepCompare(prop1, prop2, excludeMutableProps)) {
        ret = false;
        return true; // break some() iteration.
      }
    });
    return ret;
  }
  else if (proto1 === ARRAY_PROTOTYPE) {
    if (val1.length !== val2.length) {
      return false;
    }
    let ret = true;
    val1.some((entry1, ind) => {
      let entry2 = val2[ind];
      if (!deepCompare(entry1, entry2, excludeMutableProps)) {
        ret = false;
        return true; // break the some() iteration.
      }
    });
    return ret;
  }
  else return false;
}







export function getUserID() {
  let {userID} = JSON.parse(
    localStorage.getItem("userData") ?? "{}"
  );
  return userID;
}


function addUserContexts(contextProvisions, env) {
  let {contexts: {userContext}} = env.globals;
  let userID = getUserID();
  userContext.setVal({userID: userID});
  let contextProvision = JSXInstance.createContextProvision(userID);
  userContext.addSubscriberCallback(({userID}) => {
    JSXInstance.updateContextProvision(
      contextProvision, {userID: userID}, false
    );
  });
  contextProvisions["userID"] = contextProvision;
}

function getURLContexts(urlContext) {
  let {pathname, segments, state} = urlContext.val;
  let segmentsRef = [segments], pathnameRef = [pathname];

  let segmentContextProvisions = {};
  segments.forEach((segment, ind) => {
    segmentContextProvisions[ind] = JSXInstance.createContextProvision(segment);
  });

  urlContext.addSubscriberCallback(
    ({pathname, segments, state}, {segments: prevSegments, state: prevState}) => {
      segmentsRef[0] = segments; pathnameRef[0] = pathname;
      let maxLen = Math.max(segments.length, prevSegments.length);
      for (let i = 0; i < maxLen; i++) {
        let seg = segments[i], prevSeg = prevSegments[i];
        if (seg !== prevSeg) {
          JSXInstance.updateContextProvision(
            segmentContextProvisions[i] ??=
              JSXInstance.createContextProvision(seg),
            seg, true
          );
        }
      }
    }
  );

  return [segmentContextProvisions, segmentsRef, pathnameRef];
}





export function validateJSXInstance(
  thisVal, expectedModulePath, callerNode, execEnv
) {
  if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
    "'this' is not a JSXInstance",
    callerNode, execEnv
  );
  if (thisVal.jsxInstance.componentPath !== expectedModulePath) {
    throw new ArgTypeError(
      "'this' is not a JSXInstance of the right module path, \"" +
      expectedModulePath + '"',
      callerNode, execEnv
    );
  }
}