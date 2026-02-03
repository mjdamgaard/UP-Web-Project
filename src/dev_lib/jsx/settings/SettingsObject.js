
import {
  getAbsolutePath, mapValues, ErrorWrapper,
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

  async initiate(userID, rootInstance, node, env) {
    this.userID = userID;
    this.appComponent = rootInstance.componentModule;
    this.initNode = node;
    this.initEnv = env;
    this.styleModules = new Map();

    clearSettingsData(rootInstance);
    
    this.appStyler = appStyler;
    return await this.appStyler.initiate(this.appComponent, this, node, env);
  }


  getUserID() {
    return this.userID;
  }


  changeUser(userID) {
    this.userID = userID;
  }


  prepareComponent(componentModule, node, env) {
    return this.appStyler.prepareComponent(componentModule, node, env);
  }

  prepareInstance(jsxInstance, node, env) {
    return this.appStyler.prepareInstance(jsxInstance, node, env);
  }

  // TODO: At some point reimplement this to look up the trust of the
  // component by some user group chosen by the user's settings.
  getClientTrust(componentPath, node, env) {
    return componentPath.substring(0, 5) === "/1/2/";
  }

  getRequestOriginData(jsxInstance) {
    // If the request origin data is already recorded for the instance, return that.
    let {componentID, requestOriginData} = jsxInstance.settingsData;
    if (requestOriginData !== undefined) {
      return requestOriginData;
    }

    // Else if the parent instance has the same componentID, get it from that.
    // (Recall that componentID is the ID of the component at the root of the
    // current app scope, not necessarily that of jsxInstance.)
    let {
      componentID: parentComponentID,
      requestOriginData: parentRequestOriginData
    } = jsxInstance.parentInstance?.settingsData ?? {};
    if (parentComponentID === componentID) {
      let requestOriginData = (parentRequestOriginData !== undefined) ?
        parentRequestOriginData :
        this.getRequestOriginData(jsxInstance.parentInstance);
      return jsxInstance.settingsData.requestOriginData = requestOriginData;
    }

    // Else jsxInstance must be the root of an app scope, in which case the
    // isTrusted value should be gotten from appStyler.componentTrustValues,
    // unless the parent scope already isn't trusted.
    // And the request origin should be jsxInstance.componentPath, unless the
    // parent scope is not trusted, in which case it should just be false
    // instead.
    // Also, if the jsxInstance has no parent, behave as if the parent scope
    // is trusted.
    else {
      let parentIsTrusted = !jsxInstance.parentInstance ? true :
        this.getRequestOriginData(jsxInstance.parentInstance)[0];
      let isTrusted = parentIsTrusted &&
        this.appStyler.componentTrustValues[componentID];
      let requestOrigin = parentIsTrusted ? jsxInstance.componentPath : false;
      let requestOriginData = [isTrusted, requestOrigin]
      return jsxInstance.settingsData.requestOriginData = requestOriginData;
    }
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
      if (styleModule instanceof ErrorWrapper) {
        throw styleModule.val;
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
      styleModulePromise = interpreter.import(styleModulePath, node, env).then(
        x => x, err => new ErrorWrapper(err)
      );
    }
    else {
      let styleSheetPromises = mapValues(styleSheetPaths, node, env, path => {
        let absPath = getAbsolutePath(componentPath, path, node, env);
        return interpreter.import(absPath, node, env).then(
          x => x, err => new ErrorWrapper(err)
        );
      });
      styleModulePromise = Promise.all(styleSheetPromises).then(resultArr => {
        let wrappedError = resultArr.reduce(
          (acc, val) => acc ?? (val instanceof ErrorWrapper ? val : undefined),
          undefined
        );
        return wrappedError ?? resultArr;
      });
    }

    // Cache the styleModule promise, and then it resolves, replace it with the
    // result in the cache.
    this.styleModules.set(componentPath, styleModulePromise);
    styleModulePromise.then(styleModule => {
      this.styleModules.set(componentPath, styleModule);
    });

    // Then wait for styleModule and return it.
    styleModule = await styleModulePromise;
    if (styleModule instanceof ErrorWrapper) {
      throw styleModule.val;
    }
    return styleModule;
  }
}



function clearSettingsData(jsxInstance) {
  jsxInstance.settingsData = {};
  jsxInstance.childInstances.forEach(
    childInstance => clearSettingsData(childInstance)
  );
}


export const settings = new SettingsObject01();

export {settings as default};

