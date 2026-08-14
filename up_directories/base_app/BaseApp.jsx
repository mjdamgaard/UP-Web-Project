
import {getIsAppDirSegment} from "./src/AppLoader.jsx";
import * as AppLoader from "./src/AppLoader.jsx";
import * as VariableApp from "./src/VariableApp.jsx";
import * as MissingPage from "./src/MissingPage.jsx";
import * as LoginPage from "./src/account_menu/LoginPage.jsx";
import * as SignupPage from "./src/account_menu/SignupPage.jsx";
import * as AccountPage from "./src/account_menu/AccountPage.jsx";
import * as AboutPage from "./src/AboutPage.jsx";

import placeholders from "./placeholders.js";

const {this: {
  directories: {
    "base_app": baseAppDirID,
    "app_browser": appBrowserDirID,
  },
}} = placeholders;


// The main job(s) of a "base app" is to define a header menu for the website
// (which apps can choose to hide and use their own headers), and the outer
// frame of the website in general, and then to load the given app, pointed to
// by the URL within that frame. However, it also potentially loads an updated
// version of itself first, and then gives it a false loadUpdatedSelf prop to
// let it know not to load any other versions of itself, but to continue as it
// is.
// This base app uses an AppLoader component both to load both an updated
// version of itself and to load the app itself. This AppLoader component
// implements a special system that allows users to share URLs with each other,
// where the semantics of the shares web pages are preserved, but where the
// exact app that is used to render the pages might differ for each user that
// loads the page. See ./src/AppLoader.jsx for more information.


export function initialize() {
  return{
    goToDefaultBaseApp: (_, wasDefault = false) => {
      this.pushURL("~/base/" + (wasDefault ? "o" : "s") + "-" + baseAppDirID);
    },
    goToAppPage: (appDirID) => {
      this.pushURL("~/s-" + appBrowserDirID + "/app/" + appDirID);
    },
  };
}


export function render(props) {
  let {
    fetchBestVersionRouteTemplate, loadUpdatedSelf,
    mainStyle, AppFrame, appFrameStyle, AppWrapper, appWrapperStyle
  } = props;
  let {goToDefaultBaseApp, goToAppPage} = this.state;
  let userID = this.getContext("userID");

  // If the URL starts with "/base(/[os])?/<appDirID>", use the AppLoader
  // component to load the base app pointed to by the "(/[os])?/<appDirID>"
  // segment(s). (The optional "/o" or "/s" segment respectively either makes
  // the AppLoader load the "original" app rather than looking for an updated
  // version, or loads the "standard"/default updated app without using the
  // user's individual preferences.)
  let firstSegment = this.getSegment(0);
  if (firstSegment === "base") {
    this.advanceURL(1);
    return <AppLoader key="b" userID={userID}
      fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
      AppWrapper={AppWrapper} appWrapperStyle={[mainStyle, appWrapperStyle]}
      goBackToSafety={goToDefaultBaseApp} appProps={{loadUpdatedSelf: false}}
    />;
  }

  // Else if loadUpdatedSelf is true, use the VariableApp component to load the
  // the best up-to-date base app that also matches the user preferences, and
  // make sure to set the loadUpdatedSelf to false for this updated base app.
  // Also check that the URL is of the form /([os]-)?[0-9a-f]+/. (A base app
  // can implement other URLs as well, but only when it is loaded by another
  // base app, or itself, meaning that the first segment of the absolute URL
  // is the appDirID of the given base app, and thus still of the form
  // /([os]-)?[0-9a-f]+/.)
  let isAppDirSegment = getIsAppDirSegment(firstSegment);
  if (loadUpdatedSelf) {
    if (firstSegment && !isAppDirSegment) {
      return <MissingPage />;
    }
    return <VariableApp key="v" appDirID={baseAppDirID} userID={userID}
      fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
      AppWrapper={AppWrapper} appWrapperStyle={[mainStyle, appWrapperStyle]}
      goBackToSafety={goToDefaultBaseApp} appProps={{loadUpdatedSelf: false}}
    />;
  }

  // Else if the tail URL is empty, go to the app browser as the default app.
  if (!firstSegment) {
    this.replaceURL("~/" + appBrowserDirID);
    return <div className="loading"></div>;
  }

  // If the first segment equals "o-" + baseAppDirID, skip the AppLoader, which
  // would otherwise load this base app itself again, and go directly to the
  // switch-case statement below.
  if (firstSegment === "o-" + baseAppDirID) {
    firstSegment = this.getSegment(1);
  }

  // Else if the URL is of the form "(/[os])?/<appDirID>" (similar to the above
  // case but without the "/base" segment in front), redirect to the AppLoader
  // component to load the app pointed to be appDirID. And in this case, also
  // wrap the AppLoader component in the AppFrame component, which defines a
  // global header for the webpage, and the global page margins, etc. (both of
  // which the loaded app can potentially hide).
  else if (isAppDirSegment) {
    return <AppFrame key="f" style={appFrameStyle}>
      <AppLoader key="a" userID={userID}
        fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
        AppWrapper={AppWrapper} appWrapperStyle={[mainStyle, appWrapperStyle]}
        goBackToSafety={goToAppPage}
      />
    </AppFrame>;
  }

  // If the URL is of the form "(o-<baseAppDirID>/)?<page-segment>", where
  // <page-segment> is one of the page segments below redirect to that page.
  let content;
  switch(firstSegment) {
    case "login":
      content = <LoginPage />;
      break;
    case "signup":
      content = <SignupPage />;
      break;
    case "account":
      content = <AccountPage />;
      break;
    case "about":
      content = <AboutPage />;
      break;
    default:
      content = <MissingPage />;
      break;
  }
  return <div innerStyle={appFrameStyle}>{(content)}</div>;
}



export const actions = {
  "goToApp": function([
    appDirID, tailURL = "", useOriginal = false, useStandard = false
  ]) {
    let initSegment = useOriginal ? "/o" : useStandard ? "/s" : "";
    this.pushURL("~" + initSegment + "/" + appDirID + "/" + tailURL);
  },
};

export const events = [
  "goToApp",
];