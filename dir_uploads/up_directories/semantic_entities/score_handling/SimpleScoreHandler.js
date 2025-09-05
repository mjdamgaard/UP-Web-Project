
import {MeanAggregator} from "../../aggregating/mean/MeanAggregator.js";
import {fetchUserScore} from "../scores.js";

const meanAggregator = new MeanAggregator();




// A class to generate a list combined of several other scored lists. 
export class SimpleScoreHandler {
  
  constructor(fetchUserGroup, doc) {
    this.fetchUserGroup = fetchUserGroup;
    this["Documentation"] = doc;
  }

  Class = abs("../em1.js;get/scoreHandlers");


  fetchScoreData(qualIdent, subjIdent, options = {}) {
    return new Promise(resolve => {
      let {
        user: userIdent, query = userIdent ? "user-first" : "group"
      } = options;

      // Unless query == "user", query the user group for its score data.
      let groupScoreDataProm = new Promise(res => {
        if (query === "user") {
          return res();
        }
        this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
          meanAggregator.fetchScoreData(
            userGroupIdent, qualIdent, subjIdent, options
          ).then(
            scoreData => res(scoreData)
          );
        });
      });

      // Unless query == "group", query for the user's own score.
      let userScoreProm = (query === "group") ? new Promise(res => res()) :
        fetchUserScore(qualIdent, subjIdent, userIdent);
      
      // And when the score data has been gotten, combine it if query == "user-
      // first", and else just return one of the two.
      Promise.all([groupScoreDataProm, userScoreProm]).then(
        ([groupScoreData, userScore]) => {
          if (query === "group") {
            resolve(groupScoreData);
          }
          else if (query === "user") {
            resolve([userScore]);
          }
          else {
            resolve(userScore !== undefined ? [userScore] : groupScoreData);
          }
        }
      );
    });
  }



  fetchList(qualIdent, options = {}) {
    
  }



  updateScoreForUser(qualIdent, subjIdent, userID, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
        meanAggregator.updateScoreForUser(
          userGroupIdent, qualIdent, subjIdent, userID, options
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  updateScoreForGroup(qualIdent, subjIdent, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
        meanAggregator.updateScoreForGroup(
          userGroupIdent, qualIdent, subjIdent, options
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  updateList(qualIdent, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
        meanAggregator.updateList(
          userGroupIdent, qualIdent, options
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  fetchDefaultOptions(qualIdent) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualIdent).then(userGroupIdent => {
        resolve({userGroup: userGroupIdent});
      });
    });
  }

}


export {SimpleScoreHandler as default};
