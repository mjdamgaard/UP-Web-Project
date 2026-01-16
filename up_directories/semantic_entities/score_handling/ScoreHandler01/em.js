
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../../scores.js";
import {fetchEntityID, fetchEntityPath} from "../../entities.js";
import {map} from 'array';
import ModeratedList from "../../scored_lists/moderated/ModeratedList.js";
import CombinedList from "../../scored_lists/comb/CombinedList.js";
import PriorityList from "../../scored_lists/priority/PriorityList.js";
import SimpleScoreHandler from "../SimpleScoreHandler.js";
import MeanAggregator from "../../aggregating/mean/MeanAggregator.js";
import BiasedMeanAggregator
from "../../aggregating/biased_mean/BiasedMeanAggregator.js";

const trustedQualPath = abs("../../em1.js;get/isTrusted");

const meanAggregator = new MeanAggregator();
const zeroBiasedMeanAggregator = new BiasedMeanAggregator(0, 3);



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

  fetchList: (lo, hi, maxNum = 4000, offset = 0, isAscending = 0) => {
    return new Promise(resolve => {
      fetchScoreAndWeightList(
        abs("./init_mods.bbt"), [], lo, hi, maxNum, offset, isAscending
      ).then(
        list => resolve(list)
      );
    });
  },

  "Description": <div>
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

  fetchList: (lo, hi, maxNum, offset, isAscending) => {
    return new Promise(resolve => {
      fetch(
        abs("../.././users.bt./skList") +
        (lo !== undefined ? "/lo/" + lo : "") +
        (hi !== undefined ? "/hi/" + hi : "") +
        (maxNum !== undefined ? "/n/" + maxNum : "") +
        (offset !== undefined ? "/o/" + offset : "") +
        (isAscending !== undefined ? "/a/" + isAscending : "")
      ).then(list => {
        resolve(map(list, ([userEntID]) => [userEntID, 1]));
      });
    });
  },

  "Description": <div>
    <h1>{"All users"}</h1>
    <p>{
      "A list of all users with equal weights, all of 1. The " +
      "fetchScoreData() method just returns [userID, 1] without " +
      "checking that the user exists. And the fetchList() methods returns " +
      "the user list gotten from " + abs("../../users.bt") + "."
    }</p>
  </div>,
};

export const allUsersGroup = {
  "Class": abs("../../em1.js;get/userGroups"),
  "Name": "Group of all users with equal weights",
  "User list": abs("./em.js;get/allUsersList"),
  "Description": <div>
    <h1>{"Group of all users with equal weights"}</h1>
    <p>{
      "A user group containing all users, where each user has the weight of 1."
    }</p>
  </div>,
};





// Here we make a user group of users that are trusted by the initial
// moderators.

function exponentialConvert(predicateScore) {
  let weight = (predicateScore > 0) ? 2 ** (predicateScore - 5) : 0;
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
      "A group of users who has had their 'trusted' quality scored by the " +
      "group of initial moderators"
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
  "User list": abs("./em.js;get/initialTrustedUserList"),
  "Description": <div>
    <h1>{"Initial second-hand-trusted user group"}</h1>
    <p>{
      "A group of users who have had their 'trusted' quality scored by the " +
      "group of initially trusted users, which are those who have had their " +
      "'trusted' quality scored by the initial moderators."
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
        // TODO: Change such that for relational qualities, we also fetch the
        // class or the relation and use their AoC property as a fallback. Oh,
        // and for regular qualities, we should also use the AoC property as
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
  undefined,
  <div>{"TODO: Make."}</div>
);





// Actually, I think the following user group will be the initial one instead,
// where the weights are 1, unless the given user has had their 'trusted'
// scalar scored by the moderator group. (So this doesn't use the "second-hand-
// trusted" user group.)

export const moderatedAllUsersList = new PriorityList(
  abs("./em.js;get/moderatedAllUsersList"), [
    abs("./em.js;get/initialTrustedUserList"),
    abs("./em.js;get/allUsersList"),
  ],
);

export const moderatedAllUsersGroup = {
  "Class": abs("../../em1.js;get/userGroups"),
  "Name": "Simple moderated user group",
  "User list": abs("./em.js;get/moderatedAllUsersList"),
  "Description": <div>
    <h1>{"Simple moderated user group"}</h1>
    <p>{
      "A user group where all weights are equal to 1, except if the user has " +
      "been scored by a moderator, w.r.t. the 'trusted' quality, in which " +
      "case the resulting weight from that is used instead."
    }</p>
    <p>{
      "This means that moderators can lower the weight of any users that " +
      "seem to be disruptive."
    }</p>
  </div>,
};




function fetchUserGroup2(qualKey, options = {}) {
  return new Promise(resolve => {
    if (options.userGroup) {
      resolve(options.userGroup);
    }
    else {
      resolve(abs("./em.js;get/moderatedAllUsersGroup"));
    }
  });
}

function fetchUserGroupsForUpdate2(qualKey, options = {}) {
  return new Promise(resolve => {
    if (options.userGroupsForUpdate) {
      resolve(options.userGroupsForUpdate);
    }
    else {
      resolve([
        // abs("./em.js;get/initialTrustedUserGroup"),
        abs("./em.js;get/moderatedAllUsersGroup"),
      ]);
    }
  });
}


// But then instead of just using the MeanAggregator, we use an aggregator that
// also transforms all the score data to make the scores biased towards zero.
// (This will not make sense once we start using arbitrary metrics, so at 
// that point, this score handler should be replaced by a more advanced one.) 

export const scoreHandler02 = new SimpleScoreHandler(
  zeroBiasedMeanAggregator,
  fetchUserGroup2,
  fetchUserGroupsForUpdate2,
  abs("./em.js;get/initialModeratorGroup"),
  <div>
    <h1>{"A simple score handler"}</h1>
    <p>{
      "This simple score handler just uses a moderated group of all users, " +
      "where the weight for each user is 1 by default, unless the moderators " +
      "have given the user a different weight."
    }</p>
    <p>{
      "Furthermore, the score handler uses an aggregator that produces the " +
      "weighted average score, except that this score is biased towards 0. " +
      "So all scores will automatically be pulled towards 0 at first, until " +
      "enough users have scored the given scalar."
    }</p>
  </div>
);

