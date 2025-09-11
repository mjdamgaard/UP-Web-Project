
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


  fetchScoreData(qualKey, subjKey, options = {}) {
    return new Promise(resolve => {
      let {user: userKey, queryUser} = options;

      // If the queryUser option is true, query and resolve with the user's
      // own score (and an undefined weight) 
      if (queryUser) {
        fetchUserScore(qualKey, subjKey, userKey).then(userScore => {
          resolve([userScore]);
        });
      }

      // And else, query an appropriate user group for their (aggregated) score.
      else {
        this.fetchUserGroup(qualKey, options).then(userGroupKey => {
          this.aggregator.fetchScoreData(
            userGroupKey, qualKey, subjKey, options
          ).then(
            scoreData => resolve(scoreData)
          );
        });
      }
    });
  }



  fetchList(qualKey, options = {}) {
    return new Promise(resolve => {
      let {
        user: userKey, queryUser, minWeight = 10,
        lo, hi, maxNum, offset, isAscending
      } = options;

      // If the queryUser option is true, query and resolve with the user's
      // own score (and an undefined weight) 
      if (queryUser) {
        fetchUserScoreList(
          qualKey, userKey, lo, hi, maxNum, offset, isAscending
        ).then(
          list => resolve(list)
        );
      }

      // And else, query an appropriate user group for their (aggregated)
      // score. Note that the length of the result is not equal to maxNum,
      // which is what we want; maxNum is the max number of *fetched* entries
      // (at least for each individual list that is queried in the process).
      else {
        this.fetchUserGroup(qualKey, options).then(userGroupKey => {
          this.aggregator.fetchList(
            userGroupKey, qualKey, options
          ).then(
            list => filterScoredListWRTWeight(list, minWeight));
        });
      }
    });
  }



  updateScoreForUser(qualKey, subjKey, userID, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualKey, options).then(userGroupKey => {
        this.aggregator.updateScoreForUser(
          userGroupKey, qualKey, subjKey, userID, options
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  updateScoreForGroup(qualKey, subjKey, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualKey, options).then(userGroupKey => {
        this.aggregator.updateScoreForGroup(
          userGroupKey, qualKey, subjKey, options
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  updateList(qualKey, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualKey, options).then(userGroupKey => {
        this.aggregator.updateList(
          userGroupKey, qualKey, options
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  fetchDefaultOptions(qualKey) {
    return new Promise(resolve => {
      this.fetchUserGroup(qualKey).then(userGroupKey => {
        resolve({userGroup: userGroupKey});
      });
    });
  }

}


export {SimpleScoreHandler as default};
