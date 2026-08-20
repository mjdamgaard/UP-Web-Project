
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
    "home_app": homeAppDirID,
    "app_browser": appBrowserDirID,
  },
}} = placeholders;


// The main job(s) of a "home app" is to define a header menu for the website
// (which apps can choose to hide and use their own headers), and the outer
// frame of the website in general, and then to load the given app, pointed to
// by the URL within that frame. However, it also potentially loads an updated
// version of itself first, and then gives it a false loadUpdatedSelf prop to
// let it know not to load any other versions of itself, but to continue as it
// is.
// This home app uses an AppLoader component both to load both an updated
// version of itself and to load the app itself. This AppLoader component
// implements a special system that allows users to share URLs with each other,
// where the semantics of the shares web pages are preserved, but where the
// exact app that is used to render the pages might differ for each user that
// loads the page. See ./src/AppLoader.jsx for more information.


export function initialize() {
  return{
    goToDefaultHomeApp: (_, wasDefault = false) => {
      this.pushURL("~/home/" + (wasDefault ? "o" : "s") + "-" + homeAppDirID);
    },
    goToAppPage: (appDirID) => {
      this.pushURL("~/s-" + appBrowserDirID + "/app/" + appDirID);
    },
  };
}


export function render(props) {
  let {
    fetchBestVersionRouteTemplate, loadUpdatedSelf, mainStyle, AppFrame,
    appFrameStyle,
  } = props;
  let {goToDefaultHomeApp, goToAppPage} = this.state;
  let userID = this.getContext("userID");

  // If the URL starts with "/home(/[os])?/<appDirID>", use the AppLoader
  // component to load the home app pointed to by the "(/[os])?/<appDirID>"
  // segment(s). (The optional "/o" or "/s" segment respectively either makes
  // the AppLoader load the "original" app rather than looking for an updated
  // version, or loads the "standard"/default updated app without using the
  // user's individual preferences.)
  let firstSegment = this.getSegment(0);
  if (firstSegment === "home") {
    this.advanceURL(1);
    return <AppLoader key="b"
      userID={userID} appProps={{loadUpdatedSelf: false}}
      fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
    />;
  }

  // Else if loadUpdatedSelf is true, use the VariableApp component to load the
  // the best up-to-date home app that also matches the user preferences, and
  // make sure to set the loadUpdatedSelf to false for this updated home app.
  // Also check that the URL is of the form /([os]-)?[0-9a-f]+/. (A home app
  // can implement other URLs as well, but only when it is loaded by another
  // home app, or itself, meaning that the first segment of the absolute URL
  // is the appDirID of the given home app, and thus still of the form
  // /([os]-)?[0-9a-f]+/.)
  let isAppDirSegment = getIsAppDirSegment(firstSegment);
  if (loadUpdatedSelf) {
    if (firstSegment && !isAppDirSegment) {
      return <MissingPage />;
    }
    return <VariableApp key="v"
      appDirID={homeAppDirID} userID={userID}
      appProps={{loadUpdatedSelf: false}}
      fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
    />;
  }

  // Else if the first segment equals "o-" + homeAppDirID, skip the AppLoader,
  // which would otherwise load this home app itself again, and go to the
  // switch-case statement below.
  if (firstSegment === "o-" + homeAppDirID) {
    firstSegment = this.getSegment(1);
  }

  // And if the tail URL is empty, go to the app browser as the default app.
  if (!firstSegment) {
    this.replaceURL("./" + appBrowserDirID);
    return <div className="loading"></div>;
  }

  // Else if the URL is of the form "(/[os])?/<appDirID>" (similar to the above
  // case but without the "/home" segment in front), redirect to the AppLoader
  // component to load the app pointed to be appDirID. And in this case, also
  // wrap the AppLoader component in the AppFrame component, which defines a
  // global header for the webpage, and the global page margins, etc. (both of
  // which the loaded app can potentially hide).
  else if (isAppDirSegment) {
    return <AppFrame key="f" style={appFrameStyle}>
      <AppLoader key="a" userID={userID}
        fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
      />
    </AppFrame>;
  }

  // If the URL is of the form "(o-<homeAppDirID>/)?<page-segment>", where
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