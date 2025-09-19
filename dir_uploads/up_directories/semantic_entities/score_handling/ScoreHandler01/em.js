
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../../scores.js";
import {fetchEntityID, fetchEntityPath} from "../../entities.js";
import {map} from 'array';
import ModeratedList from "../../scored_lists/moderated/ModeratedList.js";
import CombinedList from "../../scored_lists/comb/CombinedList.js";
import SimpleScoreHandler from "../SimpleScoreHandler.js";
import {MeanAggregator} from "../../aggregating/mean/MeanAggregator.js";

const trustedQualPath = abs("../../em1.js;get/trusted");

const meanAggregator = new MeanAggregator();



// List of initial moderators of the app.
export const initialModeratorList = {
  "Class": abs("../../em1.js;get/scoredLists"),

  fetchScoreData: (subjKey) => {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        abs("./init_mods.bbt"), [], subjKey
      ).then(
        scoreData => resolve(scoreData)
      );
    });
  },

  fetchList: ({lo, hi, maxNum = 4000, offset = 0, isAscending = 0}) => {
    return new Promise(resolve => {
      fetchScoreAndWeightList(
        abs("./init_mods.bbt"), [], lo, hi, maxNum, offset, isAscending
      ).then(
        list => resolve(list)
      );
    });
  },

  "Documentation": <div>
    <h1>{"Initial moderator list"}</h1>
    <p>{
      "A list of initial developers/moderators that is trusted to govern " +
      "the qualities used for determining the UI of the app, and other " +
      "important, security-related matters."
    }</p>
  </div>,
};

export const initialModeratorGroup = {
  "Class": abs("../../em1.js;get/userGroups"),
  "Name": "Initial moderator group",
  "User list": abs("./em.js;get/initialModeratorList"),
  "Description": <div>
    <h1>{"Initial moderator group"}</h1>
    <p>{
      "A group of initial developers/moderators that is trusted to govern " +
      "the qualities used for determining the UI of the app, and other " +
      "important, security-related matters."
    }</p>
  </div>,
};



// List of all users with equal weights = 1.
export const allUsersList = {
  "Class": abs("../../em1.js;get/scoredLists"),

  fetchScoreData: (subjKey) => {
    return new Promise(resolve => {
      fetchEntityID(subjKey).then(userEntID => resolve(
        [userEntID, 1]
      ));
    });
  },

  fetchList: ({lo, hi, maxNum, offset, isAscending}) => {
    return new Promise(resolve => {
      fetch(
        abs("../.././users.bt/skList") +
        (lo !== undefined ? "/lo=" + lo : "") +
        (hi !== undefined ? "/hi=" + hi : "") +
        (maxNum !== undefined ? "/n=" + maxNum : "") +
        (offset !== undefined ? "/o=" + offest : "") +
        (isAscending !== undefined ? "/a=" + isAscending : "")
      ).then(list => {
        resolve(map(list, ([userEntID]) => [userEntID, 1]));
      });
    });
  },

  "Documentation": <div>
    <h1>{"All users"}</h1>
    <p>{
      "A list of all users with equal weights, all of 1. The " +
      "fetchScoreData() method just returns [userID, 1] without " +
      "checking that the user exists. And the fetchList() methods returns " +
      "the user list gotten from " + abs("./../../users.bt") + "."
    }</p>
  </div>,
};






// Here we make a user group of users that are trusted by the initial
// moderators.

function exponentialConvert(predicateScore) {
  let weight = 4 ** predicateScore;
  return weight;
}

export const initialTrustedUserList = new ModeratedList(
  abs("./em.js;get/initialTrustedUserList"),
  abs("./em.js;get/initialModeratorGroup"),
  trustedQualPath, 
  abs("./em.js;get/scoreHandler01"),
  exponentialConvert,
);


export const initialTrustedUserGroup = {
  "Class": abs("../../em1.js;get/userGroups"),
  "Name": "Initial trusted user group",
  "User list": abs("./em.js;get/initialTrustedUserList"),
  "Description": <div>
    <h1>{"Initial trusted user group"}</h1>
    <p>{
      "TODO: Make."
    }</p>
  </div>,
};



