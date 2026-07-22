
/* HOISTED IMPORTS */
import "./src/AppLoader.jsx";
import "./src/WarningWrapper.jsx";
import "./src/AppFrame.jsx";
import "./src/AboutPage.jsx";
/* END */

// Here we use a convention where the main.jsx module's only responsibilities
// are to style the app, and potentially define some fundamental props, like
// the 'fetchBestVersionRouteTemplate' prop in our case. The main.jsx component
// can also "hoist" the imports, like seen above (for which we will at some
// point implement a command in the directory updater program, namely one that
// creates or updates this list of hoisted imports automatically.

import * as BaseApp from "./BaseApp.jsx";
import * as mainStyle from "./style.css";

const fetchBestVersionRouteTemplate = abs(
  "./server/apps/apps.sm.js./callSMF/fetchPreferredSubApp/" +
  "$appDirID/$useOriginal"
);


export function render(props) {
  return <div innerStyle={mainStyle}>
    <BaseApp key="0"
      fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate} {...props}
    />
  </div>;
}