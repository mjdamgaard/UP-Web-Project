
/* HOISTED IMPORTS */
import "./src/AppLoader.jsx";
import "./src/VariableApp.jsx";
import "./src/MissingPage.jsx";
import "./src/Warning.jsx";
import "./src/account_menu/LoginPage.jsx";
import "./src/account_menu/SignupPage.jsx";
import "./src/account_menu/AccountPage.jsx";
import "./src/pages/About.jsx";
/* END */

// Here we use a convention where the main.jsx module's only responsibilities
// are to style the app, and potentially define some fundamental props, like
// the 'fetchBestVersionRouteTemplate' prop in our case. The main.jsx component
// can also "hoist" the imports, like seen above (for which we will at some
// point implement a command in the directory updater program, namely one that
// creates or updates this list of hoisted imports automatically.

import * as HomeApp from "./HomeApp.jsx";
import * as mainStyle from "./style.css";
import * as AppFrame from "./src/AppFrame.jsx";
import * as appFrameStyle from "./src/AppFrame.css";

const fetchBestVersionRouteTemplate = abs(
  "./server/apps/apps.sm.js./callSMF/fetchBestSubApp/" +
  "$appDirID/$useOriginal"
);


export function render(props) {
  this.trigger("hideFrame");
  return <HomeApp key="0"
    fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
    loadUpdatedSelf={props.isRoot} AppFrame={AppFrame}
    appFrameStyle={[mainStyle, appFrameStyle]} {...props}
  />;
}