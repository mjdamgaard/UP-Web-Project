


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




export async function fetchPreferredSubApp(appDirID, scoreHandlerID = "0") {

  // TODO: Implement
}


export async function updatePreferredSubApp(appDirID, scoreHandlerID = "0") {

  // TODO: Implement
}


export async function fetchPreferredSubAppList(appDirID, scoreHandlerID = "0") {

  // TODO: Implement
}




/* SMFs for fetching and updating user preferences */


export async function fetchUserPreference(appDirID) {

  // TODO: Implement
}

export async function updateUserPreference(appDirID, subAppDirID) {

  // TODO: Implement
}

export async function removeUserPreference(appDirID) {

  // TODO: Implement
}
