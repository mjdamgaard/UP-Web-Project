
/* HOISTED IMPORTS */
import "./src/FileBrowserPage.jsx";
/* END */

import * as FileBrowser from "./FileBrowser.jsx";
import * as theme from "../home_app/style.css";
import * as ownStyle from "./style.css";

export function render(props) {
  this.trigger("showFrame");
  return <div>
    <FileBrowser key="f" style={[theme, ownStyle]} {...props}/>
  </div>;
}