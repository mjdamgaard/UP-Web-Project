
import {fetch, clearPermissions} from 'query';
import {join} from 'string';
import {urlActions, urlEvents} from "./urlActions.js";

const fetchTrustClassRouteTemplate = [
  abs("./server/apps.sm.js./callSMF/fetchTrustClass/"),
  "",
];
// TODO: Like the fetchBestSubAppRouteTemplate of AppLoader, implement a
// fundamental setting as well where the users can change this route template.


// Apart from loading the main.jsx component from the directory pointed to by
// appDirID, the job of this component is to also query about whether the given
// app is trusted, and to show a warning message/sign if it is not. The warning
// sign, and whether to show it at all, depends on the "trust class" returned
// by the SMF of the fetchTrustClassRouteTemplate, which can be either
// "trusted", "semi-trusted", "untrusted", or "harmful".
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
    warningIsDismissed: undefined,
  });

  let {AppComponent, trustClass} = fetchedData;

  // Import the app component module at ~/../<appDirID>/main.jsx, and write it
  // to fetchedData as a side-effect.
  let AppComponentProm = AppComponent ? new Promise() :
    import("~/../" + appDirID + "/main.jsx").then(AppComponent => {
      fetchedData.AppComponent = AppComponent;
    });

  // Fetch the trust class, and write it to fetchedData as a side-effect.
  let fetchTrustClassRoute = join(fetchTrustClassRouteTemplate, appDirID);
  let trustClassProm = trustClass ? new Promise() :
    fetch(fetchTrustClassRoute).then(trustClass => {
      fetchedData.trustClass = trustClass;
    });

  // Await the two promises, then queue a rerender manually.
  await Promise.all([AppComponentProm, trustClassProm]);
  this.rerender();
}



export function render({
  appDirID, url, homeURL, tailURL, userID, nodeID, localStorage, sessionStorage
}) {
  this.constants(appDirID); // Reinitialize the component if appDirID changes. 
  let {
    fetchedData: {AppComponent, trustClass},
    warningIsDismissed,
  } = this.state;

  // If the fetchedData isn't ready yet, simply render a fetching div.
  if (!AppComponent || !trustClass) {
    return (
      <div className="app">
        <div className="fetching"></div>
      </div>
    );
  }

  // If the app is trusted, we also hand down the localStorage and
  // sessionStorage as is, but otherwise we redefine and hand down some read-
  // only versions of them instead. IMPORTANT: Any app that wants to set an
  // item of either of these storage objects is required to prefix that item
  // with its own appDirID, or that of an ancestor app, and otherwise it
  // shouldn't be granted trust.
  let childProps = {
    url: url, homeURL: homeURL, tailURL: tailURL, appDirID: appDirID,
    userID: userID, nodeID: nodeID, localStorage: localStorage,
    sessionStorage: sessionStorage
  };
  if (trustClass !== "trusted") {
    childProps = {
      ...childProps, ...getReadOnlyStorageProps(localStorage, sessionStorage),
    }
  }
  return (
    <div className="app">
      <AppWarning key="w" trustClass={trustClass} appDirID={appDirID} />
      <div className={
        "app-component " + trustClass + (warningIsDismissed ? " dismissed" : "")
      }>{(
        (!AppComponent || trustClass === "harmful") ? undefined :
          <AppComponent key="c" {...childProps} />
      )}</div>
    </div>
  );
}



function getReadOnlyStorageProps(localStorage, sessionStorage) {
  return {
    localStorage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: () => {},
      removeItem: () => {},
    },
    sessionStorage: {
      getItem: (key) => sessionStorage.getItem(key),
      setItem: () => {},
      removeItem: () => {},
    },
  };
}




export const events = [
  ...urlEvents,

  "warning-was-dismissed",
];


export const actions = {
  ...urlActions,

  "warning-was-dismissed": function(_, childKey) {
    // Check that the event was triggered by the AppWarning child before
    // setting the warningIsDismissed state property.
    if (childKey === "w") {
      this.setState(state => ({...state, warningIsDismissed: true}));
    }
  },
};
