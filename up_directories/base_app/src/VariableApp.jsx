
import {fetch, fetchPrivate} from 'query';
import {hasType, hasTypes, verifyType} from 'type';

import * as MissingPage from "./MissingPage.jsx";


// VariableApp is similar to AppLoader, except it doesn't read the appDirID
// from the next segment of the URL, but gets it as a prop instead. And it
// therefore also doesn't replace the URL.


// props : {
//   appDirID, userID, fetchBestVersionRouteTemplate, appProps?,
//   useOriginal?, useStandard?,
// }.

// This component should reinitialize if either the appDirID or the userID prop
// changes. 
export const keyProps = ["appDirID", "userID"];


export async function initialize({
  appDirID, userID, fetchBestVersionRouteTemplate,
  useOriginal = false, useStandard = false,
}) { 
  // Query the fetchBestVersionRouteTemplate, with placeholders
  // appropriately replaced, and make it a private query iff the user is
  // logged in and useStandard is falsy.
  verifyType(appDirID, "hex");
  let fetchAppRoute = fetchBestVersionRouteTemplate.replaceAll(
    "$appDirID", appDirID
  );
  fetchAppRoute = fetchAppRoute.replaceAll(
    "$useOriginal", useOriginal ? "1" : "0"
  );
  let fetchFun = userID && !useStandard ? fetchPrivate : fetch;
  let {appDirID: resAppDirID, trustClass} = await fetchFun(fetchAppRoute);
  let AppComponent = await import("~/../" + appDirID + "/main.jsx").catch(
    err => console.error(err)
  );
  this.setState({
    AppComponent: AppComponent, appDirID: resAppDirID, trustClass: trustClass,
  });
}


export function render({
  appProps = {}, useOriginal = false, useStandard = false
}) {
  let {AppComponent, appDirID, trustClass} = this.state;
  if (appDirID === undefined) {
    return <div className="loading"></div>;
  }

  // Then render the AppComponent. Note that we make sure to give an unique key
  // to the app component in order to ensure that its states (including local/
  // session storage or history states) do not get mixed up with another.
  if (!AppComponent) {
    this.trigger("hideWarning");
    console.error(abs("~/../" + appDirID + "/main.jsx") + " file is missing");
    return <MissingPage key="m" />;
  }
  let isTrusted = trustClass === "trusted";
  if (isTrusted || trustClass === "semi-trusted") {
    this.trigger("hideWarning");
  }
  else {
    this.setContext("username", undefined);
    this.trigger("showWarning", {
      appDirID: appDirID,
      isHarmful: trustClass === "harmful"
    });
  }
  return <AppComponent key={"a-" + appDirID}
    {...appProps} untrusted={!isTrusted}
  />;
}





export const actions = {
  // We deny access to triggering the "hideWarning" event for descendants, and
  // deny hiding the header for untrusted apps.
  "hideWarning": function() {},
  "hideHeader": function() {
    let {trustClass} = this.state;
    if (trustClass === "trusted" || trustClass === "semi-trusted") {
      this.trigger("hideHeader");
    }
  },
  "hideFrame": function() {
    let {trustClass} = this.state;
    if (trustClass === "trusted" || trustClass === "semi-trusted") {
      this.trigger("hideFrame");
    } else {
      this.trigger("hideMargins");
    }
  },
};


export const events = [
  "hideWarning",
  "hideHeader",
  "hideFrame",
];
