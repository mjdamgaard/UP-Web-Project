
/* HOISTED IMPORTS */
import "./src/AppLoaderWrapper.jsx";
import "./src/AppLoader.jsx";
import "./src/AppFrame.jsx";
import "./src/AppHeader.jsx";
import "./src/AboutPage.jsx";
import "./src/urlActions.js";
/* END */

// Here we use a convention where the main.jsx module's only responsibilities
// are to style the app component, in this case BaseApp.jsx, and possibly to
// "hoist" the imports of the app component (for which we will at some point
// implement a command in the directory updater program, namely one that
// creates or updates the list of hoisted imports automatically, formatted like
// the list seen above, at the start of the file).

import * as BaseApp from "./BaseApp.jsx";
import * as mainStyle from "./style.css";


export function render(props) {
  return <div innerStyle={mainStyle}>
    <BaseApp {...props} key="0" />
  </div>;
}