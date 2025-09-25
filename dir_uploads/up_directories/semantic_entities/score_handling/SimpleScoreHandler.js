
import {fetchUserScore, fetchUserScoreList} from "../scores.js";
import {filterScoredListWRTWeight} from 'scored_lists';
import {map} from 'array';
import {getSequentialPromise} from 'promise';




// A class to generate a list combined of several other scored lists. 
export class SimpleScoreHandler {
  
  constructor(aggregator, fetchUserGroup, fetchUserGroupsForUpdate, doc) {
    this.aggregator = aggregator;
    this.fetchUserGroup = fetchUserGroup;
    this.fetchUserGroupsForUpdate = fetchUserGroupsForUpdate;
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
            list => resolve(filterScoredListWRTWeight(list, minWeight)));
        });
      }
    });
  }


  fetchTopEntry(qualKey, options = {}) {
    return new Promise(resolve => {
      this.fetchList(qualKey, options).then(
        ([topEntry] = []) => resolve(topEntry)
      );
    });
  }



  updateScoreForUser(qualKey, subjKey, userKey, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroupsForUpdate(qualKey, options).then(userGroupKeyArr => {
        getSequentialPromise(map(userGroupKeyArr, userGroupKey => {
          return () => this.aggregator.updateScoreForUser(
            userGroupKey, qualKey, subjKey, userKey, options
          );
        })).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  updateScoreForGroup(qualKey, subjKey, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroupsForUpdate(qualKey, options).then(userGroupKeyArr => {
        getSequentialPromise(map(userGroupKeyArr, userGroupKey => {
          return () => this.aggregator.updateScoreForGroup(
            userGroupKey, qualKey, subjKey, options
          );
        })).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  updateList(qualKey, options = {}) {
    return new Promise(resolve => {
      this.fetchUserGroupsForUpdate(qualKey, options).then(userGroupKeyArr => {
        getSequentialPromise(map(userGroupKeyArr, userGroupKey => {
          return () => this.aggregator.updateList(
            userGroupKey, qualKey, options
          );
        })).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }



  fetchDefaultOptions(qualKey) {
    return new Promise(resolve => {
      Promise.all([
        this.fetchUserGroup(qualKey), this.fetchUserGroupsForUpdate(qualKey)
      ]).then(([userGroupKey, userGroupKeyArr]) => {
        resolve({
          userGroup: userGroupKey,
          userGroupsForUpdate: userGroupKeyArr,
        });
      });
    });
  }

}


export {SimpleScoreHandler as default};
