
import {fetch, fetchPrivate} from 'query';
import {substring, split, at, slice, join, replaceAll, toString} from 'string';
import {hasType, hasTypes, verifyType} from 'type';
import {forEach} from 'array';

import * as MissingPage from "./MissingPage.jsx";


// VariableApp is similar to AppLoader, except it doesn't read the appDirID
// from the next segment of the URL, but gets it as a prop instead. And it
// therefore also doesn't replace the URL.


// props : {
//   appDirID, userID, fetchBestVersionRouteTemplate, AppWrapper,
//   appWrapperStyle?, goBackToSafety, appProps?, useOriginal?, useStandard?,
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
  let fetchAppRoute = replaceAll(fetchBestVersionRouteTemplate,
    "$appDirID", appDirID
  );
  fetchAppRoute = replaceAll(fetchAppRoute,
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
  AppWrapper, appWrapperStyle, goBackToSafety, appProps = {},
  useOriginal = false, useStandard = false
}) {
  let {AppComponent, appDirID, trustClass} = this.state;
  if (appDirID === undefined) {
    return <div className="fetching"></div>;
  }

  // Render the AppComponent, wrapped in the 'AppWrapper' component if provided.
  // Note that we make sure to give an unique key to the app component in order
  // to ensure that its states (including local/session storage or history
  // states) do not get mixed up with another.
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

