
import {DBRequestManager} from "../classes/DBRequestManager.js";

import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";

// const CLASS_CLASS_METADATA_JSON = JSON.stringify({
//   entID: 1,
//   tmplID: 0,
//   mainProps: {title: "class"},
//   classID: 1,
//   otherPropsLen: 0,
// });


const CLASSES_CLASS_ID = "4";
const RELATIONS_CLASS_ID = "7";
const USEFUL_RELATIONS_REL_ID = "19";
const RELEVANCY_QUAL_ID = "15";



export class DataFetcher {


  static fetchPublicSmallEntity(entID, callback) {
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "ent",
      id: entID,
      m: 65535,
      s: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let [datatype, defStr, len, creatorID] = result[0] ?? [];
      let isContained = (len <= 65535); 
      callback(datatype, defStr, len, creatorID, isContained);
    });
  }


  static fetchSeveralEntities(entIDs, callback) {
    const results = Array(scaleKeys.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    entIDs.forEach((entID, ind) => {
      parallelCallbackHandler.push(() => {
        this.fetchPublicSmallEntity(
          entID, (datatype, defStr, len, creatorID, isContained) => {
            results[ind] = [datatype, defStr, len, creatorID, isContained];
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }






  static fetchEntityList(userID, scaleID, n, callback) {
    let reqData = {
      req: "entList",
      u: userID,
      s: scaleID,
      n: n || 4000,
      o: 0,
      a: 0,
    };
    DBRequestManager.query(reqData, (entList) => {
      callback(entList, scaleID);
    });
  }

  static fetchEntityListFromDefStr(userID, scaleDefStr, n, callback) {
    let reqData = {
      req: "entListFromDefStr",
      u: userID,
      d: scaleDefStr,
      n: n || 4000,
      o: 0,
      a: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let scaleID = result[0][1];
      let entList = result.slice(1);
      callback(entList, scaleID);
    });
  }

  static fetchEntityListFromScaleKey(userID, scaleKey, n, callback) {
    if (typeof scaleKey === "number") {
      let scaleID = scaleKey;
      this.fetchEntityList(userID, scaleID, n, callback);
    }
    else {
      let scaleDefStr = getScaleDefStr(...scaleKey);
      this.fetchEntityListFromDefStr(userID, scaleDefStr, n, callback)
    }
  }


  static fetchSeveralEntityLists(userIDs, scaleKeys, n, callback) {
    if (typeof userIDs === "number") {
      let userID = userIDs;
      userIDs = scaleKeys.map(() => userID);
    }

    const entLists = Array(scaleKeys.length);
    const scaleIDs = Array(scaleKeys.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    scaleKeys.forEach((scaleKey, ind) => {
      parallelCallbackHandler.push(() => {
        this.fetchEntityListFromScaleKey(
          userIDs[ind], scaleKey, n, (entList, scaleID) => {
            entLists[ind] = entList;
            scaleIDs[ind] = scaleID;
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(entLists, scaleIDs);
    });
  }



};




export function getScaleDefStr(relID, objID, qualID) {
  return JSON.stringify({
    Class: "@" + RELATIONS_CLASS_ID,
    Relation: "@" + relID,
    Object: "@" + objID,
    Quality: "@" + (qualID || RELEVANCY_QUAL_ID),
  });
}