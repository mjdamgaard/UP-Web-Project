
import {clearPermissions, fetch, fetchPrivate} from 'query';
import {substring, split, at, slice, join, replaceAll} from 'string';
import {fetchPrivate, fetch} from 'query';
import {hasType, hasTypes, verifyType} from 'type';

import * as MissingPage from "./MissingPage.jsx";


// props : {
//   useOriginal, useDefault, Wrapper, appProps, fetchBestVersionRouteTemplate
// }.

export function render(props) {
  let {Wrapper, appProps = {}} = props;
  let {appDirID, AppComponent, trustClass} = this.state.ref ?? {};

  // Parse the appDirIDSegment from the URL.
  let appDirIDSegment = this.getFirstSegment();
  if (!hasType(appDirIDSegment, "hex")) {
    console.error("Non-hexadecimal appDirID segment: " + appDirIDSegment);
    return <MissingPage key="m" />;
  }

  // If no app has been loaded yet, or if appDirIDSegment is not the the
  // appDirID of the currently loaded app, call the "loadNewApp" action.
  if (appDirIDSegment !== appDirID) {
    let urlTail = substring(this.getPath(), appDirIDSegment.length + 2);
    this.do("loadNewApp", [appDirIDSegment, urlTail]);
    return (
      <div className="app">
        <div className="fetching"></div>
      </div>
    );
  }

  // Else load the AppComponent set by "loadNewApp", wrapped in the 'wrapper'
  // component if provided. Note that we make sure to give an unique key to
  // the app component in order to ensure that its state (including local/
  // session storage or history states) does not get mixed up with another.
  if (!AppComponent) {
    return <MissingPage key="m" />;
  }
  if (Wrapper) {
    return (
      <Wrapper key="w" trustClass={trustClass} appDirID={appDirID} >
        <AppComponent key={"a-" + appDirID}
          {...appProps} untrusted={trustClass !== "trusted"}
        />
      </Wrapper>
    );
  } else {
    this.advanceURL(1);
    return <AppComponent key={"a-" + appDirID} untrusted {...appProps} />;
  }
}




export const actions = {
  "loadNewApp": async function([appDirIDSegment, urlTail]) {
    verifyType(appDirIDSegment, "hex");
    let {useOriginal, useDefault, fetchBestVersionRouteTemplate} = this.props;

    // If useOriginal is set, simply use the same appDirIDSegment instead of
    // querying for the best sub-app.
    if (useOriginal) {
      this.setState(state => ({...state, appDirID: appDirIDSegment}));
      return;
    }

    // Else use the app's api.js file to get the most general app version that
    // implements this urlTail.
    let genAppDirID = await fetchMostGeneralAppDirID(appDirIDSegment, urlTail);

    // If this procedure failed, also simply load the app of the current
    // appDirSegment itself.
    if (!genAppDirID) {
      this.setState(state => ({...state, appDirID: appDirIDSegment}));
      return;
    }

    // Else query the fetchBestVersionRouteTemplate, with "?"'s replaced with
    // geAppDirID, and make it a private query iff the user is logged in and
    // useDefault is falsy.
    let fetchAppRoute =
      replaceAll(fetchBestVersionRouteTemplate, "?", genAppDirID);
    let userID = this.getContext("userID", true);
    let fetchFun = userID && !useDefault ? fetchPrivate : fetch;
    let {appDirID, trustClass} = await fetchFun(fetchAppRoute);

    // Fetch the app component found at main.jsx in the app's home directory.
    let AppComponent = await import("~/../" + appDirID + "/main.jsx").catch(
      err => console.error(err)
    );

    // And finally replace the appDirIDSegment with the appDirID of the app to
    // be loaded, and set the appDirID, trustClass, and AppComponent states.
    this.replaceURL("replaceState", "~/" + appDirIDSegment + "/" + urlTail);
    this.setState(state => ({...state,
      appDirID: appDirID, trustClass: trustClass, AppComponent: AppComponent,
    }));
  },
};




export async function fetchMostGeneralAppDirID(appDirIDSegment, urlTail) {
  // First fetch the api.js module, which is expected to be in the app's home
  // directory.
  let apiModule = await fetch(abs("../" + appDirIDSegment + "/api.js")).catch(
    err => false
  );
  if (!apiModule) throw (
    "Missing api.js module (in directory #" + appDirIDSegment + ")"
  );

  // Go through each entry in the default export, which ought to be an array
  // of url substring and appDirID identifier pairs, until the first match is
  // found.
  let urlSubstringAndAppIdentPairArr = apiModule.default;
  if (!hasType(urlSubstringAndAppIdentPairArr, "array")) throw (
    "Default export of api.js module is not an array"
  );
  let len = urlSubstringAndAppIdentPairArr.length;
  let urlSubstring, appIdent;
  for (let i = 0; i < len; i++) {
    // Extract urlSubstring and appIdent.
    let urlSubstringAndAppIdentPair = urlSubstringAndAppIdentPairArr[i];
    if (!hasType(urlSubstringAndAppIdentPair, "array")) throw (
      "Default export of api.js module contains a non-array entry"
    );
    if (!hasTypes(urlSubstringAndAppIdentPair, ["string", "string"])) throw (
      "Default export of api.js module contains nested non-string values"
    );
    [urlSubstring, appIdent] = urlSubstringAndAppIdentPair;

    // If urlSubstring matches appTailURL, break the loop.
    if (urlSubstring === urlTail) {
      break;
    }
    let lastChar = at(urlSubstring, -1);
    if (
      lastChar === "*" && substring(urlTail, 0, urlSubstring.length - 1) ===
        slice(urlSubstring, 0, -1)
    ) {
      break;
    }
  }

  // If no match was found, return false to signify this.
  if (!appIdent) {
    return false;
  }

  // Else if a match was found, check whether it is a hexadecimal string, in
  // which case interpret as the appDirID itself and return it as is.
  if (hasType(appIdent, "hex")) {
    let mostGeneralAppDirID = appIdent;
    return mostGeneralAppDirID;
  }

  // And if it is not a hexadecimal string, look in the placeholders module
  // expecting to find the appDirID at placeholdersModule.default.this-
  // .directories[appIdent].
  try {
    let placeholdersModule = 
      await fetch(abs("../" + appDirIDSegment + "/placeholders.js"));
    let mostGeneralAppDirID =
      placeholdersModule.default.this.directories[appIdent];
    if (!hasType(mostGeneralAppDirID, "hex")) throw "";
    return mostGeneralAppDirID;
  }
  catch (err) {
    throw (
      `Error when looking up "${appIdent}", obtained from the api.js ` +
      "module, in the placeholders.js module."
    );
  }
}
