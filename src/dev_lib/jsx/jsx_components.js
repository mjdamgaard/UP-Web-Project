
import {
  DevFunction, JSXElement, LiveModule, RuntimeError, getExtendedErrorMsg,
  getString, AbstractUHObject, forEachValue, CLEAR_FLAG, deepCopy,
  OBJECT_PROTOTYPE, ArgTypeError, Environment, getPrototypeOf, ARRAY_PROTOTYPE,
  FunctionObject, SyntaxError, getStringOrSymbol, getFullPath,
} from "../../interpreting/ScriptInterpreter.js";
import {
  CAN_POST_FLAG, CLIENT_TRUST_FLAG, REQUEST_ORIGIN_FLAG
} from "../query/src/flags.js";

import {JSXAppStyler} from "./jsx_styling.js";


const CLASS_NAME_REGEX =
  /^ *([a-zA-Z][a-z-A-Z0-9\-]*_[a-zA-Z][a-z-A-Z0-9\-]* *)*$/;


export const CAN_CREATE_APP_FLAG = Symbol("can-create-app");

export const APP_COMPONENT_PATH_FLAG = Symbol("app-component-path");
export const COMPONENT_INSTANCE_FLAG = Symbol("component-instance");




// TODO: Make createJSXApp() take an argument of a function to get component
// trust (for the FlagTransmitter to use), and also make the app component get
// the URL substring after the domain as part of its props. 

// Create a JSX (React-like) app and mount it in the index HTML page, in the
// element with an id of "up-app-root".
export const createJSXApp = new DevFunction(
  {isAsync: true, typeArr:["module", "object", "function"]},
  async function(
    {callerNode, execEnv, interpreter},
    [appComponent, props, getSettings]
  ) {
    // Set a flag containing the app component path for the app.
    execEnv.setFlag(APP_COMPONENT_PATH_FLAG, appComponent.componentPath);

    // Check if the caller is allowed to create an app from in the current
    // environment.
    if (!execEnv.getFlag(CAN_CREATE_APP_FLAG)) throw new RuntimeError(
      "Cannot create a new the app from here",
      callerNode, execEnv
    );

    // Create a SettingsStore which uses getSettings() to fetch settings for
    // each individual component. These settings are used for styling the
    // components, and for assigning them trust for making post requests, among
    // other things, all of which might be made to depend on user preferences.
    let settingsStore = new SettingsStore(getSettings, interpreter);

    // Then create an JSXAppStyler, which uses the settingsStore to generate
    // the styles of each component by fetching, transpiling and inserting
    // relevant style sheets in the document head. We then immediately call its
    // loadStylesOfAllStaticJSXModules() method to prepare the styles of all
    // '.jsx' modules that have been "statically" imported (i.e. imported from
    // import statements).  
    let jsxAppStyler = new JSXAppStyler(
      settingsStore, appComponent, interpreter, callerNode, execEnv
    );
    let staticStylesPromise = jsxAppStyler.loadStylesOfAllStaticJSXModules(
      execEnv.scriptVars.liveModules, callerNode, execEnv
    );

    // Then create the app's root component instance, and before rendering it,
    // add some props for getting user data and URL data, and pushing a new
    // browser session history state it it.  
    let rootInstance = new JSXInstance(
      appComponent, "root", undefined, callerNode, execEnv,
      jsxAppStyler, settingsStore      
    );
    props = addUserRelatedProps(props, rootInstance, interpreter, execEnv);
    props = addURLRelatedProps(props, rootInstance, interpreter, execEnv);

    // Then render the root instance and insert it into the document.
    let rootParent = document.getElementById("up-app-root");
    let appNode = rootInstance.render(
      props, false, interpreter, callerNode, execEnv, false, true, true
    );
    rootParent.replaceChildren(appNode);

    // Also add a "loading-style" class to the app's DOM node, which is removed
    // once the style-related promise below resolves.
    appNode.classList.add("loading-style");

    // Now use the jsxAppStyler to fetch and load the styles of all statically
    // imported JSX modules (with file extensions ending in ".jsx").
    await staticStylesPromise;

    // And once the styles are ready, we can remove the "loading-style" class
    // from the app node.
    appNode.classList.remove("loading-style");
  }
);







