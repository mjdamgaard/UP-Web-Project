
import {
  fetchUserScore, fetchUserScoreList, postUserScore, deleteUserScore
} from "../scores.js";
import {filterScoredListWRTWeight} from 'scored_lists';
import {map} from 'array';
import {getSequentialPromise} from 'promise';




export class SimpleScoreHandler {
  
  constructor(
    aggregator, fetchUserGroup, fetchUserGroupsForUpdate, moderatorGroupKey,
    desc
  ) {
    this.aggregator = aggregator;
    this.fetchUserGroup = fetchUserGroup;
    this.fetchUserGroupsForUpdate = fetchUserGroupsForUpdate;
    this.moderatorGroupKey = moderatorGroupKey;
    this["Description"] = desc;
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

  // Here we introduce a custom option, 'moderate', which when set for
  // fetchTopEntry() will also query the moderator group for the same quality,
  // and take the top entry of the original list that is also rated above a
  // certain threshold by the moderator group. And this threshold is given by
  // 'threshold' option on the form [minScore = 0, minWeight = 0].
  async fetchTopEntry(qualKey, options = {}) {
    let {moderate, threshold = []} = options;
    if (!moderate) {
      let list = await this.fetchList(qualKey, options) ?? [];
      let [topEntry] = list;
      return topEntry;
    } else {
      let [list = [], moderatedList = []] = await Promise.all([
        this.fetchList(qualKey, options),
        this.fetchList(qualKey, {userGroup: this.userGroupKey})
      ]);
      let [minScore = 0, minWeight = 0] = threshold;
      let len = list.length;
      for (let i = 0; i < len; i++) {
        let entry = list[i];
        let moderatorEntry = getMatchingEntry(entry, moderatedList);
        if (
          moderatorEntry &&
          moderatorEntry[1] > minScore && moderatorEntry[2] > minWeight
        ) {
          return entry;
        }
      }
    }
  }


  postScore(qualKey, subjKey, userKey, score, options = {}) {
    return new Promise(resolve => {
      postUserScore(qualKey, subjKey, userKey, score).then(() => {
        this.updateScoreForUser(qualKey, subjKey, userKey, options).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

  deleteScore(qualKey, subjKey, userKey, options = {}) {
    return new Promise(resolve => {
      deleteUserScore(qualKey, subjKey, userKey).then(() => {
        this.updateScoreForUser(qualKey, subjKey, userKey, options).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
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

  getSettingsMenu() {
    return <div>
      {"No settings menu implemented yet for the current score handler."}
    </div>;
  }

}


export function getMatchingEntry(entry, list) {
  let [id] = entry;
  let len = list.length;
  for (let i = 0; i < len; i++) {
    let otherEntry = list[i];
    if (otherEntry[0] === id) {
      return otherEntry;
    }
  }

}


export {SimpleScoreHandler as default};