// And this is a group of the users trusted by those "initially trusted users,"
// i.e. the users trusted by the users trusted by the moderators.

export const initialSecondHandTrustedUserList = new ModeratedList(
  abs("./em.js;get/initialSecondHandTrustedUserList"),
  abs("./em.js;get/initialTrustedUserGroup"),
  trustedQualPath, 
  abs("./em.js;get/scoreHandler01"),
  exponentialConvert,
);

export const initialSecondHandTrustedUserGroup = {
  "Class": abs("../../em1.js;get/userGroups"),
  "Name": "Initial second-hand-trusted user group",
  "User list": abs("./em.js;get/initialTrustedUserList2"),
  "Description": <div>
    <h1>{"Initial second-hand-trusted user group"}</h1>
    <p>{
      "TODO: Make."
    }</p>
  </div>,
};



// And combining this second-hand-trusted user group with the group of all,
// users where only a very tiny weight is given to the latter, we get the user
// group that is intended as an initial standard user group to query all
// matters that is not a security concern (so not things like UI or URL safety,
// and such, where we want to query one of the groups higher up in this
// hierarchy.) Note that all these groups can be changed to whatever the users
// like at a later time.

export const initialStandardUserList = new CombinedList(
  abs("./em.js;get/initialStandardUserList"), [
    abs("./em.js;get/initialSecondHandTrustedUserList"),
    abs("./em.js;get/allUsersList"),
  ], [
    1,
    0.000001,
  ],
);

export const initialStandardUserGroup = {
  "Class": abs("../../em1.js;get/userGroups"),
  "Name": "Initial standard user group",
  "User list": abs("./em.js;get/initialStandardUserList"),
  "Description": <div>
    <h1>{"Initial standard user group"}</h1>
    <p>{
      "TODO: Make."
    }</p>
  </div>,
};







// Function that this initial score handler uses to get the user group to use
// when fetching scores for a given quality.  
function fetchUserGroup(qualKey, options = {}) {
  // TODO: Reimplement this function to use the "areas of concern" of the
  // qualities, instead of this hard-coded implementation where one just
  // compares the qualPath to a list of security/UI-related qualities, and
  // use the trusted user group for these qualities, instead of using the
  // standard, second-hand-trusted users + all users group, which is used for
  // all other qualities.
  return new Promise(resolve => {
    if (options.userGroup) {
      resolve(options.userGroup);
    }
    else {
      fetchEntityPath(qualKey).then(qualPath => {
        // TODO: Change such that for relevancy qualities, we also fetch the
        // class or the relation and use their AoC attribute as a fallback. Oh,
        // and for regular qualities, we should also use the AoC attribute as
        // a fallback.
        let userGroupKey = sensitiveQualities[qualPath] ||
          abs("./em.js;get/initialStandardUserGroup");
        resolve(userGroupKey);
      });
    }
  });
}


// Function that this initial score handler uses to get the user groups to use
// when updating the score for a given quality variable.  
function fetchUserGroupsForUpdate(qualKey, options = {}) {
  // TODO: If updating all four user groups for every score update feels to
  // slow, consider only using the initial and first-hand trusted moderator
  // groups when qualPath == trustedQualPath.
  return new Promise(resolve => {
    if (options.userGroupsForUpdate) {
      resolve(options.userGroupsForUpdate);
    }
    else {
      resolve([
        abs("./em.js;get/initialModeratorGroup"),
        abs("./em.js;get/initialTrustedUserGroup"),
        abs("./em.js;get/initialStandardUserGroup"),
      ]);
    }
  });
}

// A qualPath->userGroupKey object used for this initial implementation of
// the fetchUserGroup() above.
const sensitiveQualities = {
  // TODO: Add sensitive qualities.
  [abs("./<qualPath>")]:
    abs("./em.js;get/initialTrustedUserGroup"),
};





export const scoreHandler01 = new SimpleScoreHandler(
  meanAggregator,
  fetchUserGroup,
  fetchUserGroupsForUpdate,
  <div>{"TODO: Make."}</div>
);

