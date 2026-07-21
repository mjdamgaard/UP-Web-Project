
import {clearPermissions, fetch, fetchPrivate} from 'query';
import {substring, split, at, slice, join, replaceAll, toString} from 'string';
import {fetchPrivate, fetch} from 'query';
import {hasType, hasTypes, verifyType} from 'type';
import {forEach} from 'array';

import * as MissingPage from "./MissingPage.jsx";
import { format } from 'url';


// The AppLoader loads the app that is defined by the first segment (from where
// its ancestor instances has advanced the URL to), but does so in a way that
// allows users to share URLs with each other, preserving the semantics of the
// shared pages, while still allowing the users to have the same pages
// rendered by their own preferred app versions.
// It does so by using a route template prop, 'fetchBestVersionRouteTemplate,'
// which is supposed to find the user's preferred app version for the given
// first segment, the "appDirIDSegment". And at the same time, it also looks
// for the most general app version that implements the same URL API, and
// actually replaces the "appDirIDSegment" with that such that when sharing the
// URL with other users, those user's will load their own preferred apps in
// place of that most general version. (TODO: Rewrite at some point to make the
// system more clear.)



// props : {
//   useOriginal, useDefault, userID, Wrapper, appProps,
//   fetchBestVersionRouteTemplate,
// }.

// This component should reinitialize if either the userID, the useDefault, or
// the useOriginal prop changes. 
export const keyProps = ["userID", "useOriginal", "useDefault"];


export function initialize() {
  // histState : {appDirID, trustClass}.
  return this.getHistoryState(newHistState => {
    // If the history state changes due to user navigation (but not due to
    // setHistoryState() calls, or due to pushURL()/replaceURL() calls from
    // other component instances), update the relevant states.
    this.setState(state => ({
      ...state, ...(newHistState ?? {}), cache: new MutableObject(),
      curAppDirIDRef = new MutableArray(),
    }));
  }) ?? {};
}


export function render({Wrapper, appProps = {}}) {
  let {appDirID, trustClass, cache, curAppDirID} = this.state;

  // Get (and subscribe to) the appDirIDSegment from the URL.
  let appDirIDSegment = this.getFirstSegment();
  if (!hasType(appDirIDSegment, "hex")) {
    console.error("Non-hexadecimal appDirID segment: " + appDirIDSegment);
    return <MissingPage key="m" />;
  }

  // If no app has been loaded yet, or if appDirID is different from
  // curAppDirID, load a new app.
  if (!appDirID || appDirID !== curAppDirID) {
    let urlTail = substring(this.getPath(), appDirIDSegment.length + 2);
    this.do("loadNewApp", [appDirIDSegment, urlTail]);
    return (
      <div className="app">
        <div className="fetching"></div>
      </div>
    );
  }

  // Else fist get the AppComponent and additionalURLs array from the cache,
  // and if these are not yet cached, fetch them and cache them first.
  let appData = cache[appDirID];
  if (!appData) {
    this.do("fetchAppData", appDirID);
    return (
      <div className="app">
        <div className="fetching"></div>
      </div>
    );
  }
  let {AppComponent, additionalURLs, genAppDirID} = appData;

  // Then if appDirIDSegment is not equal to genAppDirID, check the app's
  // additionalURLs to see if the URL matches one of its entries, and if not,
  // also load a new app.
  if (appDirIDSegment !== genAppDirID) {
    let shouldLoadNewApp = true;
    let localURL = substring(this.getPath(), 1); // removes the "/" in front.
    let urlTail = substring(localURL, appDirIDSegment.length + 1);
    if (additionalURLs && hasType(additionalURLs, "array")) {
      forEach(additionalURLs, urlFormat => {
        urlFormat = toString(urlFormat);
        if (compareWildcardFormatToString(urlFormat, localURL)) {
          shouldLoadNewApp = false;
        }
      });
    }
    if (shouldLoadNewApp) {
      this.do("loadNewApp", [appDirIDSegment, urlTail]);
      return (
        <div className="app">
          <div className="fetching"></div>
        </div>
      );
    }
  }

  // Then render the AppComponent, wrapped in the 'Wrapper' component if
  // provided. Note that we make sure to give an unique key to the app
  // component in order to ensure that its states (including local/session
  // storage or history states) do not get mixed up with another.
  if (!AppComponent) {
    return <MissingPage key="m" />;
  }
  if (Wrapper) {
    // (The wrapper is supposed to advance the URL beyond the appDirID segment.)
    return (
      <Wrapper key="w" trustClass={trustClass} appDirID={appDirID} >
        <AppComponent key={"a-" + appDirID}
          {...appProps} untrusted={trustClass !== "trusted"}
        />
      </Wrapper>
    );
  } else {
    this.advanceURL(1);
    return <AppComponent key={"a-" + appDirID} {...appProps} untrusted />;
  }
}




export const actions = {
  "loadNewApp": async function([appDirIDSegment, urlTail]) {
    verifyType(appDirIDSegment, "hex");
    let {useOriginal, useDefault, fetchBestVersionRouteTemplate} = this.props;

    // Then query the fetchBestVersionRouteTemplate, with placeholders
    // appropriately replaced, and make it a private query iff the user is
    // logged in and useDefault is falsy.
    let fetchAppRoute = replaceAll(fetchBestVersionRouteTemplate,
      "$appDirID", appDirIDSegment
    );
    fetchAppRoute = replaceAll(fetchAppRoute,
      "$useOriginal", useOriginal ? "1" : "0"
    );
    let userID = this.getContext("userID", true);
    let fetchFun = userID && !useDefault ? fetchPrivate : fetch;
    let {appDirID, trustClass} = await fetchFun(fetchAppRoute);

    // Fetch the appData (inserting it in the cache).
    let {genAppDirID} = await this.do("fetchAppData", appDirID);

    // Finally, replace the appDirIDSegment with genAppDirID, also setting
    // the history state in the process, and update the regular state as well.
    this.replaceURL("~/" + genAppDirID + "/" + urlTail, {
      appDirID: appDirID, trustClass: trustClass
    });
    this.setState(state => ({...state,
      appDirID: appDirID, trustClass: trustClass, curAppDirID: appDirID
    }));
  },
  "fetchAppData": async function(appDirID) {
    // Fetch the app component found at main.jsx in the app's home directory,
    // as well as the metadata in the same directory.
    let [AppComponent, metadata] = await Promise.all([
      import("~/../" + appDirID + "/main.jsx").catch(
        err => console.error(err)
      ),
      import("../" + appDirIDSegment + "/metadata.js;get/default").catch(
        err => undefined
      ),
    ]);

    // Get the "apiDefiningAppDirID" metadata property, which we shorten here
    // to "genAppDirID" ("gen" for "general"), as well as the additionalURLs
    // property.
    let genAppDirID = metadata?.apiDefiningAppDirID ?? appDirIDSegment;
    let additionalURLs = metadata?.additionalURLs;

    // Then cache and return this data.
    let appData = {
      AppComponent: AppComponent, genAppDirID: genAppDirID,
      additionalURLs: additionalURLs
    };
    return this.state.cache[appDirID] = appData;
  }
};




export function compareWildcardFormatToString(format, str) {
  if (at(format, -1) === "*") {
    let subStr = slice(format, 0, -1);
    return subStr === substring(str, 0, subStr.length);
  }
  else {
    return format === str;
  }
}