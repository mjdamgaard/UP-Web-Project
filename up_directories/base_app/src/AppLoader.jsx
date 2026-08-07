
import {fetch, fetchPrivate} from 'query';
import {substring, split, at, slice, join, replaceAll, toString} from 'string';
import {hasType, hasTypes, verifyType} from 'type';
import {some} from 'array';

import * as MissingPage from "./MissingPage.jsx";


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
//   userID, fetchBestVersionRouteTemplate, AppWrapper, appWrapperStyle?,
//   goBackToSafety, appProps?,
// }.

// This component should reinitialize if the userID prop changes. 
export const keyProps = ["userID"];


export function initialize() {
  let {appDirID, trustClass} = this.getHistoryState(newHistState => {
    // If the history state changes in a "popstate" event, namely if navigating
    // to an existing history stack entry (but not due to setHistoryState()
    // calls nor push/replaceURL() calls), update the state accordingly.
    this.setState(state => ({...state, ...(newHistState ?? {})}));
  }) ?? {};
  return {
    appDirID: appDirID, trustClass: trustClass, cache: new MutableObject(),
  };
}


export function render({
  AppWrapper, appWrapperStyle, goBackToSafety, appProps = {}
}) {
  let {appDirID, trustClass, cache} = this.state;

  // Parse useOriginal, useStandard and appDirIDSegment from the URL.
  let appDirIDSegment, useOriginal, useStandard;
  let firstSegment = this.getSegment(0);
  this.advanceURL(1);
  if (!firstSegment) {
    console.error('Invalid segment for the AppLoader: ""');
    return <MissingPage key="m" />;
  }
  let fstChar = firstSegment[0];
  if (fstChar === "o" || fstChar === "s") {
    if (firstSegment[1] !== "-") {
    console.error(`Invalid segment for the AppLoader: "${firstSegment}"`);
    return <MissingPage key="m" />;
    }
    useOriginal = fstChar === "o";
    useStandard = fstChar === "s";
    appDirIDSegment = substring(firstSegment, 2);
  }
  else {
    appDirIDSegment = firstSegment;
  }
  if (!hasType(appDirIDSegment, "hex")) {
    console.error(`Invalid segment for the AppLoader: "${firstSegment}"`);
    return <MissingPage key="m" />;
  }

  // If no app has been loaded yet, call the "loadNewApp" action.
  if (!appDirID) {
    let urlTail = substring(this.getPath(), firstSegment.length + 2);
    this.do("loadNewApp", [appDirIDSegment, urlTail, useOriginal, useStandard]);
    return <div className="loading"></div>;
  }

  // Else fist get the AppComponent and additionalURLs array from the cache,
  // and if these are not yet cached, fetch them and cache them first.
  let appData = cache[appDirID];
  if (!appData) {
    this.do("fetchAppData", appDirID);
    return <div className="loading"></div>;
  }
  let {AppComponent, additionalURLs, stdFirstSegment} = appData;

  // Then if firstSegment is not equal to stdFirstSegment, check the app's
  // additionalURLs, if any, to see if the URL matches one of its entries, and
  // if not, load a new app.
  if (firstSegment !== stdFirstSegment) {
    let localURL = substring(this.getPath(), 1); // removes the "/" in front.
    let urlTail = substring(localURL, firstSegment.length + 1);
    let shouldLoadNewApp = true;
    if (additionalURLs && hasType(additionalURLs, "array")) {
      some(additionalURLs, urlFormat => {
        urlFormat = toString(urlFormat);
        if (compareStringToFormat(localURL, urlFormat)) {
          let [firstFormatSegment] = split(urlFormat, "/");
          if (!hasType(firstFormatSegment, "hex")) {
            // Ignore any formats that does not start with a hexadecimal
            // segment. (So no "o-" or "s-" segments allowed.)
            return false; // continue the some() loop.
          }
          shouldLoadNewApp = false;
          return true; // break the some() loop.
        }
      });
    }
    if (shouldLoadNewApp) {
      this.do("loadNewApp", [
        appDirIDSegment, urlTail, useOriginal, useStandard
      ]);
      return <div className="loading"></div>;
    }
  }

  // Then render the AppComponent, wrapped in the 'AppWrapper' component if
  // provided. Note that we make sure to give an unique key to the app
  // component in order to ensure that its states (including local/session
  // storage or history states) do not get mixed up with another.
  if (!AppComponent) {
    console.error(abs("~/../" + appDirID + "/main.jsx") + " file is missing");
    return <MissingPage key="m" />;
  }
  let isTrusted = trustClass === "trusted";
  if (isTrusted) {
    return <AppComponent key={"a-" + appDirID} {...appProps} />;
  }
  else {
    let isSemiTrusted = trustClass === "semi-trusted";
    if (!isSemiTrusted) {
      this.setContext("username", undefined);
    }
    return (
      <AppWrapper key="w" trustClass={trustClass} appDirID={appDirID}
        isOriginal={useOriginal} isStandard={useStandard}
        goBackToSafety={goBackToSafety} appDirIDSegment={appDirIDSegment}
        style={appWrapperStyle}
      >
        <AppComponent key={"a-" + appDirID} {...appProps} untrusted />
      </AppWrapper>
    );
  }
}




