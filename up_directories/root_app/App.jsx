
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
  // Preserve the trustIdentCache state property between reinitializations
  // (caused by the this.constants() call below, namely if appDirID changed).
  let {trustIdentCache} = this.state;
  this.setState({
    AppComponent: undefined,
    warningIsExpanded: undefined,
    trustIdentCache: trustIdentCache ?? new MutableObject(),
    ref: {
      trustIdent: undefined,
    },
  });

  // Import the app component module at ~/../<appDirID>/main.jsx.
  let AppComponent = await import("~/../" + appDirID + "/main.jsx");
  this.setState(state => ({...state, AppComponent: AppComponent}));
}


export function render({appDirID, homeURL, tailURL}) {
  this.constants(appDirID); // Reinitialize the component if appDirID changes. 
  let {
    AppComponent, warningIsExpanded, trustIdentCache, ref: {trustIdent}
  } = this.state;

  // Get trustIdent from the state, and if it is undefined, fetch the value.
  if (trustIdent === undefined) {
    trustIdent = trustIdentCache[appDirID];
    // If trustIdent was found in the cache, set the trustIdent ref state in
    // order to reduce cache lookups. (This will not trigger a rerender.) 
    if (trustIdent !== undefined) {
      this.setState(state => ({
        ...state, ref: {...state.ref, trustIdent: trustIdent},
      }));
    }

    // Else fetch the trustIdent.
    else {
      let fetchTrustIdentRoute = join(fetchTrustIdentRouteTemplate, appDirID);
      fetch(fetchTrustIdentRoute).then(trustIdent => {
        trustIdentCache[appDirID] = trustIdent;
        this.setState(state => ({
          ...state, ref: {...state.ref, trustIdent: trustIdent},
        }));
      });
    }
  }

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
};



export const styleSheets = [
  abs("./style.css"),
];
