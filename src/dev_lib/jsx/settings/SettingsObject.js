import {
  DevFunction, forEachValue, LiveJSModule, PromiseObject, RuntimeError,
  LiveJSModule as SCSSModule, getFullPath, mapValues,
} from "../../../interpreting/ScriptInterpreter.js";
import {SettingsObject} from "../jsx_components.js";
import {appStyler} from "./src/AppStyler.js";

const CLASS_REGEX = /^([a-zA-Z][a-z-A-Z0-9\-]*)_([a-zA-Z][a-z-A-Z0-9\-]*)$/;
const STYLE_SHEET_ID_REGEX = /^[a-zA-Z][a-z-A-Z0-9\-]$/;

let nonce = 1;
function getNonce() {
  return nonce++;
}

const styleSheetIDs = new Map();
const styleSheetRoutes = new Map();



export class SettingsObject01 extends SettingsObject {

  async initiate(userID, appComponent, node, env) {
    this.userID = userID;
    this.appComponent = appComponent;
    this.styleModules = new Map();
    
    this.appStyler = appStyler;
    return await this.appStyler.initiate(appComponent, this, node, env);
  }


  getUserID() {
    return this.userID;
  }


  changeUser(userID, node, env) {
    if (this.appComponent) {
      this.initiate(userID, this.appComponent, node, env);
    }
    else {
      this.userID = userID;
    }
  }


  prepareComponent(componentModule, node, env) {
    return this.appStyler.prepareComponent(componentModule, node, env);
  }

  prepareInstance(jsxInstance, node, env) {
    return this.appStyler.prepareInstance(jsxInstance, node, env);
  }

  // TODO: At some point reimplement this such that certain components can get
  // "CLIENT_TRUST", other than the outer app component, and make this be able
  // to depend on user preferences as well.
  getClientTrust(requestOrigin, node, env) {
    return requestOrigin === this.appComponent;
  }

  getRequestOrigin(jsxInstance) {
    let {componentID} = jsxInstance.settingsData;
    return this.appStyler.componentPaths[componentID];
  }

  transformInstance(jsxInstance, domNode, ownDOMNodes, node, env) {
    return this.appStyler.transformInstance(
      jsxInstance, domNode, ownDOMNodes, node, env
    );
  }


  async getStyleModule(componentModule, node, env) {
    let {interpreter} = env.scriptVars;

    // See if the styleModule for the given component has already been decided,
    // or if there's a promise for it pending, and if so return it, waiting for
    // it first if it's a promise.
    let componentPath = componentModule.modulePath;
    let styleModule = this.styleModules.get(componentPath);
    if (styleModule !== undefined) {
      if (styleModule instanceof Promise) {
        styleModule = await styleModule;
      }
      return styleModule;
    }

    // TODO: Implement looking in some semantic list to see if there's a
    // styleModule route with a high enough score that this module should
    // be used instead of the componentModule.


    // If no overriding style module is found, look first if the component
    // exports a 'stylePath' parameter from which to get the style transform,
    // and else use the componentModule itself, in case the user exports the
    // default transform (and default transformProps) from there. Or if the
    // component exports a 'styleSheetPaths' array parameter, we let
    // styleModule be an array of (imported) modules, which is also allowed.
    let styleModulePromise;
    let styleSheetPaths = componentModule.get("styleSheetPaths") ??
      componentModule.get("styleSheets");
    if (styleSheetPaths) {
      let styleSheetPromises = mapValues(styleSheetPaths, node, env, path => (
        interpreter.import(path, node, env)
      ));
      styleModulePromise = Promise.all(styleSheetPromises);
    }
    else {
      let stylePath = componentModule.get("stylePath") || componentPath;
      stylePath = getFullPath(componentPath, stylePath, node, env);
      styleModulePromise = interpreter.import(stylePath, node, env);
    }

    // Cache the styleModule promise, and then it resolves, replace it with the
    // result in the cache.
    this.styleModules.set(componentPath, styleModulePromise);
    styleModulePromise.then(styleModule => {
      this.styleModules.set(componentPath, styleModule);
    });

    // Then wait for styleModule and return it.
    styleModule = await styleModulePromise;
    return styleModule;
  }
}


export const settings = new SettingsObject01();

export {settings as default};







