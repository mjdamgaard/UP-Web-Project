
import {clearPermissions} from 'query';
import {urlActions, urlEvents} from "./urlActions.js";

import {substring, split} from 'string';
import {fetchPrivate, fetch} from 'query';
import {hasType, verifyType} from 'type';

const fetchBestSubAppRouteSubstring = abs(
  "./server/apps.sm.js./callSMF/fetchPreferredSubApp/0"
);
// TODO: Implement a fundamental settings page where users can change this
// SMF route for fetching the best sub-app (with ample warnings about doing so).



export function render(props) {
  let {url, homeURL, tailURL, history, userID} = props;
  this.constants(userID);
  let {appDirID, userID: prevUserID} = history.state;

  // Parse the appDirIDSegment from the URL.
  let appDirIDSegment = getFirstSegment(tailURL);
  if (!hasType(appDirIDSegment, "hex")) {
    return "404 error: Missing page."; // TODO: Improve.
  }

  // If the history.state.appDirID has already been set, and for the same user,
  // simply load the app of this appDirID.
  if (appDirID && prevUserID === userID) {
    let newHomeURL = homeURL + "/" + appDirIDSegment;
    let newTailURL = substring(url, newHomeURL.length);
    return (
      <div className="app">
        <App {...props} key="a"
          appDirID={appDirID} homeURL={newHomeURL} tailURL={newTailURL}
        />
      </div>
    );
  }

  // Else call an action to load a new app derived from the appDirIDSegment.
  // When resolving, this action triggers the "replaceState" event to update
  // the history.state.
  this.do("loadNewApp", appDirIDSegment);
  return (
    <div className="app">
      <div className="fetching">"..."</div>
    </div>
  );
}



export const events = [
  ...urlEvents,
  "pushState",
  "replaceState",
];


export const actions = {
  ...urlActions,

  // AppLoader needs to overwrite the push/replaceState actions/events from
  // urlActions, such that they use the api.js module to transform the
  // appDirIDSegment to the ID of the most general app that implements the
  // given tailURL.
  "pushState": async function(stateAndURL) {
    stateAndURL = await this.do("getTransformedStateAndURL", stateAndURL);
    return this.trigger("pushState", stateAndURL);
  },
  "replaceState": async function(stateAndURL) {
    stateAndURL = await this.do("getTransformedStateAndURL", stateAndURL);
    return this.trigger("replaceState", stateAndURL);
  },

  "getTransformedStateAndURL": async function([childState = null, url]) {
    let {history: {state}, homeURL} = this.props;
    let {appDirID} = state ??= {};

    // First put the childState on a state within its own property, as to not
    // overwrite e.g. the appDirID property of state, used by this component.
    state = {...state, childState: childState};
    
    // Then if appDirID is undefined, meaning that the current app hasn't
    // loaded yet, or if url does not start with homeURL, simply return state
    // and url as they are.
    if (!appDirID || substring(url, 0, homeURL.length) !== homeURL) {
      return [state, url];
    }
  
    // Else split the tail URL in the first appDirID segment, followed by the
    // rest of the URL, which we can refer to as the appTailURL, and call
    // fetchMostGeneralAppDirIDSegment() to get the most general appDirID
    // segment replacement (which is done to let users to share URLs where the
    // resulting apps can still depend on user preferences, while keeping the
    // semantics of the URL the same).
    let tailURL = substring(url, homeURL.length);
    let appDirIDSegment = getFirstSegment(tailURL);
    let appTailURL = substring(tailURL, 1 + appDirIDSegment.length);
    let mostGeneralAppDirID =
      await fetchMostGeneralAppDirIDSegment(appDirID, appTailURL);

    // If fetchMostGeneralAppDirIDSegment() returns falsy, it means that the
    // url is outside of the current app's API, which means that we should
    // erase appDirID from the new state such that the AppLoader will load a
    // fresh app.
    if (!mostGeneralAppDirID) {
      state = {...state, appDirID: undefined};
      return [state, url];
    }

    // Else keep the appDirID state, but overwrite the appDirIDSegment of url
    // with the mostGeneralAppDirID.
    let transformedURL = homeURL + "/" + mostGeneralAppDirID + appTailURL;
    return [state, transformedURL];
  },


  "loadNewApp": async function(appDirIDSegment) {
    verifyType(appDirIDSegment, "hex")
    let {url, userID} = this.props;

    // Query the route of fetchBestSubAppRouteSubstring with "/" +
    // appDirIDSegment added at the end, and make it a private query iff the
    // user is logged in.
    if (hasType(fetchBestSubAppRouteSubstring, "Route")) {
      fetchBestSubAppRouteSubstring =
        await fetchBestSubAppRouteSubstring.fetchString();
    }
    let fetchBestSubAppRoute = fetchBestSubAppRouteSubstring + "/" +
      appDirIDSegment;
    let fetchFun = userID ? fetchPrivate : fetch;
    let appDirID = await fetchFun(fetchBestSubAppRoute);

    // Check that the URL and the user haven't changed in the meantime, then
    // replace the history state with the resulting appDirID of the best sub-
    // app to load for the user.
    let {curURL, curUserID} = this.getCurrent().props;
    if (curURL === url && curUserID === userID) {
      this.trigger("replaceState", [{appDirID: appDirID, userID: userID}, url]);
    }
  },
};


export function getFirstSegment(url) {
  let indOfSecondSlash = indexOf(tailURL, "/", 1);
  let firstSegment = (indOfSecondSlash === -1) ?
    substring(tailURL, 1) : substring(tailURL, 1, indOfSecondSlash);
  return firstSegment;
}


export async function fetchMostGeneralAppDirIDSegment(appDirID, appTailURL) {
  // First fetch the api.js module, which is expected to be in the app's home
  // directory.
  let apiModule = fetch(abs("../" + appDirID + "/api.js"));

  // ...
}


export const styleSheets = [
  abs("./style.css"),
];
