
import {fetchUserScore, fetchUserScoreList} from "../scores.js";
import {filterScoredListWRTWeight} from 'scored_lists';




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
    return new Promise(resolve => {
      let {
        user: userIdent, queryUser, minWeight = 10,
        lo, hi, maxNum, offset, isAscending
      } = options;

      // If the queryUser option is true, query and resolve with the user's
      // own score (and an undefined weight) 
      if (queryUser) {
        fetchUserScoreList(
          qualIdent, userIdent, lo, hi, maxNum, offset, isAscending
        ).then(
          list => resolve(list)
        );
      }

      // And else, query an appropriate user group for their (aggregated)
      // score. Note that the length of the result is not equal to maxNum,
      // which is what we want; maxNum is the max number of *fetched* entries
      // (at least for each individual list that is queried in the process).
      else {
        this.fetchUserGroup(qualIdent, options).then(userGroupIdent => {
          this.aggregator.fetchList(
            userGroupIdent, qualIdent, options
          ).then(
            list => filterScoredListWRTWeight(list, minWeight));
        });
      }
    });
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
