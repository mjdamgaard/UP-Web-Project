
import {clearPermissions} from 'query';
import {urlActions, urlEvents} from "./urlActions.js";

import {substring, indexOf, split} from 'string';
import {fetchPrivate} from 'query';
import {verifyType} from 'type';

import {scoreHandler02} from
  "../semantic_entities/score_handling/ScoreHandler01/em.js";
// TODO: Implement a settings page where users can change their score handler
// (with ample warnings), among other settings.


export function initialize({scoreHandler = scoreHandler02}) {
  return {
    scoreHandler: scoreHandler,

    // Since we expect a general user session to not include opening that many
    // new apps in general that this will cause a performance issue, we cache
    // the state rather than throwing this computed data away whenever
    // the user navigates to another app.
    stateCache: new MutableObject(),
  };
}



export function render({url, homeURL, tailURL}) {
  let {scoreHandler, stateCache} = this.state;

  // Parse the appDirID segment from the URL, and look for a corresponding
  // entry in the state cache.
  let [ , appURLSegment, appDirIDSegment] = split(tailURL, "/");
  verifyType(appDirIDSegment, "hex");
  let cacheEntry = stateCache[appDirIDSegment];

  // If no entry is found, call an action to load a new app.
  if (!cacheEntry) {
    this.do("loadNewApp", appDirIDSegment);
    return (
      <div className="app">
        <div className="fetching">"..."</div>
      </div>
    );
  }

  // If there is an entry, extract the data from it.
  let {
    // appDirID is the (directory) ID of the app to be loaded.
    appDirID,

    // urlAPI is an object derived from the api.js module in the directory of
    // the current app. It is used to determine what to do in response to a
    // change in the URL.
    urlAPI,
  } = cacheEntry;

  // Use urlApi to validate the appURLSegment.
  let expectedAppURLSegment = urlAPI.appURLSegment;
  if (appURLSegment !== expectedAppURLSegment) {
    <div className="app">
      <AppURLSegmentMismatchWarning key="w"
        appURLSegment={appURLSegment}
        expectedAppURLSegment={expectedAppURLSegment} tailURL={tailURL}
      />
    </div>
  }

  // Then call urlApi.getMostGeneralAppID() to get the appID of the loaded
  // app's ancestor that is furthest up the line and which still implements the
  // current tailURL. If the resulting appID is different from appDirIDSegment,
  // trigger the "replaceURL" event, to replace this appDirID segment, causing
  // this component to rerender once, but it won't change the the props below
  // of the <App /> child component.
  // (This is all done in order for users to be able to share URLs with each
  // other while still maintaining as much of their individual preferences as
  // possible for which sub-app should handle these URLs.)
  let mostGeneralAppID = urlApi.getMostGeneralAppID();
  if (appURLSegment !== mostGeneralAppID) {
    let newURL = "~/" + appURLSegment + "/" + mostGeneralAppID + tailURL;
    this.trigger("replaceURL", newURL);
  }

  // Redefine the homeURL and tailURL for the <App /> child, and use
  // mostGeneralAppID rather than appURLSegment to prevent a redundant rerender.
  let newHomeURL = homeURL + "/" + appURLSegment + "/" + mostGeneralAppID;
  let newTailURL = substring(url, newHomeURL.length);
  url = newHomeURL + newTailURL;
  return (
    <div className="app">
      <App key="a"
        appDirID={appDirID} url={url} homeURL={newHomeURL} tailURL={newTailURL}
      />
    </div>
  );
}



export const events = [
  ...urlEvents,
];


export const actions = {
  ...urlActions,

  // "redirectToStartApp": async function() {
  //   let {localStorage, userID} = this.props;
  //   let startURL = localStorage.getItem("startURL");
  //   if (!startURL && userID) {
  //     startURL = await fetchPrivate(abs(
  //       "./_startURLs.att./entry/k/" + userID
  //     )).catch(err => {
  //       console.warn("Could not fetch user's start URL");
  //       return undefined;
  //     });
  //     if (startURL) {
  //       localStorage.setItem("startURL", startURL);
  //     }
  //   }
  //   if (startURL) {
  //     this.trigger("replaceState", "~/" + startURL);
  //   }
  //   else {
  //     this.trigger("replaceState", "~/apps");
  //   }
  // },

  "loadNewApp": async function(appDirIDSegment) {
    let {localStorage, userID} = this.props;

    // Look in the user's own preferences to see if the have a preferred sub-
    // app to substitute the starting appDirID.
    let appDirID = await fetchUsersOwnPreferredAppIDIfAny(
      appDirIDSegment, userID, localStorage
    ) ?? appDirIDSegment;
    
    // Query the server for the top-rated sub-app of the app pointed to by
    // appDirID, along with.. Hm, you also need all the URL-API-defining appIDs,
    // and we need the api.js object for each one as well, which are then all
    // combined into the urlAPI object, and the stateCache is finally updated
    // with a duplicate entry for all.. no only for the current appDirIDSegment
    // as well as all its API-defining descendant appIDs (but not the ancestor
    // apps!). TODO: Do all this.. 
    appDirID = await fetchTopRatedSubAppID(appDirID, )
  },
};



export const styleSheets = [
  abs("./style.css"),
];
