
import {substring} from 'string';

import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";


export function render({url, history, userID, homeURL = ""}) {
  this.setContext("history", history);
  this.setContext("userID", userID);
  this.setContext("homeURL", homeURL);

  // Subtract the homeURL from url before passing it to AppMain and AppHeader.
  url = substring(url, homeURL.length);

  return (
    <div className="app">
      <AppHeader key="h" url={url} userID={userID} />
      <AppMain key="m" url={url} userID={userID} />
    </div>
  );
}




export const styleSheets = [
  abs("./style.css"),
];
