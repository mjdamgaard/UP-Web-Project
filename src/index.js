
import {
  ScriptInterpreter, getExtendedErrorMsg
} from "./interpreting/ScriptInterpreter.js";
import {queryServer} from "./dev_lib/query/src/queryServer.js";
import {CAN_CREATE_APP_FLAG} from "./dev_lib/jsx/jsx_components.js";

import {main as constructAccountMenu} from "./account_menu/account_menu.js"

import {settings} from "./dev_lib/jsx/settings/SettingsObject.js";


/* Static developer libraries */

import * as queryMod from "./dev_lib/query/query.js";
import * as basicSettingsMod from "./dev_lib/jsx/settings/SettingsObject.js";
import * as jsxMod from "./dev_lib/jsx/jsx_components.js";
import * as TextAreaMod from "./dev_lib/jsx/dev_components/TextArea.js";
import * as InputTextMod from "./dev_lib/jsx/dev_components/InputText.js";
import * as InputRangeMod from "./dev_lib/jsx/dev_components/InputRange.js";
import * as InputRadioMod from "./dev_lib/jsx/dev_components/InputRadio.js";
import * as InputCheckboxMod from "./dev_lib/jsx/dev_components/InputCheckbox.js";
import * as InputNumberMod from "./dev_lib/jsx/dev_components/InputNumber.js";
import * as LabelMod from "./dev_lib/jsx/dev_components/Label.js";
import * as ILinkMod from "./dev_lib/jsx/dev_components/ILink.js";
import * as ELinkMod from "./dev_lib/jsx/dev_components/ELink.js";
import * as ImgMod from "./dev_lib/jsx/dev_components/Img.js";
import * as jsonMod from "./dev_lib/fundamentals/json.js";
import * as stringMod from "./dev_lib/fundamentals/string.js";
import * as arrayMod from "./dev_lib/fundamentals/array.js";
import * as objectMod from "./dev_lib/fundamentals/object.js";
import * as mathMod from "./dev_lib/fundamentals/math.js";
import * as dateMod from "./dev_lib/fundamentals/date.js";
import * as promiseMod from "./dev_lib/fundamentals/promise.js";
import * as numberMod from "./dev_lib/fundamentals/number.js";
import * as hexMod from "./dev_lib/conversion/hex.js";
import * as errorMod from "./dev_lib/error.js";
import * as typeMod from "./dev_lib/type.js";
import * as routeMod from "./dev_lib/route.js";
import * as pathMod from "./dev_lib/path.js";
import * as scoredListsMod from "./dev_lib/semantic_entities/scored_lists.js";
import * as entitiesMod from "./dev_lib/semantic_entities/entities.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("settings1", basicSettingsMod);
staticDevLibs.set("jsx", jsxMod);
staticDevLibs.set("TextArea.jsx", TextAreaMod);
staticDevLibs.set("InputText.jsx", InputTextMod);
staticDevLibs.set("InputRange.jsx", InputRangeMod);
staticDevLibs.set("InputRadio.jsx", InputRadioMod);
staticDevLibs.set("InputCheckbox.jsx", InputCheckboxMod);
staticDevLibs.set("InputNumber.jsx", InputNumberMod);
staticDevLibs.set("Label.jsx", LabelMod);
staticDevLibs.set("ILink.jsx", ILinkMod);
staticDevLibs.set("ELink.jsx", ELinkMod);
staticDevLibs.set("Img.jsx", ImgMod);
staticDevLibs.set("json", jsonMod);
staticDevLibs.set("string", stringMod);
staticDevLibs.set("array", arrayMod);
staticDevLibs.set("object", objectMod);
staticDevLibs.set("math", mathMod);
staticDevLibs.set("date", dateMod);
staticDevLibs.set("promise", promiseMod);
staticDevLibs.set("number", numberMod);
staticDevLibs.set("hex", hexMod);
staticDevLibs.set("error", errorMod);
staticDevLibs.set("type", typeMod);
staticDevLibs.set("route", routeMod);
staticDevLibs.set("path", pathMod);
staticDevLibs.set("scored_lists", scoredListsMod);
staticDevLibs.set("entities", entitiesMod);



if (typeof(Storage) === "undefined") {
  alert(
    "This web application requires browser support for local " +
    "storage in order to function correctly. Please turn on local storage, " +
    "or use a different browser."
  );
}


// Create some global contexts which defines some reserved props of the app
// component (and which will make the app rerender when they change).
class AppContext {
  constructor(val) {
    this.val = val;
    this.subscriberCallbacks = [];
  }
  getVal() {
    return this.val;
  }
  setVal(val) {
    this.val = val;
    this.subscriberCallbacks.forEach(callback => callback(val));
  }
  update(updateCallback) {
    updateCallback(this.val);
    this.subscriberCallbacks.forEach(callback => callback(this.val));
  }
  addSubscriberCallback(callback) {
    this.subscriberCallbacks.push(callback);
  }
}

const settingsContext = new AppContext(settings);
const urlContext = new AppContext({
  url: window.location.pathname.replace(/\/$/, ""), stateJSON: "null"
});

// Create a popstate event that updates the urlContext.
window.addEventListener("popstate", (event) => {
  let url = window.location.pathname.replace(/\/$/, "");
  let urlData = {url: url, stateJSON: event.state};
  urlContext.setVal(urlData);
});


// Set up the account menu, used for account-related settings and user
// preferences.
constructAccountMenu(settingsContext, urlContext);


// Initialize the interpreter.
const scriptInterpreter = new ScriptInterpreter(
  false, queryServer, undefined, staticDevLibs, undefined
);


// Initialize a continuously self-refilling gas object for the app.
const FRESH_APP_GAS = {
  comp: 1000000,
  import: 1000,
  fetch: 200,
  post: 30,
  time: Infinity,
};
const appGas = Object.assign({}, FRESH_APP_GAS);
setInterval(
  () => Object.assign(appGas, FRESH_APP_GAS),
  10000
);

// The script the initializes the UP app.
const TEST_APP_ID = "2";
const mainScript = `
  import {createJSXApp} from 'jsx';
  import {settings} from 'settings1';
  import * as app from "/1/${TEST_APP_ID}/main.jsx";

  export function main() {
    createJSXApp(app, {}, settings);
  }
`;

const flags = [CAN_CREATE_APP_FLAG];


// Run the main script to create the app.
scriptInterpreter.interpretScript(
  appGas, mainScript, undefined, [], flags,
  {settingsContext: settingsContext, urlContext: urlContext},
).then(
  ([output, log]) => {
    if (log?.error) {
      console.error(getExtendedErrorMsg(log.error));
    }
    console.log("UP app script exited with output and log:");
    console.log(output);
    console.log(log);
  }
).catch(err => console.error(err));

