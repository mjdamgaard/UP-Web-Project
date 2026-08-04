
import {getHomeDirID, getNodeID} from 'route';
import {fetchEntityPath, fetchEntityID} from
  "~/../semantic_entities/entities.js";

const nodeID = getNodeID();

const versionsPath = abs("~/../semantic_entities/em3.js;get/versionsRel");
const membersPath = abs("~/../semantic_entities/em1.js;get/members");
const appsPath = abs("~/../semantic_entities/em3.js;get/apps");
const appBrowserPath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + getHomeDirID();
const baseAppPath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + getHomeDirID(abs("~/../base_app"));
const fileBrowserPath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + getHomeDirID(abs("~/../file_browser"));



// For this root version of the app browser, we just use hard-coded lists
// for all the app and category/class pages. The SMFs below thus do not need
// to be called server-side, but can also just be imported and called client-
// side.


export async function fetchList(objKey, relKey) {
  let [objPath, relPath] = await Promise.all([
    fetchEntityPath(objKey),
    fetchEntityPath(relKey),
  ]);

  let subjIDArr = [];
  if (relPath === membersPath) {
    if (objPath === appsPath) {
      subjIDArr = await Promise.all([
        fetchEntityID(appBrowserPath),
        fetchEntityID(fileBrowserPath),
        fetchEntityID(baseAppPath),
      ]);
    }
  }

  return subjIDArr.map(subjID => [subjID, 5]);
}