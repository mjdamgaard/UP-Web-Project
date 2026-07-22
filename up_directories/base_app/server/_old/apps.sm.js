
import {post, fetch, fetchPrivate, clearPermissions} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {verifyTypes, hasType} from 'type';
import {parse, stringify} from 'json';
import {split} from 'string';
import {at} from 'array';

import {fetchEntityDefinition, fetchRelationalQualityPath} from 
  "../../../semantic_entities/entities.js";

import {scoreHandler02 as defaultScoreHandler} from
  "../../../semantic_entities/score_handling/ScoreHandler01/em.js";

const versionsRelKey = abs("../../semantic_entities/em3.js;get/versionsRel");

const maxRecLevel = 3;




// NOTE: This algorithm has not been tested yet, and is not actually used by
// this version of the base app, as we have instead opted to use a more simple
// system of likes and dislikes at first, found in ~/../app_browser/server.




// The algorithm that this SM implements for getting the best sub-app to load
// a given input appDirID uses a cache with a PK of a scoreHandlerID and the
// input appDirID, and with a string(/text)-valued payload consisting of a list
// of subAppDirIDs. Each subAppDirID in this list is the app that is rated as
// the best sub-app for its predecessor, implicitly starting with the appDirID
// of the PK, according to the scoreHandler.
//
// When fetching the best sub-app, if the user is not logged in, the SMF (i.e.
// fetchPreferredSubApp()) just selects the last subAppID in the list. But when
// the user is logged in, the SMF also fetches a JSON object representing
// specific user preferences, and diverges from the list of sub-apps whenever
// the preferences tells it to go to a specific sub-app from there, instead of
// continuing along the list. When branching this way, the SMF then fetches the
// payload list of the branched-to sub-app from the same cache, and repeats
// this process from there (but with a maximal recursion level before it stops
// regarding the user preferences and just takes the sub-app at the end of the
// list.)
//
// These payload lists are updated one appDirID at a time, where the update
// SMF (i.e. updatePreferredSubApp()) only takes one appDirID, fetches the list
// payload from the cache, queries the scoreHandler for the best sub-app for
// the input appDirID, and if a new result is obtained the differs from the
// first subAppDirID in the list (and with a high enough score and weight), the
// SMF simply replaces the first subAppDirID in the list, then looks in the
// same cache for the subAppDirID list of this replacement, and appends this
// list right after the now replaced first subAppDirID in the first list. So
// if one sub-app replaces another somewhere down the app tree, you actually
// need to make one update request for each ancestor node, in the order from
// bottom to top, to update the tree fully.
//
// In order for the client/app to know which ancestor apps are worth making
// update requests to in order to update the app tree, this SM also provides
// a function (i.e. fetchPreferredSubAppList) to query the sub-app lists of the
// cache directly (disregarding user preferences).
//
// Lastly, an input scoreHandlerID of "0" is interpreted as a placeholder for a
// default score handler of this SM's choice (and which can change in time, but
// where we always cache the data under the scoreHandlerID of "0" in the PK). 




/* SMFs for fetching and updating user preferences */

export async function fetchPreferredSubApp(appDirID, scoreHandlerID = "0") {
  verifyTypes([appDirID, scoreHandlerID], ["hex", "hex"]);

  // Check that the post request was sent from the ../main.jsx app or the
  // the app browser app.
  checkRequestOrigin(true, [
    abs("../main.jsx"),
    abs("../../app_browser/main.jsx"),
  ]);

  // Get the ID of the requesting user, which is undefined if not logged in.
  let userID = getRequestingUserID();

  // If the user is logged in, fetch the preferences object, alongside the
  // subApps.att ("cache") entry for scoreHandlerID and appDirID, and else just
  // fetch the latter.
  let preferences, subAppIDListString;
  if (userID) {
    [preferences, subAppIDListString] = await Promise.all([
      fetchUserPreferences(),
      fetch(abs("./subApps.att./entry/l/" + scoreHandlerID + "/k/" + appDirID))
    ]);
  }
  else {
    subAppIDListString =
      fetch(abs("./subApps.att./entry/l/" + scoreHandlerID + "/k/" + appDirID));
  }
  
  // Then redirect to the recursive fetchPreferredSubAppHelper(). 
  return await fetchPreferredSubAppHelper(
    appDirID, scoreHandlerID, preferences, subAppIDListString
  );
}


async function fetchPreferredSubAppHelper(
  appDirID, scoreHandlerID, preferences, subAppIDListString, recLevel = 0
) {
  // Parse the subAppIDListString into an array, putting the initial appDirID
  // itself in front of the list.
  let appIDListString = !subAppIDListString ? appDirID :
    appDirID + "," + subAppIDListString;
  let appIDArr = split(appIDListString, ",");

  // If the user is not logged in, or if the maximal recursion level has been
  // reached, simply return the last entry of this list.
  if (!preferences || recLevel >= maxRecLevel) {
    return at(appIDArr, -1);
  }

  // Else loop through the appIDArr until a user preference overwrites the next
  // subAppDirID in the list.
  let subAppDirID;
  let len = appIDArr.length;
  for (let i = 0; i < len; i++) {
    subAppDirID = appIDArr[i];
    let substituteAppID = preferences[subAppDirID];
    if (substituteAppID && substituteAppID !== subAppIDArr[i + 1]) {
      subAppIDListString = await fetch(abs(
        "./subApps.att./entry/l/" + scoreHandlerID + "/k/" + substituteAppID
      ));
      return await fetchPreferredSubAppHelper(
        substituteAppID, scoreHandlerID, preferences, subAppIDListString,
        recLevel + 1
      );
    }
  }

  // And if no preference caused a divergence from the list, return the last
  // element in the list (which might be the initial appDirID itself).
  return subAppDirID; 
}




