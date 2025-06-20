import {
  DevFunction, forEachValue, LiveModule, PromiseObject, RuntimeError,
  SASSModule,
} from "../../../interpreting/ScriptInterpreter.js";
import {APP_COMPONENT_PATH_FLAG} from "../jsx_components.js";

const CLASS_REGEX = /^([a-zA-Z][a-z-A-Z0-9\-]*)_([a-zA-Z][a-z-A-Z0-9\-]*)$/;
const STYLE_SHEET_ID_REGEX = /^[a-zA-Z][a-z-A-Z0-9\-]$/;

let nonce = 1;
function getNonce() {
  return nonce++;
}

const styleSheetIDs = new Map();
const styleSheetRoutes = new Map();


export const getSettings = new DevFunction(
  {},
  ({callerNode, execEnv}, [liveModule]) => {
    if (liveModule instanceof LiveModule) {
      let modulePath = liveModule.modulePath;
      let appComponentPath = execEnv.getFlag(APP_COMPONENT_PATH_FLAG);
      let isAppRoot = modulePath === appComponentPath;
      let isTrustedPromObj = new PromiseObject(new Promise(
        resolve => resolve(false)
      ));
      let styleSheets = liveModule.members["styleSheets"] ?? {};
      let classTransform = liveModule.members["classTransform"] ?? [];

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
    else if (liveModule instanceof SASSModule) {
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
