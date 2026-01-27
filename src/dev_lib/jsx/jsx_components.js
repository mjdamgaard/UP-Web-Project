
import {
  DevFunction, JSXElement, LiveJSModule, RuntimeError, getString, ObjectObject,
  forEachValue, CLEAR_FLAG, PromiseObject, logExtendedErrorAndTrace,
  OBJECT_PROTOTYPE, Environment, ARRAY_PROTOTYPE, FunctionObject, Exception,
  getStringOrSymbol, getPropertyFromObject, getPropertyFromPlainObject,
  jsonStringify, ArgTypeError, decrCompGas, getAbsolutePath,
} from "../../interpreting/ScriptInterpreter.js";
import {
  CAN_POST_FLAG, CLIENT_TRUST_FLAG, REQUESTING_COMPONENT_FLAG
} from "../query/src/flags.js";

const CLASS_NAME_REGEX = /^ *([a-z][a-z0-9\-]* *)*$/;

export const HREF_REGEX =
  /^(\.{0,2}\/)?(([;.~a-zA-Z0-9_\-]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+(\/([;.~a-zA-Z0-9_\-]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)*)?$/;
export const HREF_CD_START_REGEX = /^\.{0,2}\//;


export const CAN_CREATE_APP_FLAG = Symbol("can-create-app");





// createJSXApp() creates a JSX (React-like) app and mounts it in the index
// HTML page, in the element with the id of "up-app-root".
export const createJSXApp = new DevFunction(
  "createJSXApp",
  {isAsync: true, typeArr:["module", "object?", "Settings"]},
  async function(
    {callerNode, execEnv, interpreter}, [appComponent, props = {}, settings]
  ) {
    // Check if the caller is allowed to create an app from in the current
    // environment.
    if (!execEnv.getFlag(CAN_CREATE_APP_FLAG)) throw new RuntimeError(
      "Cannot create a new the app from here",
      callerNode, execEnv
    );

    // Create a new environment clearing the CAN_CREATE_APP_FLAG (as well as
    // other flags.)
    let appEnv = new Environment(execEnv, undefined, {flags: [CLEAR_FLAG]});

    // Get the userID if the user is logged in and call settings.initiate() in
    // order to make any initial user-dependent preparations for the 'settings'
    // object. Note that the settings object extend the (abstract)
    // SettingsObject class declared below.
    let userID = getUserID();
    await settings.initiate(userID, appComponent, callerNode, appEnv);
  
    // Set the appSettings property of the scriptVars object, which changes the
    // behavior of import() going forward such that it also prepares the
    // component's style in the case of a .jsx import.
    execEnv.scriptVars.appSettings = settings;

    // Then create the app's root component instance, and before rendering it,
    // add some props for getting user data and URL data, and pushing/replacing
    // a new browser session history state, to it.
    let rootInstance = new JSXInstance(
      appComponent, "root", undefined, callerNode, appEnv, settings
    );
    props = addUserRelatedProps(
      props, rootInstance, interpreter, callerNode, appEnv
    );
    props = addURLRelatedProps(
      props, rootInstance, interpreter, callerNode, appEnv
    );
    props = addStorageRelatedProps(
      props, rootInstance, interpreter, callerNode, appEnv
    );

    // Then render the root instance and insert it into the document.
    let rootParent = document.getElementById("up-app-root");
    let renderResolve;
    let renderPromise = new Promise(resolve => {
      renderResolve = resolve;
    });
    let appNode = rootInstance.render(
      props, false, interpreter, callerNode, appEnv, renderPromise,
      false, true, true,
    );
    rootParent.replaceChildren(appNode);
    renderResolve();
  }
);







class JSXInstance {

  constructor (
    componentModule, key, parentInstance = undefined, callerNode, callerEnv,
    settings = undefined,
  ) {
    if (!(componentModule instanceof LiveJSModule)) throw new RuntimeError(
      "JSX component needs to be an imported module namespace object",
      callerNode, callerEnv
    );
    this.componentModule = componentModule;
    this.key = getString(key, callerEnv);
    this.parentInstance = parentInstance;
    this.settings = settings ?? parentInstance.settings;
    this.settingsData = {}; // Reserved property handled purely by settings.
    this.domNode = undefined;
    this.isDecorated = undefined;
    this.childInstances = new Map();
    this.props = undefined;
    this.state = undefined;
    this.prevState = undefined;
    this.ref = undefined;
    this.contextProvisions = undefined;
    this.contextSubscriptions = undefined;
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;
    this.isDiscarded = undefined;
    this.isFailed = undefined;
    this.isFirstRender = true;
    this.rerenderPromise = undefined;
    this.renderPromise = undefined;
    this.actions = {};
    this.methods = {};
    this.events = {};
  }

  get componentPath() {
    return this.componentModule.modulePath;
  }


  render(
    props = {}, isDecorated, interpreter, callerNode, callerEnv, renderPromise,
    replaceSelf = true, force = false,
  ) {
    decrCompGas(callerNode, callerEnv, 5);
    this.isDecorated = isDecorated;
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;
    this.renderPromise = renderPromise;

    // Return early if the props are the same as on the last render, and the
    // instance is not forced to rerender, or if the instance has failed before.
    if (
      this.isFailed || !force && this.props !== undefined &&
      deepCompareExceptMutableAndRef(props, this.props) &&
      deepCompareExceptMutableAndRef(this.state, this.prevState)
    ) {
      return this.domNode;
    }
    this.prevState = this.state;

    // Record the props. And on the first render only, initialize the state,
    // and record the ref prop as well (which cannot be changed by a
    // subsequent render). Also initialize the actions, methods, and events of
    // the instance.
    this.props = props;
    let state;
    if (this.state === undefined) {
      // Set the actions, methods, and events.
      this.prepareActionsMethodsAndEvents(callerNode, callerEnv);

      // Get the initial state if the component module declares one, which is
      // done either by exporting an 'getInitialState()' function (or just
      // 'getInitState(),' or 'initialize()'), or a constant  object called
      // 'initialState' (or 'initState').
      let getInitialState = this.componentModule.get("initialize") ??
        this.componentModule.get("getInitialState") ??
        this.componentModule.get("getInitState");
      if (getInitialState) {
        this.state = {};
        try {
          state = interpreter.executeFunction(
            getInitialState, [props], callerNode, callerEnv,
            new JSXInstanceInterface(this), [CLEAR_FLAG],
          );
        }
        catch (err) {
          return this.getFailedComponentDOMNode(err, replaceSelf);
        }
      } else {
        state = this.componentModule.get("initialState") ??
          this.componentModule.get("initState");
      }
      this.state = state ?? {};

      // And store the ref prop.
      this.ref = props["ref"];
    }


    // Call settings.prepareInstance() to prepare the other methods of settings
    // for this instance, in particular transformInstance(), used below.
    // prepareInstance(), like any other methods of settings, is allowed to
    // read and write to the 'settingsData' property of this JSXInstance.
    // prepareInstance() returns a whenReady value which is a promise if and
    // only if the the instance has not been prepared yet. That promise will
    // then resolve once the instance is finally prepared, which means that we
    // can queue a rerender here when that happens.
    let [
      isReady, whenReady, renderBeforeReady = false
    ] = this.settings.prepareInstance(this, callerNode, callerEnv);
    if (!isReady) {
      whenReady.then(() => this.queueRerender(interpreter));
      if (!renderBeforeReady) {
        let newDOMNode = document.createElement("template");
        newDOMNode.setAttribute("class", "_pending-settings");
        this.replaceDOMNode(newDOMNode, replaceSelf);
        return newDOMNode;
      }

    }

    // Call settings.getClientTrust() to get a boolean of whether the client
    // trusts this instance to override CORS-like server module checks. And use
    // this to create a new environment, with or without the "client-trust"
    // flag. Note that if the instance is not yet prepared, getClientTrust()
    // might just return false temporarily, and wait for the rerender. Similarly
    // call settings.getRequestOrigin() to get the a component path (not
    // necessarily that of the current component) which can also used in CORS-
    // lie checks by the server modules.
    let isTrusted = this.settings.getClientTrust(
      this, callerNode, callerEnv
    );
    let requestOrigin = this.settings.getRequestOrigin(
      this, callerNode, callerEnv
    );
    let compEnv = new Environment(callerEnv, undefined, {flags: [
      CLEAR_FLAG,
      [CLIENT_TRUST_FLAG, isTrusted],
      [REQUESTING_COMPONENT_FLAG, requestOrigin],
    ]});


    // Then get the component module's render() function.
    let renderFun = this.componentModule.get("render") ??
      this.componentModule.get("default");
    if (!renderFun) {
      return this.getFailedComponentDOMNode(
        new RuntimeError(
          'Component module is missing a render() function at "' +
          this.componentPath + '"',
          callerNode, compEnv
        ),
        replaceSelf
      );
    }

    // Now call the component module's render() function, but catch and instead
    // log any error, rather than letting the whole app fail.
    let jsxElement;
    try {
      jsxElement = interpreter.executeFunction(
        renderFun, [props], callerNode, compEnv, new JSXInstanceInterface(this)
      );
    }
    catch (err) {
      return this.getFailedComponentDOMNode(err, replaceSelf);
    }
    this.isFirstRender = false;

    // Initialize a marks Map to keep track of which existing child instances
    // was used or created in the render, such that instances that are no
    // longer used can be removed afterwards.
    let marks = new Map();

    // If a JSXElement was successfully returned, call getDOMNode() to generate
    // the instance's new DOM node, unless render() is a dev function that
    // returns a DOM node directly, wrapped in the DOMNodeWrapper class
    // defined below, in which case just use that DOM node. getDOMNode() will
    // also fill out the ownDOMNodes array, which will include all the DOM
    // elements of the component instance that is not part of a child instance. 
    let newDOMNode, ownDOMNodes = [];
    if (jsxElement instanceof DOMNodeObject) {
      newDOMNode = jsxElement.domNode;
      ownDOMNodes = jsxElement.ownDOMNodes ?? [newDOMNode];
      marks = jsxElement.marks ?? marks;
    }
    else {
      try {
        newDOMNode = this.getDOMNode(
          jsxElement, this.domNode, marks, interpreter, callerNode, compEnv,
          props, ownDOMNodes
        );
      }
      catch (err) {
        return this.getFailedComponentDOMNode(err, replaceSelf);
      }
      if (!newDOMNode?.tagName) {
        return this.getFailedComponentDOMNode(
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


    // If the instance is not prepared yet, meaning that the style might not be
    // ready, add a "_pending-settings" class to the DOM node while waiting for
    // the rerender. (Note that the underscore here is meant to make it possible
    // for "trusted" style sheets to style the class.)
    if (!isReady) {
      newDOMNode.classList.add("_pending-settings");
    }

    // And before returning the new DOM node, call settings.transformInstance()
    // in order to transform the DOM node, in particular for applying style to
    // it (by giving it classes and/or inline styles). Note if this method has
    // not yet been prepared for the instance, it will just do nothing, and
    // wait for the rerender.
    this.settings.transformInstance(
      this, newDOMNode, ownDOMNodes, callerNode, compEnv
    );

    // Finally, return the instance's new DOM node.
    return newDOMNode;
  }



  getFailedComponentDOMNode(error, replaceSelf) {
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
    this.isDiscarded = true;
  }





  getDOMNode(
    jsxElement, curNode, marks, interpreter, callerNode, callerEnv, props,
    ownDOMNodes, childInstanceNodes = undefined, isOuterElement = true
  ) {
    if (!childInstanceNodes) {
      childInstanceNodes = [...this.childInstances.values()].map(
        inst => inst.donNode
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
      let canReuse = curNode === this.domNode && curNode?.tagName === "DIV" &&
        !childInstanceNodes.includes(curNode);
      newDOMNode = canReuse ? clearAttributes(curNode) :
        document.createElement("div");
      this.replaceChildren(
        newDOMNode, childArr, marks, interpreter, callerNode, callerEnv,
        props, ownDOMNodes, childInstanceNodes
      );
    }

    // If componentModule is defined, render the component instance.
    else if (jsxElement.isComponent) {
      let componentModule = jsxElement.componentModule;

      // First we check if the childInstances to see if the child component
      // instance already exists, and if not, create a new one. In both cases,
      // we also make sure to mark the childInstance as being used.
      let key = getString(jsxElement.key, callerEnv);
      if (marks.get(key)) throw new RuntimeError(
        `Key "${key}" is already being used by another child component ` +
        "instance",
        jsxElement.node, jsxElement.decEnv
      );
      let childInstance = this.childInstances.get(key);
      if (
        !childInstance ||
        childInstance.componentPath !== componentModule.modulePath
      ) {
        childInstance = new JSXInstance(
          componentModule, key, this, jsxElement.node, jsxElement.decEnv
        );
        this.childInstances.set(key, childInstance);
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
        jsxElement.node, childEnv, this.renderPromise, false
      );
    }

    // If the JSXElement is not a component element, create a new DOM node of
    // the type given by jsxElement.tagName, and then potentially add some
    // attributes and/or append some content to it.
    else {
      let tagName = jsxElement.tagName;
      let canReuse = curNode === this.domNode &&
        curNode?.tagName === tagName.toUpperCase() &&
        !childInstanceNodes.includes(curNode);
      newDOMNode = canReuse ? clearAttributes(curNode) :
        document.createElement(tagName);

      // Update allowed selection of attributes, and throw an invalid/non-
      // implemented attribute is set. Also record the children prop for the
      // next step afterwards.
      let childArr = [];
      let {node: jsxNode, decEnv: jsxDecEnv} = jsxElement;
      forEachValue(jsxElement.props, jsxNode, jsxDecEnv, (val, key) => {
        let eventProperty, canPost;
        switch (key) {
          case "children" : {
            if (tagName === "br" || tagName === "hr") throw new RuntimeError(
               `Elements of type "${tagName}" cannot have children`,
              jsxNode, jsxDecEnv
            );
            if (!(childArr instanceof Array)) throw new RuntimeError(
              `A non-iterable 'children' prop was used`,
             jsxNode, jsxDecEnv
           );
            childArr = val ?? [];
            break;
          }

          case "className" : {
            let className = val.toString();
            if (!CLASS_NAME_REGEX.test(className)) throw new RuntimeError(
              `Invalid class name: "${className}" (each class name needs to ` +
              "be of the form '[<id>_]<name>' where both id is of the form " +
              "/([a-z]|-_)[a-z-A0-9\-]*/ and name is of the form " +
              "/[a-z][a-z0-9\-]*/)",
              jsxNode, jsxDecEnv
            );
            // Add automatic '_' suffixes to all initial classes.
            className = className.replaceAll(
              /[a-z][a-z0-9\-]*/g, str => str + "_"
            );
            newDOMNode.setAttribute("class", className);
            break;
          }

          /* Mouse events */
          // WARNING: In all documentations of this 'onClick prop, it should be
          // warned that one should not call a callback from the parent
          // instance (e.g. handed down through ref), unless one is okay with
          // bleeding the CAN_POST and REQUEST_ORIGIN privileges granted to
          // this onClick handler function into the parent instance.
          // *Well, this is done quite simply: It should be explained how click
          // event grants the function post privileges. And then it should be
          // warned that you do not want to call unknown functions, as this
          // produces a vulnerability where other components can corrupt the
          // data that the component in question is able to affect. (Okay, not
          // *so* simple, but doable..)
          case "onClick":
            eventProperty ??= "onclick";
          case "onDBLClick":
            eventProperty ??= "ondblclick";
            canPost ??= true;
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
            canPost ??= false;
            if (!val) break;
            else if (!(val instanceof FunctionObject)) throw new ArgTypeError(
              key + " event received a non-function value",
              jsxNode, jsxDecEnv
            );

            newDOMNode[eventProperty] = (event) => {
              // Execute the function object held in val, with elevated
              // privileges that allows the function to make POST-like
              // requests. Also pass some of the properties of event, as well
              // as an added canPost property.
              let {
                button, offsetX, offsetY, ctrlKey, altKey, shiftKey, metaKey
              } = event;
              let e = {
                canPost: canPost,
                button: button, offsetX: offsetX, offsetY: offsetY,
                ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey,
                metaKey: metaKey,
              };
              interpreter.executeFunctionOffSync(
                val, [e], callerNode, callerEnv,
                new JSXInstanceInterface(this), [[CAN_POST_FLAG, canPost]]
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
          // TODO: Consider also adding an 'autofocus' prop here that grabs the
          // focus, but only once, and only if allowed by 
          // settings.isOutsideFocusedAppScope().
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

      // Then call a recursive helper method which calls getDOMNode() on any
      // and all children, and append each one to the new DOM node. And if a
      // child returns an array, it also calls itself recursively to append
      // any and all nested children inside that array (at any depth). We also
      // push the new DOM node to ownDOMNodes, and do this before hand, such
      // that ownDOMNodes will be ordered from ancestors to descendants at the
      // end.
      ownDOMNodes.push(newDOMNode);
      this.replaceChildren(
        newDOMNode, childArr, marks, interpreter, callerNode, callerEnv,
        props, ownDOMNodes, childInstanceNodes
      );
    }

    // Return the DOM node of this new element.
    return newDOMNode;
  }


  replaceChildren(
    domNode, childArr, marks, interpreter, callerNode, callerEnv,
    props, ownDOMNodes, childInstanceNodes = undefined
  ) {
    if (!childInstanceNodes) {
      childInstanceNodes = [...this.childInstances.values()].map(
        inst => inst.donNode
      );
    }
    let curChildArr = [...domNode.childNodes];
    let newChildArr = this.#getNewChildren(
      domNode, childArr, curChildArr, marks, interpreter, callerNode, callerEnv,
      props, ownDOMNodes, childInstanceNodes
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
    props, ownDOMNodes, childInstanceNodes
  ) {
    let i = 0;
    return [].concat(...childArr.map(child => {
      let isArray = child instanceof Array;
      if (child?.isFragment || isArray) {
        let nestedChildArr = isArray ? child : child.props["children"] ?? [];
        let newChildren = this.#getNewChildren(
          domNode, nestedChildArr, curChildArr, marks, interpreter, callerNode,
          callerEnv, props, ownDOMNodes, childInstanceNodes
        );
        i = i + newChildren.length;
        return newChildren;
      }
      else if (child !== undefined) {
        let newChild = this.getDOMNode(
          child, curChildArr[i], marks, interpreter, callerNode,
          callerEnv, props, ownDOMNodes, childInstanceNodes, false
        );
        i++;
        return [newChild];
      }
    }));
  }



  getFullKey() {
    return this.parentInstance ?
      this.parentInstance.getFullKey() + "." + this.key :
      this.key;
  }




  prepareActionsMethodsAndEvents(node, env) {
    forEachValue(
      this.componentModule.get("actions"), node, env,
      (fun, key) => {
        key = getStringOrSymbol(key, env) || " ";
        this.actions[key] = fun;
      },
      true
    );
    forEachValue(
      this.componentModule.get("methods"), node, env,
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
      this.componentModule.get("events"), node, env,
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
      `Call to a non-existent action, "${actionKey}", of the component at ` +
      this.componentPath,
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
    eventKey, input, interpreter, node, env, eventTargetScope = undefined
  ) {
    if (this.isDiscarded) return;
    eventTargetScope ??= env.getFlag(REQUESTING_COMPONENT_FLAG);
    if (!this.parentInstance) return;
    let events = this.parentInstance.events;
    eventKey = getStringOrSymbol(eventKey, env);
    let eventFun = getPropertyFromPlainObject(events, eventKey);
    if (eventFun) {
      // TODO: Right now we choose to be very restrictive and clear all
      // permission-giving flags, except the "can-post" flag, between
      // components when triggering events and calling methods, but we might
      // want to change this at some point, potentially. Luckily, is is easy to
      // loosen restrictions in the future, rather than imposing new ones.
      let canPost = env.getFlag(CAN_POST_FLAG);
      return interpreter.executeFunction(
        eventFun, [input, eventTargetScope], node, env,
        new JSXInstanceInterface(this.parentInstance),
        [CLEAR_FLAG, [CAN_POST_FLAG, canPost]],
      );
    }
    else {
      return this.parentInstance.trigger(
        eventKey, input, interpreter, node, env, eventTargetScope
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
      // TODO: The same todo applies here as in the trigger() method above.
      let canPost = env.getFlag(CAN_POST_FLAG);
      return interpreter.executeFunction(
        methodFun, [input], node, env,
        new JSXInstanceInterface(targetInstance),
        [CLEAR_FLAG, [CAN_POST_FLAG, canPost]],
      );
    }
    else throw new RuntimeError(
      `Call to a non-existent method, "${methodKey}", of the component at` +
      targetInstance.componentPath,
      node, env
    );
  }




  queueRerender(interpreter, force = true) {
    // Unless one is already currently queued, queue a Promise (that is
    // executed on the next tick) to rerender the instance, but only if it has
    // not been discarded since then.
    if (!this.rerenderPromise) {
      this.rerenderPromise = this.renderPromise.then(() => {
        delete this.rerenderPromise;
        if (!this.isDiscarded) {
          // Make sure to use the same callerNode and callerEnv as on the
          // previous render, which is done in order to not increase the memory
          // for every single triggered event or call.
          let renderResolve;
          let renderPromise = new Promise(resolve => {
            renderResolve = resolve;
          });
          this.render(
            this.props, this.isDecorated, interpreter,
            this.callerNode, this.callerEnv, renderPromise, true, force
          );
          renderResolve();
        }
      });
    }
  }

  queueFullRerender(interpreter) {
    this.queueRerender(interpreter);
    this.childInstances.forEach(jsxInstance => {
      jsxInstance.queueFullRerender(interpreter);
    });
  }


  changePropsAndQueueRerender(newProps, interpreter, deletePrevious = false) {
    if (deletePrevious) {
      this.props = newProps;
    } else {
      this.props = {...this.props, ...newProps};
    }
    this.queueRerender(interpreter);
  }




  provideContext(key, context, interpreter) {
    this.contextProvisions ??= {};
    let {subscribers, prevContext} = this.contextProvisions[key] ?? {};
      this.contextProvisions[key] = {subscribers: new Map(), context: context};
    if (subscribers && !deepCompareExceptMutableAndRef(context, prevContext)) {
      subscribers.forEach((_, jsxInstance) => {
        jsxInstance.queueRerender(interpreter);
      });
    }
  }

  subscribeToContext(key) {
    this.contextSubscriptions ??= new Map();
    this.contextSubscriptions.set(key, true);
    let parentInstance = this.parentInstance;
    while (parentInstance) {
      let contextProvisions = parentInstance.contextProvisions;
      if (contextProvisions && contextProvisions[key]) {
        contextProvisions[key].subscribers.set(this, true);
        return contextProvisions[key].context;
      }
      parentInstance = parentInstance.parentInstance;
    }
  }

  unsubscribeFromContext(key) {
    this.contextSubscriptions ??= new Map();
    this.contextSubscriptions.delete(key);
    let parentInstance = this.parentInstance;
    while (parentInstance) {
      let contextProvisions = parentInstance.contextProvisions;
      if (contextProvisions && contextProvisions[key]) {
        contextProvisions[key].subscribers.delete(this);
        return contextProvisions[key].context;
      }
      parentInstance = parentInstance.parentInstance;
    }
  }

  unsubscribeFromAllContexts() {
    let contextSubscriptions = this.contextSubscriptions;
    if (contextSubscriptions) {
      contextSubscriptions.forEach((_, key) => {
        this.unsubscribeFromContext(key);
      });
    }
  }

  getOwnContext(key) {
    let contextProvisions = this.contextProvisions;
    if (contextProvisions) {
      return contextProvisions.get(key)?.context;
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
      "state": this.jsxInstance.state,
      "ref": this.jsxInstance.ref,
      "component": this.jsxInstance.componentModule,
      "isFirstRender": this.jsxInstance.isFirstRender,
      /* Methods */
      "do": this.do,
      "trigger": this.trigger,
      "call": this.call,
      "doAfterRender": this.doAfterRender,
      "doAfterFirstRender": this.doAfterFirstRender,
      "setState": this.setState,
      "rerender": this.rerender,
      "provideContext": this.provideContext,
      "subscribeToContext": this.subscribeToContext,
      "unsubscribeFromContext": this.unsubscribeFromContext,
      "getOwnContext": this.getOwnContext,
      "getSettings": this.getSettings,
      "getBoundingClientRect": this.getBoundingClientRect,
      "getIsVisible": this.getIsVisible,
      "getScrollData": this.getScrollData,
      "blur": this.blur,
    });
  }


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

  // doAfterFirstRender() is similar to doAfterRender(), but it must be called
  // before the first render() call has returned to have any effect.
  doAfterFirstRender = new DevFunction(
    "doAfterFirstRender", {},
    ({callerNode, execEnv, interpreter}, [actionKey, input]) => {
      if (!this.jsxInstance.isFirstRender) return;
      setTimeout(
        () => this.jsxInstance.do(
          actionKey, input, interpreter, callerNode, execEnv
        ),
        0
      );
    }
  );

  // setState() assigns to jsxInstance.state immediately, which means that the
  // state changes will be visible to all subsequently triggered events and
  // calls to this instance. However, since the render() function can only
  // access the state via 'this.state', the state changes will not be visible
  // in the continued execution of a render() after it has set the new state,
  // but only be visible on a subsequent rerender.
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
      this.jsxInstance.queueRerender(interpreter, force);
    }
  );

  // rerender() is equivalent of calling setState() on the current state; it
  // just forces a rerender.
  rerender = new DevFunction("rerender", {}, ({interpreter}, []) => {
    this.jsxInstance.queueRerender(interpreter);
  });


  // provideContext(key, context) provides a context identified by key for all
  // its descendants, meaning that they can subscribe to it an get the context
  // value in return. And if this instance ever calls provideContext() with a
  // different value for that key, all the subscribing instances will rerender.
  provideContext = new DevFunction(
    "provideContext", {typeArr: ["object key", "any?"]},
    ({interpreter}, [key, context]) => {
      this.jsxInstance.provideContext(key, context, interpreter);
    },
  );

  // subscribeToContext(key) looks through the instance's ancestors and finds
  // the first one, if any, that has provided a context of that key. If one is
  // found, the value is returned, and this current instance is "subscribed" to
  // the context (if not already), meaning that if the context's value changes,
  // this instance rerenders. If no context is found of the given key, no side-
  // effect happens, and undefined is returned.
  subscribeToContext = new DevFunction(
    "subscribeToContext", {typeArr: ["object key"]}, (_, [key]) => {
      return this.jsxInstance.subscribeToContext(key);
    }
  );

  // unsubscribeFromContext(key) unsubscribes the instance from a context,
  // meaning that it will no longer rerender if the context updates.
  unsubscribeFromContext = new DevFunction(
    "unsubscribeFromContext", {typeArr: ["object key"]}, (_, [key]) => {
      return this.jsxInstance.unsubscribeFromContext(key);
    }
  );

  // getOwnContext(key) the instance's own context of the given key.
  getOwnContext = new DevFunction(
    "getOwnContext", {typeArr: ["object key"]}, (_, [key]) => {
      return this.jsxInstance.getOwnContext(key);
    }
  );


  // getSettings() returns a promise to the settings. Note that it might be a
  // good idea to check the CLIENT_TRUST_FLAG before allowing a component
  // instance to get settings that the user might consider private. So don't
  // just let private settings be properties of settings; make them methods
  // that check said flag.
  getSettings = new DevFunction(
    "getSettings", {isAsync: true}, async () => {
      let settings = this.jsxInstance.settings;
      if (settings instanceof Promise) {
        settings = await settings;
      }
      return settings;
    }
  );


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


  getIsVisible = new DevFunction(
    "getIsVisible", {}, () => {
      let domNode = this.jsxInstance.domNode;
      return getIsVisible(domNode);
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

  // blur() blurs the focused element if it is within component instance, and
  // within the same app scope.
  blur = new DevFunction(
    "blur", {}, ({callerNode, execEnv}, []) => {
      let canBlur = !this.jsxInstance.settings.isOutsideFocusedAppScope(
        this.jsxInstance, callerNode, execEnv
      );
      if (canBlur) {
        document.activeElement.blur();
      }
    }
  );

}



const MARGIN_OF_ALLOWED_OVERLAP = 0.01;

// getIsVisible() that checks that the input DOM node is on screen and without
// overlaps from its siblings, as well as any of its ancestors' siblings. 
export function getIsVisible(domNode) {
  if (!domNode.getBoundingClientRect) {
    return undefined;
  }
  let {top, right, bottom, left} = domNode.getBoundingClientRect();
  let effectiveTop = top + top * MARGIN_OF_ALLOWED_OVERLAP;
  let effectiveLeft = left + left * MARGIN_OF_ALLOWED_OVERLAP;
  let effectiveRight = right - right * MARGIN_OF_ALLOWED_OVERLAP;
  let effectiveBottom = bottom - bottom * MARGIN_OF_ALLOWED_OVERLAP;

  // Check that the node is not too much out of the viewport.
  let {innerHeight, innerWidth} = window;
  let isOutOfViewport = effectiveTop < 0 || effectiveLeft < 0 ||
    effectiveRight > innerWidth || effectiveBottom > innerHeight;
  if (isOutOfViewport) {
    return false;
  }

  // Then check that none of the siblings or ancestor siblings overlap too much
  // with the node.
  let curDOMNode = domNode;
  let upRootNode = document.getElementById("up-app-root");
  let ret = true;
  while(ret && curDOMNode !== upRootNode) {
    // First check that curDOMNode does not overflow its parent node.
    let {parentNode} = curDOMNode;
    let {top, right, bottom, left} = parentNode.getBoundingClientRect();
    let doesOverflow =  top > effectiveTop || left > effectiveLeft ||
      right < effectiveRight || bottom < effectiveBottom;
    if (doesOverflow) {
      ret = false;
      break;
    }

    // Also check that the opacity of curDOMNode is 1.
    if (window.getComputedStyle(curDOMNode).opacity != 1) {
      ret = false;
      break;
    }

    // Then get curDOMNode's the siblings (and itself), and then go through
    // each one and check that it does not overlap, as well as any of its
    // descendants. However, we only check said descendants if the (computed)
    // 'overflow:visible' style is set.
    let siblingsAndSelf = [...parentNode.childNodes];
    ret = !siblingsAndSelf.some(sibling => {
      if (sibling === curDOMNode || !sibling.getBoundingClientRect) {
        return;
      }

      // Check that the sibling does not overlap.
      let {top, right, bottom, left} = sibling.getBoundingClientRect();
      let isClear =  top >= effectiveBottom || left >= effectiveRight ||
        right <= effectiveLeft || bottom <= effectiveTop;
      if (!isClear) {
        return true;
      }

      // The check that the sibling does not have a computed overflow-x or -y
      // style of 'visible,' and if it does, then check all its descendants as
      // well.
      let {overflowX, overflowY} = window.getComputedStyle(sibling);
      if (overflowX === "visible" || overflowY === "visible") {
        // TODO: Instead of just returning true here, loop through each
        // child of the sibling and check their bounding box, as well as their
        // overflow style properties, and if the overflow is visible, repeat
        // the procedure until all descendants are indirectly or directly
        // checked this way.
        return true;
      }
    });

    // In case ret is still true, change curDOMNode to its parent for the next
    // iteration.
    curDOMNode = curDOMNode.parentNode;
  }

  return ret;
}





// DOMNodeObjects can be returned by the render() functions of dev components.
export class DOMNodeObject extends ObjectObject {
  constructor(domNode, ownDOMNodes = undefined, marks = undefined) {
    super("DOMNode");
    this.domNode = domNode;
    this.ownDOMNodes = ownDOMNodes;
    this.marks = marks;
  }
}


// SettingsObject is an abstract class that is meant to be extended by settings
// systems, i.e. the modules that define a getSettings() function to be passed
// to createJSXApp().
export class SettingsObject extends ObjectObject {
  constructor() {
    super("Settings");
  }

  // TODO: Correct and complete the following comments.

  // initiate(userID, appComponent, node, env) ...
  initiate(userID, appComponent, node, env) {}

  // getUserID(node, env) ...
  getUserID(node, env) {}

  // changeUser(userID?, node, env) ...
  changeUser(userID, node, env) {}

  // prepareComponent(componentModule, node, env) ...
  prepareComponent(componentModule, node, env) {}

  // prepareInstance(jsxInstance, node, env) has
  // to prepare transformInstance() such that it can be called synchronously.
  // It should also return a whenPrepared value that might be a promise, in
  // which case the component renders with a "_pending-settings" class and
  // queues a rerender when the promise resolves.
  prepareInstance(jsxInstance, node, env) {}

  // TODO: Correct.
  // getClientTrust(componentPath, node, env) takes a component path,
  // which will often be the so-called "request origin", and returns boolean
  // of whether client trust the component to make post requests, and to
  // fetch private data. If getClientTrust() has not yet been prepared by
  // prepareInstance(), it might just return false temporarily.
  getClientTrust(jsxInstance, node, env) {}

  // transformInstance() ...
  transformInstance(
    jsxInstance, domNode, ownDOMNodes, node, env
  ) {}

  // getAppScopeRoot(jsxInstance) gets the DOM node at the root of the
  // current app scope.
  getAppScopeRoot(jsxInstance, node, env) {}

  // isOutsideFocusedAppScope(jsxInstance) returns true iff there is an
  // HTML element in focus outside of the current app scope.
  isOutsideFocusedAppScope(jsxInstance, node, env) {}

  // Note that these are just the minimal API needed for this module to
  // function. In practice the settings class will likely be extended with
  // other methods.

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
    if (
      excludeMutableProps && val1.isMutable &&
      val2 instanceof ObjectObject && val2.isMutable
    ) {
      return true;
    }
    if (
      val1.isComparable && val2 instanceof ObjectObject && val2.isComparable
      && val1.constructor === val2.constructor
    ) {
      val1 = val1.members;
      val2 = val2.members;
    }
    else return false;
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





export async function getSetting(
  settings, name, inputArr = undefined, interpreter, node, env
) {
  let val = settings[name];
  if (val instanceof PromiseObject) {
    val = await val.promise;
  }
  if (val instanceof FunctionObject) {
    val = interpreter.executeFunctionOffSync(
      val, inputArr ?? [], node, env, settings
    );
    if (val instanceof PromiseObject) {
      val = await val.promise;
    }
  }
  return val;
}






export function getUserID() {
  let {userID} = JSON.parse(
    localStorage.getItem("userData") ?? "{}"
  );
  return userID;
}



function addUserRelatedProps(props, jsxInstance, interpreter, node, env) {
  let {contexts: {settingsContext}} = env.scriptVars;
  let userID = settingsContext.getVal().getUserID(node, env);
  settingsContext.addSubscriberCallback(settings => {
    let userID = settings.getUserID(node, env);
    jsxInstance.changePropsAndQueueRerender({userID: userID}, interpreter);
    jsxInstance.queueFullRerender(interpreter);
  });
  return {...props, userID: userID};
}



function addURLRelatedProps(props, jsxInstance, interpreter, _, env) {
  let {contexts: {urlContext}} = env.scriptVars;

  // Define the functions to change the urlContext.
  let validateAndUpdateURLContext = (stateJSON, url, callerNode, execEnv) => {
    // Validate url, and prepend './' to it if doesn't start with /.?.?\//.
    if (!HREF_REGEX.test(url)) throw new ArgTypeError(
      "Invalid URL pathname: " + url,
      callerNode, execEnv
    );
    if (!HREF_CD_START_REGEX.test(url)) url = './' + url;

    // Then construct the full URL (or actually the full pathname).
    let curURL = window.location.pathname;
    url = getAbsolutePath(curURL, url, callerNode, execEnv);
    url = url.replace(/\/$/, "");

    let urlData = {url: url, stateJSON: stateJSON};
    urlContext.setVal(urlData);
    return url;
  };

  // Define the methods of the history object.
  const pushState = new DevFunction(
    "pushState", {typeArr: ["any?", "string"]},
    ({callerNode, execEnv}, [state = null, url]) => {
      let stateJSON = jsonStringify(state);
      url = validateAndUpdateURLContext(stateJSON, url, callerNode, execEnv);
      window.history.pushState(stateJSON, "", url);
    }
  );
  const replaceState = new DevFunction(
    "replaceState", {typeArr: ["any?", "string"]},
    ({callerNode, execEnv}, [state = null, url]) => {
      let stateJSON = jsonStringify(state);
      url = validateAndUpdateURLContext(stateJSON, url, callerNode, execEnv);
      window.history.replaceState(stateJSON, "", url);
    }
  );
  const back = new DevFunction("back", {}, () => {
    window.history.back();
  });
  const forward = new DevFunction("forward", {}, () => {
    window.history.forward();
  });
  const go = new DevFunction("go", {typeArr: ["integer?"]}, ({}, [delta]) => {
    window.history.go(delta);
  });

  // Get the current "URL" (which is actually the location.pathname) and the
  // state JSON.
  let {url, stateJSON} = urlContext.getVal();

  // Then subscribe the app component's jsxInstance to the urlContext.
  urlContext.addSubscriberCallback((urlData) => {
    jsxInstance.changePropsAndQueueRerender({
      url: urlData.url,
      history: {
        state: JSON.parse(urlData.stateJSON ?? 'null'),
        pushState: pushState, replaceState: replaceState,
        back: back, forward: forward, go: go,
      },
    }, interpreter);
  });

  // And note that the following popstate event listener is added in index.js:
  // window.addEventListener("popstate", (event) => {
  //   let url = window.location.pathname.replace(/\/$/, "");
  //   let urlData = {url: url, stateJSON: event.state};
  // });

  // Then return the initial URL-related props. 
  return {
    ...props,
    url: url,
    history: {
      state: JSON.parse(stateJSON ?? 'null'),
      pushState: pushState, replaceState: replaceState,
      back: back, forward: forward, go: go,
    },
  };
}




const sessionStorageObject = {
  setItem: new DevFunction(
    "setItem", {typeArr: ["string", "any"]},
    ({}, [key, value]) => {
      let actualKey = "up-" + key;
      let jsonValue = jsonStringify(value);
      window.sessionStorage.setItem(actualKey, jsonValue);
    }
  ),
  getItem: new DevFunction(
    "setItem", {typeArr: ["string"]},
    ({}, [key]) => {
      let actualKey = "up-" + key;
      let jsonValue = window.sessionStorage.getItem(actualKey);
      return JSON.parse(jsonValue);
    }
  ),
  removeItem: new DevFunction(
    "setItem", {typeArr: ["string"]},
    ({}, [key]) => {
      let actualKey = "up-" + key;
      window.sessionStorage.removeItem(actualKey);
    }
  ),
};

const localStorageObject = {
  setItem: new DevFunction(
    "setItem", {typeArr: ["string", "any"]},
    ({}, [key, value]) => {
      let actualKey = "up-" + key;
      let jsonValue = jsonStringify(value);
      window.localStorage.setItem(actualKey, jsonValue);
    }
  ),
  getItem: new DevFunction(
    "setItem", {typeArr: ["string"]},
    ({}, [key]) => {
      let actualKey = "up-" + key;
      let jsonValue = window.localStorage.getItem(actualKey);
      return JSON.parse(jsonValue);
    }
  ),
  removeItem: new DevFunction(
    "setItem", {typeArr: ["string"]},
    ({}, [key]) => {
      let actualKey = "up-" + key;
      window.localStorage.removeItem(actualKey);
    }
  ),
};

function addStorageRelatedProps(props) {
  return {
    ...props,
    sessionStorage: sessionStorageObject,
    localStorage: localStorageObject,
  };
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