export const actions = {
  "loadNewApp": async function([
    appDirIDSegment, urlTail, useOriginal, useStandard
  ]) {
    verifyType(appDirIDSegment, "hex");
    let {userID, fetchBestVersionRouteTemplate} = this.props;

    // Then query the fetchBestVersionRouteTemplate, with placeholders
    // appropriately replaced, and make it a private query iff the user is
    // logged in and useStandard is falsy.
    let fetchAppRoute = replaceAll(fetchBestVersionRouteTemplate,
      "$appDirID", appDirIDSegment
    );
    fetchAppRoute = replaceAll(fetchAppRoute,
      "$useOriginal", useOriginal ? "1" : "0"
    );
    let fetchFun = userID && !useStandard ? fetchPrivate : fetch;
    let {appDirID, trustClass} = await fetchFun(fetchAppRoute);

    // Fetch the appData (inserting it in the cache).
    let {stdFirstSegment} = await this.do("fetchAppData", appDirID);

    // Finally, replace the first segment with stdFirstSegment, also setting
    // the history state in the process, and update the regular state as well.
    this.replaceURL("~/" + stdFirstSegment + "/" + urlTail);
    this.setHistoryState({appDirID: appDirID, trustClass: trustClass});
    this.setState(state => ({
      ...state, appDirID: appDirID, trustClass: trustClass,
    }));
  },
  "fetchAppData": async function(appDirID) {
    // Fetch the app component found at main.jsx in the app's home directory,
    // as well as the metadata in the same directory.
    let [AppComponent, metadata] = await Promise.all([
      import("~/../" + appDirID + "/main.jsx").catch(
        err => console.error(err)
      ),
      import("~/../" + appDirID + "/metadata.js;get/default").catch(
        err => console.error(err)
      ),
    ]);

    // Get the "apiDefiningAppDirID" and "additionalURLs" metadata properties.
    let {apiDefiningAppDirID, additionalURLs} = metadata ?? {};
    
    // If apiDefiningAppDirID is defined, it should be standard first segment
    // of the app, namely such that other users can have different preferences
    // that branches off from that point in the app tree (or directed graph,
    // rather). And if it is undefined, use "o-" + appDirID as the standard
    // first segment such that the URL will always lead to this specific app.
    let stdFirstSegment = apiDefiningAppDirID ? apiDefiningAppDirID :
      "o-" + appDirID;

    // Then cache and return this data.
    let appData = {
      AppComponent: AppComponent, stdFirstSegment: stdFirstSegment,
      additionalURLs: additionalURLs
    };
    return this.state.cache[appDirID] = appData;
  }
};




export function compareStringToFormat(str, format) {
  let [inclusion, exclusions] = split(str, "!");
  let doesCompare = compareStringToWildcardFormat(inclusion, format);
  if (doesCompare && exclusions) {
    some(split(exclusions, "|"), exclusion => {
      if (compareStringToWildcardFormat(exclusion, format)) {
        doesCompare = false;
        return true; // break the some() loop.
      }
    });
  }
  return doesCompare;
}

export function compareStringToWildcardFormat(str, format) {
  if (at(str, -1) === "*") {
    let subStr = slice(str, 0, -1);
    return substring(str, 0, subStr.length) === subStr;
  }
  else {
    return str === format;
  }
}