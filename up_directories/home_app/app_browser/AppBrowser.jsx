
import {split, substring} from 'string';
import {at} from 'array';
import * as NavigationPath from "./NavigationPath.jsx";
import * as EntityPage from "./EntityPage.jsx";



export function render({homeURL, tailURL}) {
  this.provideContext("homeURL", homeURL);

  // The tailURL is supposed to be of the form '(/<entID>)*'.
  let urlEntIDs = split(substring(tailURL, 1), "/");
  let curEntID = at(urlEntIDs, -1);

  return <div className="app-browser">
    <NavigationPath key={tailURL} urlEntIDs={urlEntIDs} />
    <EntityPage key={"ep-" + curEntID} entID={curEntID} />
  </div>;
}




export const styleSheets = [];
