
import {clearPermissions, fetch, fetchPrivate} from 'query';
import {substring, split, at, slice, join, replaceAll, toString} from 'string';
import {fetchPrivate, fetch} from 'query';
import {hasType, hasTypes, verifyType} from 'type';
import {forEach} from 'array';

import * as MissingPage from "./MissingPage.jsx";
import { format } from 'url';


// props : {
//   useOriginal, useDefault, Wrapper, appProps, fetchBestVersionRouteTemplate
// }.

export function render(props) {
  let {Wrapper, appProps = {}} = props;
  let {appDirID, AppComponent, trustClass, additionalURLs} = this.state;

  // Parse the appDirIDSegment from the URL.
  let appDirIDSegment = this.getFirstSegment();
  if (!hasType(appDirIDSegment, "hex")) {
    console.error("Non-hexadecimal appDirID segment: " + appDirIDSegment);
    return <MissingPage key="m" />;
  }

  // If no app has been loaded yet, or if appDirIDSegment is not the the
  // appDirID of the currently loaded app, call the "loadNewApp" action. That
  // is, unless the URL matches an entry in additionalURLs.
  if (appDirIDSegment !== appDirID) {
    let localURL = substring(this.getPath(), 1); // removes the "/" in front.
    let urlTail = substring(localURL, appDirIDSegment.length + 1);
    let shouldLoadNewApp = true;
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

    // Use the app's metadata.json file to get the most general app version
    // that implements the same URL API, along with a set of URLs for which the
    // AppLoader is not supposed to direct away from the current app, even if
    // they have a different appDirID segment.
    let [genAppDirID, additionalURLs] =
      await fetchMostGeneralAppDirID(appDirIDSegment, urlTail);

    // Then query the fetchBestVersionRouteTemplate, with placeholders
    // appropriately replaced, and make it a private query iff the user is
    // logged in and useDefault is falsy.
    let fetchAppRoute = replaceAll(fetchBestVersionRouteTemplate,
      "$appDirID", useOriginal ? appDirIDSegment : genAppDirID
    );
    fetchAppRoute = replaceAll(fetchAppRoute,
      "$useOriginal", useOriginal ? "1" : "0"
    );
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
      additionalURLs: additionalURLs,
    }));
  },
};




export async function fetchMostGeneralAppDirID(appDirIDSegment, urlTail) {
  // First fetch the the parsed metadata.json object.
  let metadata = await fetch(
    abs("../" + appDirIDSegment + "/metadata.json;parse")
  ).catch(
    err => undefined
  );
  
  // Then get the "apiDefiningAppDirID" property, and return that if it is
  // defined, and otherwise return appDirIDSegment back.
  let genAppDirID = metadata?.apiDefiningAppDirID ?? appDirIDSegment;

  // Also get an array of URLs (starting with the appDirID segment and no "/"
  // in front) for which the AppLoader is not supposed to direct away from the
  // current app.
  let additionalURLs = metadata?.additionalURLs;

  return [genAppDirID, additionalURLs];
}



export function compareWildcardFormatToString(format, str) {
  if (at(format, -1) === "*") {
    let subStr = slice(format, 0, -1);
    return subStr === substring(str, 0, subStr.length);
  }
  else {
    return format === str;
  }
}