
/* HOISTED IMPORTS */
import "../semantic_entities/entities.js";
import "./src/EntityPage.jsx";
import "../base_app/src/MissingPage.jsx";
/* END */

// TODO: Update the above list, and make sure to include some descendants down
// the line, instead of just the same imports as in AppBrowser.jsx.

// Here we use a convention where the main.jsx module's only responsibilities
// are to style the app component, in this case AppBrowser.jsx, and
// possibly to "hoist" the imports of the app component (for which we will at
// some point implement a command in the directory updater program, namely
// one that creates or updates the list of hoisted imports automatically,
// formatted like the list seen above, at the start of the file).

import * as AppBrowser from "./AppBrowser.jsx";
import * as mainStyle from "../base_app/style.css";
import * as entListStyle from "./src/EntityList.css";
import * as ratingsStyle from "./src/ratings/style.css";
import * as tabbedPagesStyle from "../utilities/TabbedPages.css";


export function render(props) {
  this.trigger("showFrame");
  return <div innerStyle={[
    mainStyle, entListStyle, ratingsStyle, tabbedPagesStyle,
  ]}>
    <AppBrowser {...props} key="0" />
  </div>;
}