
import {ScoreHandler, ScoredList} from "./em1";
import {initialModeratorWeights} from "./init_mods.js";




export class ScoreHandler01 extends ScoreHandler {


  fetchScoreData(qualIdent, subjIdent, options) {}


  


  fetchList(qualIdent, options) {}

  


  fetchTopEntry(qualIdent) {}




  updateScoreForUser(qualIdent, subjIdent, userID) {}

  


  updateScoreForGroup(qualIdent, subjIdent) {}

  


  updateList(qualIdent) {}

  


  getDefaultOptions(qualIdent) {}


  


  fetchUserWeightData(userGroupIdent, userID, options) {}

  
  fetchUserList(userGroupIdent, options) {}

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
