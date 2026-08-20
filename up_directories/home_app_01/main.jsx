
/* HOISTED IMPORTS */
/* END */

// Here we use a convention where the main.jsx module's only responsibilities
// are to style the app, and potentially define some fundamental props, like
// the 'fetchBestVersionRouteTemplate' prop in our case. The main.jsx component
// can also "hoist" the imports, like seen above (for which we will at some
// point implement a command in the directory updater program, namely one that
// creates or updates this list of hoisted imports automatically.

import * as HomeApp from "../home_app/HomeApp.jsx";
import * as mainStyle from "../home_app/style.css";
import * as AppFrame from "../home_app/src/AppFrame.jsx";
import * as appFrameStyle from "../home_app/src/AppFrame.css";
import * as ownStyle from "./style.css";

const fetchBestVersionRouteTemplate = abs(
  "../home_app/server/apps/apps.sm.js./callSMF/fetchBestSubApp/" +
  "$appDirID/$useOriginal"
);


export function render(props) {
  this.trigger("hideFrame");
  return <HomeApp key="0"
    fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
    loadUpdatedSelf={props.isRoot} mainStyle={mainStyle} AppFrame={AppFrame}
    appFrameStyle={[mainStyle, appFrameStyle, ownStyle]} {...props}
  />;
}