class JSXInstance {

  constructor (
    componentModule, key, parentInstance = undefined, callerNode, callerEnv,
    jsxAppStyler = undefined, settingsStore = undefined,
  ) {
    if (!(componentModule instanceof LiveModule)) throw new RuntimeError(
      "JSX component needs to be an imported module namespace object",
      callerNode, callerEnv
    );
    this.componentModule = componentModule;
    this.key = getString(key);
    this.parentInstance = parentInstance;
    this.jsxAppStyler = jsxAppStyler ?? this.parentInstance?.jsxAppStyler;
    this.settingsStore = settingsStore ?? this.parentInstance?.settingsStore;
    this.settings =
      this.settingsStore.get(componentModule, callerNode, callerEnv);
    this.isRequestOrigin = componentModule.members["isRequestOrigin"];
    this.domNode = undefined;
    this.ownDOMNodes = undefined;
    this.isDecorated = undefined;
    this.childInstances = new Map();
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
    this.contextProvisions = undefined;
    this.contextSubscriptions = undefined;
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;
    this.isDiscarded = undefined;
    this.rerenderPromise = undefined;
  }

  get componentPath() {
    return this.componentModule.modulePath;
  }
  get requestOrigin() {
    if (this.isRequestOrigin)
      return this.componentPath;
    else {
      return this.parentInstance?.requestOrigin;
    }
  }


