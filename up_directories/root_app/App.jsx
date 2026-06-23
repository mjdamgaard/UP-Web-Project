
import {fetch, clearPermissions} from 'query';
import {join} from 'string';
import {urlActions, urlEvents} from "./urlActions.js";

const fetchTrustIdentRouteTemplate = [
  abs("./server/apps.sm.js./callSMF/fetchTrustIdentifier/"),
  "",
];
// TODO: Like the fetchBestSubAppRouteTemplate of AppLoader, implement a
// fundamental setting as well where the users can change this route template.


// Apart from loading the main.jsx component from the directory pointed to by
// appDirID, the job of this component is to also query about whether the given
// app is trusted, and to show a warning message/sign if it is not. The warning
// sign, and whether to show it at all, depends on the "trust identifier"
// returned by the SMF of the fetchTrustIdentRouteTemplate, which can be either
// "trusted", "untrusted", or "harmful".
// Also, when the warning message is expanded (possibly due to the user
// clicking on the warning sign), this component needs to trigger the
// "showHeader" event, and needs to stop any triggering of "hideHeader" from
// the descendants.


export async function initialize({appDirID}) {
  // Preserve the fetchedDataCache state property between reinitializations
  // (caused by the this.constants() call below, namely if appDirID changed).
  let {fetchedDataCache = new MutableObject()} = this.state;
  let fetchedData = fetchedDataCache[appDirID] ??= new MutableObject();
  this.setState({
    // State data fetched by this initialize() function, and a cache for it: 
    fetchedDataCache: fetchedDataCache,
    fetchedData: fetchedData,

    // State data that depends on user input: 
    warningIsExpanded: undefined,
  });

  let {AppComponent, trustIdent} = fetchedData;

  // Import the app component module at ~/../<appDirID>/main.jsx, and write it
  // to fetchedData as a side-effect.
  let AppComponentProm = AppComponent ? new Promise() :
    import("~/../" + appDirID + "/main.jsx").then(AppComponent => {
      fetchedData.AppComponent = AppComponent;
    });

  // Fetch the trust identifier, and write it to fetchedData as a side-effect.
  let fetchTrustIdentRoute = join(fetchTrustIdentRouteTemplate, appDirID);
  let trustIdentProm = trustIdent ? new Promise() :
    fetch(fetchTrustIdentRoute).then(trustIdent => {
      fetchedData.trustIdent = trustIdent;
    });

  // Await the two promises, then queue a rerender manually.
  await Promise.all([AppComponentProm, trustIdentProm]);
  this.rerender();
}



export function render({appDirID, homeURL, tailURL}) {
  this.constants(appDirID); // Reinitialize the component if appDirID changes. 
  let {
    fetchedData: {AppComponent, trustIdent},
    warningIsExpanded,
  } = this.state;

  // If ...
  return (
    <div className="app">
      <div className="warning-container">

      </div>
      
    </div>
  );
}



export const events = [
  ...urlEvents,

  "hideWarning",
  "showWarning",
  "hideHeader",
  "showHeader",
];


export const actions = {
  ...urlActions,

  "hideWarning": function(_, childKey) {
    // ...
  },
  "showWarning": function(_, childKey) {
    // ...
  },

  // Overwrite the "hideHeader" event to only work if the the warning isn't
  // expanded... ..Hm, do I want to queue the hideHeader signals, though?..
  "hideHeader": function() {
    // ...
  },
  "showHeader": function() {
    // ...
  },
};



export const styleSheets = [
  abs("./style.css"),
];
