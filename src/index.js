
import {
  ScriptInterpreter, getExtendedErrorMsg
} from "./interpreting/ScriptInterpreter.js";
import {queryServer} from "./dev_lib/query/src/queryServer.js";
import {CAN_CREATE_APP_FLAG} from "./dev_lib/jsx/jsx_components.js";

import {main as constructAccountMenu} from "./account_menu/account_menu.js"


/* Static developer libraries */

import * as queryMod from "./dev_lib/query/query.js";
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
import * as numberMod from "./dev_lib/fundamentals/number.js";
import * as mathMod from "./dev_lib/fundamentals/math.js";
import * as dateMod from "./dev_lib/fundamentals/date.js";
import * as promiseMod from "./dev_lib/fundamentals/promise.js";
import * as hexMod from "./dev_lib/conversion/hex.js";
import * as errorMod from "./dev_lib/error.js";
import * as scriptMod from "./dev_lib/script.js";
import * as typeMod from "./dev_lib/type.js";
import * as routeMod from "./dev_lib/route.js";
import * as pathMod from "./dev_lib/path.js";
import * as accountMod from "./dev_lib/account.js";
import * as scoredListsMod from "./dev_lib/semantic_entities/scored_lists.js";
import * as entitiesMod from "./dev_lib/semantic_entities/entities.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("jsx", jsxMod);
staticDevLibs.set("TextArea", TextAreaMod);
staticDevLibs.set("InputText", InputTextMod);
staticDevLibs.set("InputRange", InputRangeMod);
staticDevLibs.set("InputRadio", InputRadioMod);
staticDevLibs.set("InputCheckbox", InputCheckboxMod);
staticDevLibs.set("InputNumber", InputNumberMod);
staticDevLibs.set("Label", LabelMod);
staticDevLibs.set("ILink", ILinkMod);
staticDevLibs.set("ELink", ELinkMod);
staticDevLibs.set("Img", ImgMod);
staticDevLibs.set("json", jsonMod);
staticDevLibs.set("string", stringMod);
staticDevLibs.set("array", arrayMod);
staticDevLibs.set("object", objectMod);
staticDevLibs.set("number", numberMod);
staticDevLibs.set("math", mathMod);
staticDevLibs.set("date", dateMod);
staticDevLibs.set("promise", promiseMod);
staticDevLibs.set("hex", hexMod);
staticDevLibs.set("error", errorMod);
staticDevLibs.set("script", scriptMod);
staticDevLibs.set("type", typeMod);
staticDevLibs.set("route", routeMod);
staticDevLibs.set("path", pathMod);
staticDevLibs.set("account", accountMod);
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
class ScriptContext {
  constructor(val) {
    this.val = val;
    this.subscriberCallbacks = [];
  }
  setVal(val) {
    let prevVal = this.val;
    this.val = val;
    this.subscriberCallbacks.forEach(callback => callback(val, prevVal));
    return prevVal;
  }
  addSubscriberCallback(callback) {
    this.subscriberCallbacks.push(callback);
  }
}

const userContext = new ScriptContext({userID: undefined});
let pathname = window.location.pathname;
const urlContext = new ScriptContext({
  pathname: pathname,
  segments: pathname.replace(/^\//, "").replace(/\/$/, "").split("/"),
  state: null,
  popstateCallbacks: new Map(),
});
window.addEventListener("popstate", event => {
  let prevURLData = urlContext.val;
  let {popstateCallbacks} = prevURLData;

  // Set the new urlData.
  let pathname = window.location.pathname;
  let urlData = {
    pathname: pathname,
    segments: pathname.replace(/^\//, "").replace(/\/$/, "").split("/"),
    state: event.state,
    popstateCallbacks: popstateCallbacks,
  };

  // Set the new urlContext.
  urlContext.setVal(urlData);

  // Run the popstateCallbacks on the new and previous urlData.
  popstateCallbacks.forEach(callback => callback(urlData, prevURLData));
});


// Set up the account menu, used for account-related settings and user
// preferences.
constructAccountMenu(userContext, urlContext); // TODO: Remove.


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


// TODO: Implement looking in localStorage for an alternative main script,
// preferred by the user, which, in case they have one, should be gotten along
// with the userID and authToken when the user logs in. Also implement another
// HTML server on a subdomain, which the user can go to, log in (since they are
// never logged in already there), and then reset their main script, in case
// they have experimented with another one (which they trust not to hack them),
// and also be able to set a new preferred main script, of course with ample
// warning that they can get hacked if they don't trust the main script enough,
// or don't know what they are doing.


// The script the initializes the UP app.
const UP_NODE_ID = "1";
const BASE_APP_ID = "2";
const mainScript = `
  import {createJSXApp} from 'jsx';
  import * as app from "/${UP_NODE_ID}/${BASE_APP_ID}/main.jsx";

  export function main() {
    createJSXApp(app);
  }
`;

const flags = [CAN_CREATE_APP_FLAG];


// Run the main script to create the app.
scriptInterpreter.interpretScript(
  appGas, mainScript, undefined, [], flags,
  {userContext: userContext, urlContext: urlContext},
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