  render(
    props = {}, isDecorated, interpreter,
    callerNode, callerEnv, replaceSelf = true, force = false,
  ) {
    this.isDecorated = isDecorated;
    this.callerNode = callerNode;
    this.callerEnv = callerEnv;

    // Return early if the props are the same as on the last render, and if the
    // instance is not forced to rerender.
    if (
      !force && this.props !== undefined && compareExceptRefs(props, this.props)
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
      let getInitState = this.componentModule.members["getInitState"];
      if (getInitState) {
        try {
          state = interpreter.executeFunction(
            getInitState, [props], callerNode, callerEnv
          );
        }
        // If an error occurred, return a placeholder element with a
        // "base_failed" class. Note that the "base_" in front means that this
        // class can be styled by the style sheet that assigned the ID (prefix)
        // of "base" by getSettings().
        catch (err) {
          return this.getFailedComponentDOMNode(err, replaceSelf);
        }
      } else {
        state = this.componentModule.members["initState"] || {};
      }
      let stateProto = getPrototypeOf(state);
      if (stateProto !== OBJECT_PROTOTYPE) {
        return this.getFailedComponentDOMNode(
          new RuntimeError(
            `State needs to be a plain object, but got: ${getString(state)}`,
            callerNode, callerEnv
          ),
          replaceSelf
        );
      }
      this.state = state;

      // And store the refs object.
      this.refs = props["refs"] ?? {};

      // And also store a boolean for whether this component is a "request
      // origin."
      this.isRequestOrigin = this.componentModule.members["isRequestOrigin"];
    }

    // Then get the component module's render() function.
    let renderFun = this.componentModule.members["render"];
    if (!renderFun) {
      return this.getFailedComponentDOMNode(
        new RuntimeError(
          'Component module is missing a render() function at "' +
          this.componentPath + '"',
          callerNode, callerEnv
        ),
        replaceSelf
      );
    }


    // Initialize a marks Map to keep track of which existing child instances
    // was used or created in the render, such that instances that are no
    // longer used can be removed afterwards.
    let marks = new Map();

    // Now call the component module's render() function, but catch and instead
    // log any error, rather than letting the whole app fail.
    let jsxElement;
    try {
      jsxElement = interpreter.executeFunction(
        renderFun, [deepCopyExceptRefs(props, callerNode, callerEnv)],
        callerNode, callerEnv, new JSXInstanceInterface(this),
        [CLEAR_FLAG, [COMPONENT_INSTANCE_FLAG, this]]
      );
    }
    catch (err) {
      return this.getFailedComponentDOMNode(err, replaceSelf);
    }

    // If a JSXElement was successfully returned, call getDOMNode() to generate
    // the instance's new DOM node, unless render() is a dev function that
    // returns a DOM node directly, wrapped in the DOMNodeWrapper class
    // defined below, in which case just use that DOM node.
    let newDOMNode, ownDOMNodes = [];
    if (jsxElement instanceof DOMNodeObject) {
      newDOMNode = jsxElement.domNode;
    }
    else {
      try {
        newDOMNode = this.getDOMNode(
          jsxElement, marks, interpreter, callerNode, callerEnv, ownDOMNodes
        );
      }
      catch (err) {
        return this.getFailedComponentDOMNode(err, replaceSelf);
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
    if (replaceSelf) {
      this.domNode.replaceWith(newDOMNode);
      this.updateDecoratingAncestors(newDOMNode);
    }
    this.domNode = newDOMNode;

    // Then, before returning the new DOM node, we also use jsxAppStyler to
    // transform the class attributes of the instance in order to style it.
    this.jsxAppStyler.transformClasses(
      newDOMNode, ownDOMNodes, this.componentModule, callerNode, callerEnv
    );

    // Finally, return the instance's new DOM node.
    return newDOMNode;
  }



  getFailedComponentDOMNode(error, replaceSelf) {
    if (error instanceof RuntimeError || error instanceof SyntaxError) {
      console.error(getExtendedErrorMsg(error));
      let newDOMNode = document.createElement("span");
      newDOMNode.setAttribute("class", "base_failed");
      this.childInstances.forEach(child => child.dismount());
      this.childInstances = new Map();
      if (replaceSelf && this.domNode) {
        this.domNode.replaceWith(newDOMNode);
        this.updateDecoratingAncestors(newDOMNode);
      }
      this.domNode = newDOMNode;
      return newDOMNode;
    }
    else {
      console.error(error);
    }
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
    jsxElement, marks, interpreter, callerNode, callerEnv, ownDOMNodes,
    isOuterElement = true
  ) {
    // If jsxElement is not a JSXElement instance, return a string derived from
    // JSXElement, except if it is an outer element, in which case wrap it in
    // a span element.
    let isArray = jsxElement instanceof Array;
    if (!(jsxElement instanceof JSXElement) && !isArray) {
      if (isOuterElement) {
        let newDOMNode = document.createElement("span");
        if (jsxElement !== undefined) newDOMNode.append(getString(jsxElement));
        return newDOMNode;
      }
      else return getString(jsxElement);
    }

    // If jsxElement is a fragment, we render each of its children individually,
    // and return an array of all these values, some of which are DOM nodes and
    // some of which are strings. This is unless the element is an outer one,
    // in which case we wrap it in a div element.
    if (jsxElement.isFragment || isArray) {
      let children = isArray ? jsxElement : jsxElement.props["children"] ?? [];
      let ret = children.map(val => (
        this.getDOMNode(
          val, marks, interpreter, callerNode, callerEnv, ownDOMNodes, false
        )
      ));
      if (isOuterElement) {
        let newDOMNode = document.createElement("div");
        if (jsxElement !== undefined) newDOMNode.append(...children);
        return newDOMNode;
      }
      else return ret;
    }

    // If componentModule is defined, render the component instance.
    let componentModule = jsxElement.componentModule;
    if (componentModule) {
      // First we check if the childInstances to see if the child component
      // instance already exists, and if not, create a new one. In both cases,
      // we also make sure to mark the childInstance as being used.
      let key = getString(jsxElement.key);
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
      // have changed) the child instance and get its DOM node, which can be
      // returned straightaway. In order to get better error reporting, we also
      // create an intermediate environment such that it will appear as if the
      // render() function is called from the JSXElement itself, as if it were
      // a callback function.
      let childEnv = new Environment(
        jsxElement.decEnv, "function", {
          fun: {}, callerNode: callerNode, callerEnv: callerEnv,
        }
      );
      return childInstance.render(
        jsxElement.props, isOuterElement, interpreter,
        jsxElement.node, childEnv, false
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
      let {node: jsxNode, decEnv: jsxDecEnv} = jsxElement;
      forEachValue(jsxElement.props, jsxNode, jsxDecEnv, (val, key) => {
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
              "be of the form '<id>_<name>' where both id and name are of " +
              "the form /[a-zA-Z][a-z-A-Z0-9\-]*/)",
              jsxNode, jsxDecEnv
            );
            newDOMNode.setAttribute("class", className);
            break;
          }
          // WARNING: In all documentations of this 'onClick prop, it should be
          // warned that one should not call a callback from the parent
          // instance (e.g. handed down through refs), unless one is okay with
          // bleeding the CAN_POST and REQUEST_ORIGIN privileges granted to
          // this onClick handler function into the parent instance. 
          case "onClick": {
            if (!(val instanceof FunctionObject)) {
              break;
            }
            newDOMNode.onclick = () => {
              // Get the request origin, and whether the client trusts that
              // origin (which is a JSX component).
              let requestOrigin = this.requestOrigin;
              if (requestOrigin) {
                this.settingsStore.get(
                  requestOrigin, callerNode, callerEnv
                ).catch(
                  err => console.error(err)
                ).then(({isTrusted}) => {
                  // Then execute the function object held in val, with
                  // elevated privileges that allows the function to make POST-
                  // like requests. 
                  interpreter.executeFunctionOffSync(
                    val, [], callerNode, callerEnv,
                    new JSXInstanceInterface(this), [
                      CAN_POST_FLAG,
                      [COMPONENT_INSTANCE_FLAG, this],
                      [REQUEST_ORIGIN_FLAG, requestOrigin],
                      [CLIENT_TRUST_FLAG, isTrusted],
                    ]
                  );
                });
              }
              else {
                interpreter.executeFunctionOffSync(
                  val, [], callerNode, callerEnv,
                  new JSXInstanceInterface(this), [
                    CAN_POST_FLAG,
                    [COMPONENT_INSTANCE_FLAG, this],
                  ]
                );
              }
            };
            break;
          }
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
        this.createAndAppendChildren(
          domNode, val,  marks, interpreter, callerNode, callerEnv, ownDOMNodes
        );
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



  // dispatch(event, input?) dispatches an event to the first among its ancestor
  // instances who has an action with that event key (which might be a Symbol).
  // The actions are declared by the 'actions' object exported by a component
  // module. If no ancestors has an action of a matching key, dispatch() just
  // fails silently and nothing happens.
  dispatch(eventKey, input, interpreter, callerNode, callerEnv) {
    let actions = this.componentModule.members["actions"];
    eventKey = getStringOrSymbol(eventKey);
    let actionFun;
    if (getPrototypeOf(actions) === OBJECT_PROTOTYPE) {
      actionFun = actions[eventKey];
    }
    if (actionFun) {
      interpreter.executeFunction(
        actionFun, [input], callerNode, callerEnv,
        new JSXInstanceInterface(this),
        [CLEAR_FLAG, [COMPONENT_INSTANCE_FLAG, this]]
      );
    }
    else {
      if (this.parentInstance) {
        this.parentInstance.dispatch(
          eventKey, input, interpreter, callerNode, callerEnv
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
    instanceKey = getString(instanceKey);

    // First get the target instance.
    let targetInstance;
    if (instanceKey === "") {
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
    let methods = targetInstance.componentModule.members["methods"];
    methodKey = getStringOrSymbol(methodKey);
    if (!methodKey) throw new ArgTypeError(
      "Invalid, falsy method key",
      callerNode, callerEnv
    );
    let methodFun;
    if (getPrototypeOf(methods) === OBJECT_PROTOTYPE) {
      methodFun = methods[methodKey];
    }
    if (methodFun) {
      return interpreter.executeFunction(
        methodFun, [input], callerNode, callerEnv,
        new JSXInstanceInterface(targetInstance),
        [CLEAR_FLAG, [COMPONENT_INSTANCE_FLAG, targetInstance]]
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
          // for every single triggered action or call.
          this.render(
            this.props, this.isDecorated, interpreter,
            this.callerNode, this.callerEnv, true, true
          );
        }
      });
    }
  }


  changePropsAndRerender(newProps, interpreter, deletePrevious = false) {
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
    if (subscribers && !compareExceptRefs(context, prevContext)) {
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







class JSXInstanceInterface extends AbstractUHObject {
  constructor(jsxInstance) {
    super("JSXInstance");
    this.jsxInstance = jsxInstance;

    Object.assign(this.members, {
    /* Properties */
      "props": deepCopy(this.jsxInstance.props),
      "state": deepCopy(this.jsxInstance.state),
      "refs": this.jsxInstance.refs,
      /* Methods */
      "dispatch": this.dispatch,
      "call": this.call,
      "setState": this.setState,
      "rerender": this.rerender,
      "provideContext": this.provideContext,
      "subscribeToContext": this.subscribeToContext,
      "unsubscribeFromContext": this.unsubscribeFromContext,
      "getOwnContext": this.getOwnContext,
    });
  }


  // See the comments above for what dispatch() and call() does.
  dispatch = new DevFunction(
    {typeArr: ["object key", "any?"]},
    ({callerNode, execEnv, interpreter}, [eventKey, input]) => {
      this.jsxInstance.dispatch(
        eventKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  call = new DevFunction(
    {typeArr: ["any", "object key", "any?"]},
    ({callerNode, execEnv, interpreter}, [instanceKey, methodKey, input]) => {
      return this.jsxInstance.call(
        instanceKey, methodKey, input, interpreter, callerNode, execEnv
      );
    }
  );

  // setState() assigns to jsxInstance.state immediately, which means that the
  // state changes will be visible to all subsequently triggered actions and
  // calls to this instance. However, since the render() function can only
  // access the state via its 'state' argument, the state changes will not be
  // visible in the continued execution of a render() after it has set the new
  // state, but only be visible on a subsequent rerender.
  setState = new DevFunction(
    {typeArr: ["object"]},
    ({interpreter}, [newState]) => {
      this.jsxInstance.state = newState;
      this.jsxInstance.queueRerender(interpreter);
    }
  );

  // rerender() is equivalent of calling setState() on the current state; it
  // just forces a rerender.
  rerender = new DevFunction({}, ({interpreter}) => {
    this.jsxInstance.queueRerender(interpreter);
  });

  // import() is similar to the regular import function, except it also makes
  // the app call getStyle() to get and load the style, before the returned
  // promise resolves.
  import = new DevFunction(
    {isAsync: true, typeArr: ["string"]},
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

  // provideContext(key, context) provides a context identified by key for all
  // its descendants, meaning that they can subscribe to it an get the context
  // value in return. And if this instance ever calls provideContext() with a
  // different value for that key, all the subscribing instances will rerender.
  provideContext = new DevFunction(
    {typeArr: ["object key", "object"]},
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
    {typeArr: ["object key"]}, ({}, [key]) => {
      return deepCopyExceptRefs(
        this.jsxInstance.subscribeToContext(key)
      );
    }
  );

  // unsubscribeFromContext(key) unsubscribes the instance from a context,
  // meaning that it will no longer rerender if the context updates. 
  unsubscribeFromContext = new DevFunction(
    {typeArr: ["object key"]}, ({}, [key]) => {
      return deepCopyExceptRefs(
        this.jsxInstance.unsubscribeFromContext(key)
      );
    }
  );

  // getOwnContext(key) the instance's own context of the given key.
  getOwnContext = new DevFunction(
    {typeArr: ["object key"]}, ({}, [key]) => {
      return deepCopyExceptRefs(
        this.jsxInstance.getOwnContext(key)
      );
    }
  );


  // TODO: Add more instance methods at some point, such as a method to get
  // bounding box data, or a method to get a PromiseObject that resolves a
  // short time after the bounding box data, and similar data, is ready.
}






class SettingsStore {
  constructor(getSettings, interpreter) {
    this.getSettings = getSettings;
    this.interpreter = interpreter;
    this.settingsMap = new Map();
  }

  get(liveModuleOrPath, callerNode, execEnv) {
    let modulePath = liveModuleOrPath.modulePath ?? liveModuleOrPath;
    let settings = this.settingsMap.get(modulePath);
    if (settings === undefined) {
      settings = this.interpreter.executeFunction(
        this.getSettings, [liveModuleOrPath], callerNode, execEnv
      );
      this.settingsMap.set(modulePath, settings);
    }
    return settings;
  }
}






export class DOMNodeObject extends AbstractUHObject {
  constructor(domNode) {
    super("DOMNode");
    this.domNode = domNode;
  }
}




function compareExceptRefs(props1, props2) {
  // Get the keys, and return false immediately if the two props Maps have
  // different keys.
  let keys1 = Object.keys(props1);
  let keys2 = Object.keys(props2);
  let unionedKeys = [...new Set(keys1.concat(keys2))];
  if (unionedKeys.length > keys1.length) {
    return false;
  }

  // Loop through each pair of properties that are not the 'refs' property and
  // deep-compare them.
  let ret = true;
  Object.entries(props1).some(([key, val1]) => {
    if (key === "refs") {
      return false; // continue some() iteration.
    }
    let val2 = Object.hasOwn(props2, key) ? props2[key] : undefined;
    if (!deepCompare(val1, val2)) {
      ret = false;
      return true; // break some() iteration.
    }
  });
  return ret;
}


export function deepCompare(val1, val2) {
  if (val1 === null || !(val1 instanceof Object)) {
    return val1 === val2;
  }

  let proto1 = Object.getPrototypeOf(val1);
  let proto2 = Object.getPrototypeOf(val2);
  if (proto1 === OBJECT_PROTOTYPE) {
    if (proto2 !== OBJECT_PROTOTYPE) {
      return false;
    }
    let keys1 = Object.keys(val1);
    let keys2 = Object.keys(val2);
    let unionedKeys = [...new Set(keys1.concat(keys2))];
    if (unionedKeys.length > keys1.length) {
      return false;
    }
    let ret = true;
    Object.entries(val1).some(([key, prop1]) => {
      let prop2 = Object.hasOwn(val2, key) ? val2[key] : undefined;
      if (!deepCompare(prop1, prop2)) {
        ret = false;
        return true; // break some() iteration.
      }
    });
    return ret;
  }
  else if (proto1 === ARRAY_PROTOTYPE) {
    if (proto2 !== ARRAY_PROTOTYPE) {
      return false;
    }
    if (val1.length !== val2.length) {
      return false;
    }
    let ret = true;
    val1.some((entry1, ind) => {
      let entry2 = val2[ind];
      if (!deepCompare(entry1, entry2)) {
        ret = false;
        return true; // break some() iteration.
      }
    });
    return ret;
  }
  else {
    return val1 === val2;
  }
}



function deepCopyExceptRefs(props, node, env) {
  let ret = {};
  forEachValue(props, node, env, (val, key) => {
    if (key === "refs") {
      ret[key] = val;
    } else {
      ret[key] = deepCopy(val);
    }
  });
  return ret;
}







function addUserRelatedProps(props, jsxInstance, interpreter, env) {
  let {contexts: {userIDContext}} = env.scriptVars;
  let userID = userIDContext.get();
  userIDContext.addSubscriberCallback((userID) => {
    jsxInstance.changePropsAndRerender({userID: userID}, interpreter);
  })
  return {...props, userID: userID};
}



// TODO: Implement:
function addURLRelatedProps(props, jsxInstance, interpreter) {
  return props;

  // let {hostname, pathname, search, hash} = window.location;
  // props = {
  //   location: {
  //     hostname: hostname, pathname: pathname, search: search, hash: hash,
  //     state: window.history.state,
  //   },
  //   ...props
  // };
  // let pushState = new DevFunction(
  //   {typeArr:["string", "object?"]},
  //   ({callerNode, execEnv}, [path, state]) => {
  //     let {protocol, host, pathname} = window.location;
  //     let newPath = getFullPath(pathname, path, callerNode, execEnv);
  //     // TODO: Validate newPath!
  //     let newFullURL = protocol + '//' + host + newPath;
  //     window.history.pushState(state, undefined, newFullURL);
  //     jsxInstance.changePropsAndRerender()
  //   }
  // );
  // let refs = props.refs;
  // refs = getPrototypeOf(refs) === OBJECT_PROTOTYPE ? refs : {};
  // props.refs = {pushState, ...refs};

}
