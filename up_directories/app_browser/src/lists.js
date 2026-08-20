
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

const appPathSubstr = abs("~/../semantic_entities/em3.js;call/App") + "/" +
  nodeID + "/";
const appBrowserPath = appPathSubstr + getHomeDirID();
const homeAppPath = appPathSubstr + getHomeDirID(abs("~/../home_app"));
const fileBrowserPath = appPathSubstr + getHomeDirID(abs("~/../file_browser"));
const homeApp01Path = appPathSubstr + getHomeDirID(abs("~/../home_app_01"));
const flipGamePath = appPathSubstr + getHomeDirID(abs("~/../flip_game"));
const flipGame01Path = appPathSubstr + getHomeDirID(abs("~/../flip_game_01"));
const untrustPath = appPathSubstr + getHomeDirID(abs("~/../untrusted_example"));



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


export function fetchRatedEntities(objID, relID, maxNum = 50) {
  return fetch(abs(
    "~/../home_app/server/rates/rates.sm.js/callSMF/fetchRatedEntities/" +
    objID + "/" + relID + "/0/" + maxNum
  ));
}



export async function fetchHardCodedList(objPath, relPath) {
  let subjIDArr = [];
  if (relPath === membersPath) {
    if (objPath === appsPath) {
      subjIDArr = await Promise.all([
        fetchEntityID(flipGamePath),
        fetchEntityID(appBrowserPath),
        fetchEntityID(fileBrowserPath),
        fetchEntityID(homeAppPath),
        fetchEntityID(untrustPath),
      ]);
    }
  }
  if (relPath === versionsPath) {
    if (objPath === homeAppPath) {
      subjIDArr = await Promise.all([
        fetchEntityID(homeAppPath),
        fetchEntityID(homeApp01Path),
      ]);
    }
    else if (objPath === appBrowserPath) {
      subjIDArr = await Promise.all([
        fetchEntityID(appBrowserPath),
      ]);
    }
    else if (objPath === fileBrowserPath) {
      subjIDArr = await Promise.all([
        fetchEntityID(fileBrowserPath),
      ]);
    }
    else if (objPath === flipGamePath) {
      subjIDArr = await Promise.all([
        fetchEntityID(flipGamePath),
        fetchEntityID(flipGame01Path),
      ]);
    }
  }
  // TODO: Continue.

  return subjIDArr;
}
