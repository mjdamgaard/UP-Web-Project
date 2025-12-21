import {
  DevFunction, forEachValue, LiveJSModule, PromiseObject, RuntimeError,
  LiveJSModule as SCSSModule, getAbsolutePath, mapValues,
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
    this.initNode = node;
    this.initEnv = env;
    this.styleModules = new Map();
    
    this.appStyler = appStyler;
    return await this.appStyler.initiate(appComponent, this, node, env);
  }


  getUserID() {
    return this.userID;
  }


  changeUser(userID, node = this.initNode, env = this.initEnv) {
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

  getAppScopeRoot(jsxInstance, node, env) {
    return this.appStyler.getAppScopeRoot(jsxInstance, node, env);
  }

  isOutsideFocusedAppScope(jsxInstance, node, env) {
    return this.appStyler.isOutsideFocusedAppScope(jsxInstance, node, env);
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

    // TODO: Implement looking in some scored list to see if there's a
    // styleModule route with a high enough score that this module should
    // be used instead of the componentModule.


    // If no overriding style module is found, look first if the component
    // exports a 'styleModulePath' variable from which to get the style
    // transform, or if it exports a "styleSheetPaths" variable, which is a
    // short-hand yields a style transform where all instance children inherit
    // the same style transform, except if their key starts with a "_".
    let styleModulePromise;
    let styleModulePath = componentModule.get("styleModulePath") ??
      componentModule.get("styleModule");
    let styleSheetPaths = componentModule.get("styleSheetPaths") ??
      componentModule.get("styleSheets") ?? [];
    if (styleModulePath) {
      styleModulePath = getAbsolutePath(
        componentPath, styleModulePath, node, env
      );
      styleModulePromise = interpreter.import(
        styleModulePath, node, env
      ).then();
    }
    else {
      let styleSheetPromises = mapValues(styleSheetPaths, node, env, path => {
        let absPath = getAbsolutePath(componentPath, path, node, env);
        return interpreter.import(absPath, node, env).then();
      });
      styleModulePromise = Promise.all(styleSheetPromises).then();
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

