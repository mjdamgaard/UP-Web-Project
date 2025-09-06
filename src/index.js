
import {
  ScriptInterpreter, getExtendedErrorMsg
} from "./interpreting/ScriptInterpreter.js";
import {queryServer} from "./dev_lib/query/src/queryServer.js";
import {CAN_CREATE_APP_FLAG} from "./dev_lib/jsx/jsx_components.js";

import {main as constructAccountMenu} from "./account_menu/account_menu.js"

import {settings} from "./dev_lib/jsx/settings/SettingsObject.js";

/* Tests */

// import {runTests} from "./testing/parsing_interpreting_tests.js";


/* Static developer libraries */

import * as queryMod from "./dev_lib/query/query.js";
import * as basicSettingsMod from "./dev_lib/jsx/settings/SettingsObject.js";
import * as jsxMod from "./dev_lib/jsx/jsx_components.js";
import * as textareaCompMod from "./dev_lib/jsx/dev_components/Textarea1.js";
import * as jsonMod from "./dev_lib/fundamentals/json.js";
import * as stringMod from "./dev_lib/fundamentals/string.js";
import * as arrayMod from "./dev_lib/fundamentals/array.js";
import * as mathMod from "./dev_lib/fundamentals/math.js";
import * as reqOrigMod from "./dev_lib/request_origin.js";
import * as hexMod from "./dev_lib/conversion/hex.js";
import * as errorMod from "./dev_lib/error.js";
import * as scoredListsAlgMod from "./dev_lib/array_algorithms/scored_lists.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("settings1", basicSettingsMod);
staticDevLibs.set("jsx", jsxMod);
staticDevLibs.set("Textarea1.jsx", textareaCompMod);
staticDevLibs.set("json", jsonMod);
staticDevLibs.set("string", stringMod);
staticDevLibs.set("array", arrayMod);
staticDevLibs.set("math", mathMod);
staticDevLibs.set("request_origin", reqOrigMod);
staticDevLibs.set("hex", hexMod);
staticDevLibs.set("error", errorMod);
staticDevLibs.set("scored_lists", scoredListsAlgMod);



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
  url: window.location.pathname, stateJSON: "null"
});

// Create a popstate event that updates the urlContext.
window.addEventListener("popstate", (event) => {
  let urlData = {url: url, stateJSON: event.state};
  urlContext.setVal(urlData);
});


// Set up the account menu, used for account-related settings and user
// preferences.
constructAccountMenu(settingsContext);

// Set the url data for urlContext.
let {pathname, search, hash} = window.location;
urlContext.setVal({pathname: pathname, search: search, hash: hash, state: {}});



const scriptInterpreter = new ScriptInterpreter(
  false, queryServer, undefined, staticDevLibs, undefined
);


// Initialize a continuously self-refilling gas object for the app.
const FRESH_APP_GAS = {
  comp: 100000,
  import: 100,
  fetch: 100,
  time: Infinity,
};
const appGas = Object.assign({}, FRESH_APP_GAS);
setInterval(
  () => Object.assign(appGas, FRESH_APP_GAS),
  10000
);

// The script the initializes the UP app.
const TEST_APP_ID = "A";
const mainScript = `
  import {createJSXApp} from 'jsx';
  import {settings} from 'settings1';
  import * as testApp from "/1/${TEST_APP_ID}/main.jsx";

  export function main() {
    createJSXApp(testApp, {}, settings);
  }
`;

const flags = [CAN_CREATE_APP_FLAG];

// runTests();

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










// import React from 'react';
// import ReactDOM from 'react-dom/client';

// // import {
// //   BrowserRouter, Routes,
// //   createBrowserRouter,
// //   RouterProvider,
// // } from "react-router-dom";


// import {App} from './components/App.js';


// const myElement = (
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// const root = ReactDOM.createRoot(document.getElementById('root'), {
//   // identifierPrefix: '',
// });
// root.render(myElement);