// TODO: Remove this old code:

export const getSettings = new DevFunction(
  "getSettings", {}, ({callerNode, execEnv}, [liveModule]) => {
    if (liveModule instanceof LiveJSModule) {
      let modulePath = liveModule.modulePath;
      let appComponentPath = undefined; // execEnv.getFlag(APP_COMPONENT_PATH_FLAG);
      let isAppRoot = modulePath === appComponentPath;
      let isTrustedPromObj = new PromiseObject(new Promise(
        resolve => resolve(false)
      ));
      let styleSheets = liveModule.get("styleSheets") ?? {};
      let classTransform = liveModule.get("classTransform") ?? [];

      // Record or transform all the style sheet IDs in both styleSheets and
      // classTransform, such that their are no unwanted clashes globally.
      [styleSheets, classTransform] = recordOrTransformStyleSheetIDs(
        styleSheets, classTransform, styleSheetIDs, styleSheetRoutes,
        isAppRoot, modulePath, callerNode, execEnv
      );

      let styleSheetsPromObj = new PromiseObject(new Promise(
        resolve => resolve(styleSheets)
      ));
      let classTransformPromObj = new PromiseObject(new Promise(
        resolve => resolve(classTransform)
      ));
      return {
        isTrusted: isTrustedPromObj,
        styleSheets: styleSheetsPromObj,
        classTransform: classTransformPromObj,
      };
    }
    else if (liveModule instanceof SCSSModule) {
      let isTrustedPromObj = new PromiseObject(new Promise(
        resolve => resolve(false)
      ));
      return {
        isTrusted: isTrustedPromObj,
      };
    }
    else throw "getSettings(): Unexpected liveModule type";
  },
);





export function recordOrTransformStyleSheetIDs(
  styleSheets, classTransform, styleSheetIDs, styleSheetRoutes, isAppRoot,
  modulePath, node, env
) {
  // First go through each style sheet declared by the component and store the
  // ID--route pair in the two styleSheets Maps. But if the route has already
  // been assigned another ID, or if the ID has been used for a different
  // route, record (in idTransform) that the ID should then be transformed
  // in the returned styleSheets object, as well as in the right-hand sides of
  // the rules in the classTransform.
  let idTransform = {};
  let retStyleSheets = {}; 
  forEachValue(styleSheets, node, env, (route, id) => {
    if (!STYLE_SHEET_ID_REGEX.test(id)) throw new RuntimeError(
      `Invalid style sheet ID: "${id}"`
    );
    // If the route has already been assigned an ID, use that instead of the
    // current one, at this point by adding the ID pair to idTransform and
    // continuing the iteration,
    let existingID = styleSheetIDs.get(route);
    if (existingID) {
      idTransform[id] = existingID;
      retStyleSheets[existingID] = route;
      return;
    }

    // Then if the ID have already been used, or if it is a reserved one, such
    // as "base" (which is here reserved only for the app's root component to
    // define), transform it to another one by appending a nonce to it.
    let newID = id;
    let existingRoute = (id === "base" && !isAppRoot) ?
      styleSheetRoutes.get(id) : true;
    if (existingRoute) {
      newID = `${id}_${getNonce()}`;
      idTransform[id] = newID;
    }
    styleSheetRoutes.set(newID, route);
    styleSheetIDs.set(route, newID);
    retStyleSheets[newID] = route;
  });

  // Now go through each class transform rule and transform necessary the IDs
  // in the RHSs.
  if (!(classTransform instanceof Array)) throw new RuntimeError(
    `Invalid classTransform exported by ${modulePath}`,
    node, env
  );
  let retClassTransform = classTransform.map(rule => {
  if (!(rule instanceof Array)) throw new RuntimeError(
    `Invalid classTransform exported by ${modulePath}`,
    node, env
  );
    let [selector, classStr] = rule;
    if (typeof classStr !== "string") throw new RuntimeError(
      `Invalid classTransform exported by ${modulePath}`,
      node, env
    );
    let newClassStr = classStr.replaceAll(CLASS_REGEX, (_, id, name) => {
      let newID = idTransform[id] ?? id;
      return `${newID}_${name}`;
    });
    return [selector, newClassStr];
  });

  return [retStyleSheets, retClassTransform];
}
