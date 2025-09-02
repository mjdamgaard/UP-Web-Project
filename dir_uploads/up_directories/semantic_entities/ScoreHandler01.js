
import {ScoreHandler, ScoredList} from "./em1";
import {initialModeratorWeights} from "./init_mods.js";
import {MeanAggregator} from "./aggregating/mean/MeanAggregator.js";
import {forEach} from 'array';




export const ScoreHandler01 = {
  "Class": abs("./em1.js;get/scoreHandlers"),


  fetchScoreData: (qualIdent, subjIdent, options) => {},



  fetchList: (qualIdent, options) => {},




  fetchTopEntry: (qualIdent) => {},




  updateScoreForUser: (qualIdent, subjIdent, userID) => {},




  updateScoreForGroup: (qualIdent, subjIdent) => {},




  updateList: (qualIdent) => {},




  getDefaultOptions: (qualIdent) => {},





  fetchUserWeightData: (userGroupIdent, userID, options) => {},


  fetchUserList: (userGroupIdent, options) => {},


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
    initialModeratorWeights
  }
}

export const rootUserList = new RootUserList();





export {ScoreHandler01 as default};
