
import {split, substring} from 'string';
import {at} from 'array';
import {urlActions, urlEvents} from '../urlActions.js';
import * as NavigationPath from "./NavigationPath.jsx";
import * as EntityPage from "./EntityPage.jsx";



export function initialize({homeURL, tailURL}) {
  this.provideContext("homeURL", homeURL);

  // The tailURL is supposed to be of the form '(/<entID>)*'.
  let urlEntIDs = split(substring(tailURL, 1), "/");
  let curEntID = at(urlEntIDs, -1);

  // If there is no curEntID, fetch the entID of the 'Apps' class, then replace
  // ...

  return {urlEntIDs: urlEntIDs, curEntID: curEntID};
}


export function render({homeURL, tailURL}) {
  this.dependencies(homeURL, tailURL);
  let {urlEntIDs, curEntID} = this.state;

  return <div className="app-browser">
    <NavigationPath key={tailURL} urlEntIDs={urlEntIDs} />
    <EntityPage key={"ep-" + curEntID} entID={curEntID} />
  </div>;
}



export const actions = urlActions;

export const events = urlEvents;


export const styleSheets = [];
