
import {fetchUserScore} from "../scores.js";




// A class to generate a list combined of several other scored lists. 
export class SimpleScoreHandler {
  
  constructor(aggregator, fetchUserGroup, doc) {
    this.aggregator = aggregator;
    this.fetchUserGroup = fetchUserGroup;
    this["Documentation"] = doc;
  }

  Class = abs("../em1.js;get/scoreHandlers");


  fetchScoreData(qualIdent, subjIdent, options = {}) {
    return new Promise(resolve => {
      let {user: userIdent, queryUser} = options;

      // If the queryUser option is true, query and resolve with the user's
      // own score (and an undefined weight) 
      if (queryUser) {
        fetchUserScore(qualIdent, subjIdent, userIdent).then(userScore => {
          resolve([userScore]);
        });
      }

      // And else, query an appropriate user group for their (aggregated) score.
      else {
        this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
          this.aggregator.fetchScoreData(
            userGroupIdent, qualIdent, subjIdent, options
          ).then(
            scoreData => resolve(scoreData)
          );
        });
      }
    });
  }



  fetchList(qualIdent, options = {}) {

  }



  updateScoreForUser(qualIdent, subjIdent, userID, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
        this.aggregator.updateScoreForUser(
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
        this.aggregator.updateScoreForGroup(
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
        this.aggregator.updateList(
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
