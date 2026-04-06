
import {split, substring} from 'string';
import {at} from 'array';
import {fetchEntityID} from "/1/1/entities.js";
import {urlActions, urlEvents} from "../urlActions.js";
import * as NavigationPath from "./NavigationPath.jsx";
import * as EntityPage from "./EntityPage.jsx";



export async function initialize({homeURL, tailURL}) {
  this.provideContext("homeURL", homeURL);

  // The tailURL is supposed to be of the form '(/<entID>)*'. NOTE: This URL
  // API might very well change in the near future, so don't get too attached.
  let urlEntIDs = split(substring(tailURL, 1), "/");
  let curEntID = at(urlEntIDs, -1);

  // Set the initial state (before any 'await' statements).
  this.setState({urlEntIDs: urlEntIDs, curEntID: curEntID});

  // If there is no curEntID, fetch the entID of the 'Apps' class, then replace
  // the URL.
  if (!curEntID) {
    let appsClassID = await fetchEntityID("/1/1/em3.js;get/apps");
    this.trigger("replaceURL", "~/" + appsClassID);
  }
}


export function render({homeURL, tailURL}) {
  this.constant(homeURL, tailURL);
  let {urlEntIDs, curEntID} = this.state;

  if (!curEntID) {
    return <div className="app-browser fetching">...</div>;
  }

  return <div className="app-browser">
    <NavigationPath key={tailURL} urlEntIDs={urlEntIDs} />
    <EntityPage key={"ep-" + curEntID} entID={curEntID} />
  </div>;
}



export const actions = urlActions;

export const events = urlEvents;


export const styleSheets = [];
