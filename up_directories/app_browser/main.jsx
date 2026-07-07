
/* HOISTED IMPORTS */
import "../semantic_entities/entities.js";
import "../base_app/urlActions.js";
import "./src/EntityPage.jsx";
/* END */

// TODO: Update the above list, and make sure to include some descendants down
// the line, instead of just the same imports as in AppBrowser.jsx.

// Here we use a convention where the main.jsx module's only responsibilities
// are to style the app component, in this case AppBrowser.jsx, and
// possibly to "hoist" the imports of the app component (for which we will at
// some point implement a command in the directory updater program, namely
// one that creates or updates the list of hoisted imports automatically,
// formatted like the list seen above, and put/expected at the start of the
// file).

import * as AppBrowser from "./AppBrowser.jsx";
import * as mainStyle from "../base_app/style.css";


export function render(props) {
  return <div innerStyle={mainStyle}>
    <AppBrowser {...props} key="0" />
  </div>;
}