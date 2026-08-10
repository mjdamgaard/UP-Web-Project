
import {fetch} from 'query';
import {getHomeDirID, getNodeID} from 'route';
import {fetchEntityPath, fetchEntityID} from
  "~/../semantic_entities/entities.js";

const nodeID = getNodeID();

const versionsPath = abs("~/../semantic_entities/em3.js;get/versionsRel");
const membersPath = abs("~/../semantic_entities/em1.js;get/members");

const appsPath = abs("~/../semantic_entities/em3.js;get/apps");
const soMeAppsPath = abs("~/../semantic_entities/em3.js;get/socialMedia");
const fundAppsPath = abs("~/../semantic_entities/em3.js;get/fundamentalApps");
const gamesPath = abs("~/../semantic_entities/em3.js;get/games");

const appBrowserPath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + getHomeDirID();
const baseAppPath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + getHomeDirID(abs("~/../base_app"));
const fileBrowserPath = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/" + getHomeDirID(abs("~/../file_browser"));



// For this root version of the app browser, we use hard-coded lists that
// always comes first for certain entity lists.



export async function fetchList(objID, relID) {
  let [objPath, relPath] = await Promise.all([
    fetchEntityPath(objID),
    fetchEntityPath(relID),
  ]);

  let [constSubjects, ratedSubjects] = await Promise.all([
    fetchHardCodedList(objPath, relPath),
    fetchRatedEntities(objID, relID),
  ]);

  return [
    ...constSubjects,
    ...ratedSubjects.filter(subjID => !constSubjects.includes(subjID))
  ];
}


export async function fetchHardCodedList(objPath, relPath) {
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
  // TODO: Continue.

  return subjIDArr;
}


export function fetchRatedEntities(objID, relID, maxNum = 50) {
  return fetch(abs(
    "~/../base_app/server/rates/rates.sm.js/callSMF/fetchRatedEntities/" +
    objID + "/" + relID + "/0/" + maxNum
  ));
}
