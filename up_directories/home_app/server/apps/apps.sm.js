
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {verifyType, verifyTypes} from 'type';
import {parse, stringify} from 'json';

const maxRecLevel = 3;


/* SMFs for fetching and updating user preferences */

export async function fetchBestSubApp(appDirID) {
  verifyType(appDirID, "hex");

  // Get the ID of the requesting user, which is undefined if not logged in.
  let userID = getRequestingUserID();

  // If the user is logged in, check that the post request was sent from the
  // ../main.jsx app or the app browser app.
  if (userID) {
    checkRequestOrigin(true, [
      abs("~/main.jsx"),
      abs("~/../app_browser/main.jsx"),
    ]);
  }


  // If the user is logged in, fetch the preferences object, alongside the
  // subApps.att ("cache") entry for the appDirID, and else just fetch the
  // latter.
  let preferences, subAppIDListString;
  if (userID) {
    [preferences, subAppIDListString] = await Promise.all([
      fetchUserPreferences(),
      fetch(abs("./subApps.att/entry/k/" + appDirID))
    ]);
  }
  else {
    subAppIDListString = await fetch(abs("./subApps.att/entry/k/" + appDirID));
  }
  
  // Then redirect to the recursive fetchBestSubAppHelper(). 
  let preferredAppDirID = await fetchBestSubAppHelper(
    appDirID, preferences, subAppIDListString
  );

  // And finally get the recorded trust class for the app, defaulting to
  // "untrusted", and return this along with the preferredAppDirID.
  let trustClass = await fetch(abs(
    "./trustClasses.att/entry/k/" + preferredAppDirID
  ));
  return {appDirID: preferredAppDirID, trustClass: trustClass || "untrusted"};
}


async function fetchBestSubAppHelper(
  appDirID, preferences, subAppIDListString, recLevel = 0
) {
  // Parse the subAppIDListString into an array, putting the initial appDirID
  // itself in front of the list.
  let appIDListString = !subAppIDListString ? appDirID :
    appDirID + "," + subAppIDListString;
  let appIDArr = appIDListString.split(",");

  // If the user is not logged in, or if the maximal recursion level has been
  // reached, simply return the last entry of this list.
  if (!preferences || recLevel >= maxRecLevel) {
    return appIDArr.at(-1);
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
        "./subApps.att/entry/k/" + substituteAppID
      ));
      return await fetchBestSubAppHelper(
        substituteAppID, preferences, subAppIDListString, recLevel + 1
      );
    }
  }

  // And if no preference caused a divergence from the list, return the last
  // element in the list (which might be the initial appDirID itself).
  return subAppDirID; 
}




export async function updateBestSubApp(appDirID) {
  verifyType(appDirID, "hex");

  // Fetch the top liked sub apps for this app, then go through the list until
  // reaching the first sub-app on the list that has 20 up-rates or more and
  // is also (semi-)trusted. 
  let topSubApps = await fetch(abs(
    "../rates/mixedSums.bbt/skList/l/" + appDirID + "/n/25"
  )) ?? [];
  let subAppDirID;
  let len = topSubApps.length;
  for (let i = 0; i < len; i++) {
    [subAppDirID, score] = topSubApps[i];
    if (!score || score < 20) continue;
    let trustClass = await fetch(abs(
      "./trustClasses.att/entry/k/" + subAppDirID
    ));
    if (trustClass === "trusted" || trustClass === "semi-trusted") {
      break;
    }
  }

  // If no (semi-)trusted sub-app was found, or if subAppDirID == appDirID,
  // delete any existing entry in subApps.att. 
  if (!subAppDirID || subAppDirID === appDirID) {
    await post(abs("./subApps.att/_deleteEntry/k/" + appDirID));
    return false;
  }

  // Else fetch the subApps list for the subAppDirID, prepend subAppDirID
  // itself to it, and insert that string as the subApps.att entry for appDirID.
  let subSubAppIDListString = await fetch(abs(
    "./subApps.att/entry/k/" + subAppDirID
  ));
  let subAppIDListString = subAppDirID + (
    subSubAppIDListString ? "," + subSubAppIDListString : ""
  );
  await post(
    abs("./subApps.att/_insert/k/" + appDirID), subAppIDListString
  );
  return;
}



export async function fetchBestSubAppList(appDirID) {
  verifyType(appDirID, "hex");
  // (This SMF does not query any private data, and we thus do not need to
  // check the origin.)

  let subAppIDListString = await fetch(abs(
    "./subApps.att/entry/k/" + appDirID
  ));

  // Return the list as an array for convenience.
  return subAppIDListString ? subAppIDListString.split(",") : [];
}





/* SMFs for fetching and updating user preferences */

export async function fetchUserPreferences() {
  // Check that the post request was sent from the ../main.jsx app or the
  // the app browser app.
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
    abs("~/../app_browser/main.jsx"),
  ]);

  // Get the ID of the requesting user, which is undefined if not logged in.
  let userID = getRequestingUserID();

  if (!userID) throw (
    "User is not logged in"
  );

  let prefJSON = await fetchPrivate(abs(
    "./_userPreferences.att/entry/k/" + userID
  ));
  let preferences = prefJSON ? parse(prefJSON) : {};
  return preferences;
}


export async function updateUserPreference(appDirID, subAppDirID) {
  verifyTypes([appDirID, subAppDirID], ["hex", "hex?"]);
  let preferences = await fetchUserPreferences(appDirID);
  preferences = {...preferences, [appDirID]: subAppDirID};
  let newPrefJSON = stringify(preferences)
  return await post(
    abs("./_userPreferences.att/_insert/k/" + userID), newPrefJSON
  );
}


export async function removeUserPreference(appDirID) {
  return await updateUserPreference(appDirID, undefined);
}
