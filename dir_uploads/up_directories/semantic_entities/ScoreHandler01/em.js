
import {initialModerators} from "./init.sm.js";
import {MeanAggregator} from "../aggregating/mean/MeanAggregator.js";
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../scores.js";
import {fetchEntityID} from "./../entities.sm.js";
import {map} from 'array';

const trustedQualIdent = abs("./../em1.js;get/trusted");



// List of initial moderators of the app.
export const initialModeratorList = {
  "Class": abs("./em1.js;get/scoredLists"),

  fetchScoreData: (subjIdent) => {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        abs("./init_mods.btt"), trustedQualIdent, [], subjIdent
      ).then(
        scoreData => resolve(scoreData)
      );
    });
  },

  fetchList: ({lo, hi, maxNum, offset, isAscending}) => {
    return new Promise(resolve => {
      fetchScoreAndWeightList(
        abs("./init_mods.btt"), trustedQualIdent, [], lo, hi, maxNum = 4000,
        offset = 0, isAscending = 0
      ).then(
        list => resolve(list)
      );
    });
  },

  // fetchTopEntry: () => {
  //   return new Promise(resolve => {
  //     fetchScoreAndWeightList(
  //       abs("./init_mods.btt"), trustedQualIdent, [], lo, hi, maxNum = 1,
  //       offset = 0, isAscending = 0
  //     ).then(
  //       (list = []) => resolve(list[0])
  //     );
  //   });
  // },


  "Documentation": <div>
    <h1>{"Initial moderator list"}</h1>
    <p>{
      "A list of initial developers/moderators that is trusted to govern " +
      "the qualities used for determining the UI of the app, and other " +
      "important, security-related matters."
    }</p>
  </div>,
}




// List of all users with equal weights = 1.
export const allUsersList = {
  "Class": abs("./em1.js;get/scoredLists"),

  fetchScoreData: (subjIdent) => {
    return new Promise(resolve => {
      fetchEntityID(subjIdent).then(userEntID => resolve(
        [userEntID, 1]
      ));
    });
  },

  fetchList: ({lo, hi, maxNum, offset, isAscending}) => {
    return new Promise(resolve => {
      fetch(
        abs(".././users.bt/skList") +
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

  // fetchTopEntry: () => {
  //   return new Promise(resolve => {
  //     fetch(abs(".././users.bt/skList/n=1")).then(list => {
  //       resolve(map(list, ([userEntID]) => [userEntID, 1])[0]);
  //     });
  //   });
  // },


  "Documentation": <div>
    <h1>{"All users"}</h1>
    <p>{
      "A list of all users with equal weights, all of 1. The " +
      "fetchScoreData() method just returns [userID, 1] without " +
      "checking that the user exists. And the fetchList() methods returns " +
      "the user list gotten from " + abs("./../users.bt") + "."
    }</p>
  </div>,
}






export const scoreHandler01 = {
  "Class": abs("./em1.js;get/scoreHandlers"),


  fetchScoreData: (qualIdent, subjIdent, options) => {},



  fetchList: (qualIdent, options) => {},




  fetchTopEntry: (qualIdent, options) => {},




  updateScoreForUser: (qualIdent, subjIdent, userID) => {},




  updateScoreForGroup: (qualIdent, subjIdent, options) => {},




  updateList: (qualIdent, options) => {},




  getDefaultOptions: (qualIdent) => {},



  // TODO: Add documentation.
  "Documentation": undefined,
}




export const rootUserGroup = {
  "Class": abs("./em1.js;get/userGroups"),
  "Name": "Root user group",
  "User list":  abs("./ScoreHandler01.js;get/rootUserList"),
};

class RootUserList extends ScoredList {

  fetchScoreData(userIdent) {
    initialModerators
  }
}

export const rootUserList = new RootUserList();





export {ScoreHandler01 as default};
