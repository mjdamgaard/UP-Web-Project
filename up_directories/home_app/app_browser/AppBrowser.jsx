
import {split, substring} from 'string';
import {at} from 'array';
import {fetchEntityPath} from "/1/1/entities.js";
import * as NavigationPath from "./NavigationPath.jsx";
import * as EntityPage from "./EntityPage.jsx";



export function initialize() {
  // Initialize a cache for entPaths, since this browser app would produce a
  // lot of redundant fetch requests otherwise. (So even though those requests
  // will likely be HTTP-cached, it might still be worth it to use this cache.)
  let epCache = new EntityPathCache();

  return {epCache: epCache};
}


export function render({homeURL, tailURL}) {
  let {epCache} = this.state;
  this.provideContext("homeURL", homeURL);

  // The tailURL is supposed to be of the form '(/<entID>)*'.
  let urlEntIDs = split(substring(tailURL, 1), "/");
  let curEntID = at(urlEntIDs, -1);

  return <div className="app-browser">
    <NavigationPath key={tailURL} urlEntIDs={urlEntIDs} epCache={epCache} />
    <EntityPage key={"ep-" + curEntID} entID={curEntID} epCache={epCache} />
  </div>;
}




class EntityPathCache {
  constructor() {
    this.cache = new MutableObject();
  }

  // getEntPathOrPromise() returns the entPath if already cached, or else
  // returns a promise that resolves to that entPath.
  getEntPathOrProm(entID) {
    let ret = this.cache[entID];
    if (!ret) ret = this.fetchEntPath(entID);
    return ret;
  }

  async fetchEntPath(entID) {
    entPath = await fetchEntityPath(entID);
    if (entPath) this.cache[entID] = entPath;
    return entPath;
  }
}




export const styleSheets = [];