export async function updatePreferredSubApp(appDirID, scoreHandlerID = "0") {
  verifyTypes([appDirID, scoreHandlerID], ["hex", "hex"]);

  // Check that the post request was sent from the ../main.jsx app or the
  // the app browser app.
  checkRequestOrigin(true, [
    abs("../main.jsx"),
    abs("../../app_browser/main.jsx"),
  ]);

  // Start fetching the quality path.
  let topSubAppQualPathProm =
    fetchRelationalQualityPath(appDirID, versionsRelKey);

  // Get/fetch the score handler.
  let scoreHandler;
  if (scoreHandlerID === "0") {
    scoreHandler = defaultScoreHandler;
  }
  else {
    scoreHandler = await fetchEntityDefinition(scoreHandlerID);
  }

  // Await the quality path.
  let topSubAppQualPath = await topSubAppQualPathProm;

  // Use the score handler's fetchTopEntry() method to get the ID of the top
  // app entity, along with the score and the weight. (We of course clear the
  // permissions first such that this client-controlled function is safe to
  // execute.)
  let topEntry;
  clearPermissions(() => {
    let options = {moderate: true, threshold: [5, 10]};
    topEntry = await = scoreHandler.fetchTopEntry(topSubAppQualPath, options);
  });
  let [topSubAppEntID] = topEntry ?? [];

  // If no top entry was found, given the score >= 5, weight >= 10 threshold,
  // remove the current entry in subApps.att if one exists.
  if (!topSubAppEntID) {
    await post(abs(
      "./subApps.att/_deleteEntry/l/" + scoreHandlerID + "/k/" + appDirID
    ));
    return;
  } 

  // Else fetch the entity definition of the sub-app entity, and extract the
  // app's *directory* ID from it.
  let appEntDef =
    await fetchEntityDefinition(scoreHandlerID, ["App directory ID"]) ?? {};
  let subAppDirID = appEntDef["App directory ID"];

  // If the subAppDirID is invalid, or is the appDirID itself, also remove any
  // current entry in subApps.att
  if (!hasType(subAppDirID, "hex") || subAppDirID === appDirID) {
    await post(abs(
      "./subApps.att/_deleteEntry/l/" + scoreHandlerID + "/k/" + appDirID
    ));
    return;
  }

  // Else fetch the subApps list for the subAppDirID, prepend subAppDirID
  // itself to it, and insert that string as the subApps.att entry for appDirID.
  let subSubAppIDListString = await fetch(abs(
    "./subApps.att./entry/l/" + scoreHandlerID + "/k/" + subAppDirID
  ));
  let subAppIDListString = subAppDirID + (
    subSubAppIDListString ? "," + subSubAppIDListString : ""
  );
  await post(
    abs("./subApps.att/_insert/l/" + scoreHandlerID + "/k/" + appDirID),
    subAppIDListString
  );
  return;
}



export async function fetchPreferredSubAppList(appDirID, scoreHandlerID = "0") {
  verifyTypes([appDirID, scoreHandlerID], ["hex", "hex"]);
  // (This SMF does not query any private data, and we thus do not need to
  // check the origin.)

  let subAppIDListString = await fetch(abs(
    "./subApps.att./entry/l/" + scoreHandlerID + "/k/" + appDirID
  ));

  // Return the list as an array for convenience.
  return subAppIDListString ? split(subAppIDListString, ",") : [];
}





/* SMFs for fetching and updating user preferences */

export async function fetchUserPreferences() {
  // Check that the post request was sent from the ../main.jsx app or the
  // the app browser app.
  checkRequestOrigin(true, [
    abs("../main.jsx"),
    abs("../../app_browser/main.jsx"),
  ]);

  // Get the ID of the requesting user, which is undefined if not logged in.
  let userID = getRequestingUserID();

  if (!userID) throw (
    "User is not logged in"
  );

  let prefJSON = fetchPrivate(abs(
    "~/server/apps/_userPreferences.att./entry/k/" + userID
  ));
  let preferences = parse(prefJSON);
  return preferences;
}


export async function updateUserPreference(appDirID, subAppDirID) {
  verifyTypes([appDirID, subAppDirID], ["hex", "hex?"]);
  let preferences = await fetchUserPreferences(appDirID);
  preferences = {...preferences, [appDirID]: subAppDirID};
  let newPrefJSON = stringify(preferences)
  return await post(
    abs(
      "~/server/apps/_userPreferences.att./_insert/k/" +
      userID
    ),
    newPrefJSON
  );
}


export async function removeUserPreference(appDirID) {
  return await updateUserPreference(appDirID, undefined);
}





/* SMF for fetching the "trust class" (used by App.jsx) */

export async function fetchTrustClass(appDirID, scoreHandlerID = "0") {
  // TODO: Implement.
}