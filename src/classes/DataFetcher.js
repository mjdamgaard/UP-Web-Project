
import {DBRequestManager} from "../classes/DBRequestManager.js";

import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";

// const CLASS_CLASS_METADATA_JSON = JSON.stringify({
//   entID: 1,
//   tmplID: 0,
//   mainProps: {title: "class"},
//   classID: 1,
//   otherPropsLen: 0,
// });


const CLASSES_CLASS_ID = basicEntIDs["classes"];
const RELATIONS_CLASS_ID = basicEntIDs["relations"];
const SCALES_CLASS_ID = basicEntIDs["scales"];
const RELATIONS_REL_ID = basicEntIDs["relations/relations"];
const RELEVANT_QUAL_ID = basicEntIDs["qualities/relevant"];



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
      let [datatype, defStr, len, creatorID, isEditable] = result[0] ?? [];
      let isContained = (len <= 65535); 
      callback(datatype, defStr, isContained, len, creatorID, isEditable);
    });
  }


  static fetchSeveralPublicEntities(entIDs, callback) {
    const results = Array(entIDs.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    entIDs.forEach((entID, ind) => {
      parallelCallbackHandler.push(() => {
        this.fetchPublicSmallEntity(entID,
          (datatype, defStr, isContained, len, creatorID, isEditable) => {
            results[ind] = [
              datatype, defStr, isContained, len, creatorID, isEditable
            ];
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  static fetchPublicObject(entID, callback) {
    DataFetcher.fetchPublicSmallEntity(entID,
      (datatype, defStr, isContained, len, creatorID, isEditable) => {
        if (datatype !== "j" || !isContained) {
          callback(null);
          return;
        }
        var obj;
        try {
          obj = JSON.parse(defStr);
        } catch (error) {
          callback(null);
          return;
        }
        callback(obj);
      }
    );
  }


  static fetchSmallEntity(getAccountData, entID, callback) {
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "entAsUser",
      ses: getAccountData("sesIDHex"),
      u: getAccountData("userID"),
      id: entID,
      m: 65535,
      s: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let [datatype, defStr, len, creatorID, isEditable, isPrivate] =
        result[0] ?? [];
      let isContained = (len <= 65535); 
      callback(
        datatype, defStr, isContained, len, creatorID, isEditable, isPrivate
      );
    });
  }


  static fetchSeveralEntities(getAccountData, entIDs, callback) {
    const results = Array(entIDs.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    entIDs.forEach((entID, ind) => {
      parallelCallbackHandler.push(() => {
        this.fetchSmallEntity(getAccountData, entID, 
          (
            datatype, defStr, isContained, len, creatorID, isEditable,
            isPrivate
          ) => {
            results[ind] = [
              datatype, defStr, isContained, len, creatorID,
              isEditable, isPrivate
            ];
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  static fetchObject(getAccountData, entID, callback) {
    DataFetcher.fetchSmallEntity(getAccountData, entID,
      (datatype, defStr, isContained) => {
        if (datatype !== "j" || !isContained) {
          callback(null);
          return;
        }
        var obj = null;
        try {
          obj = JSON.parse(defStr);
        } catch (error) {
          callback(null);
          return;
        }
        callback(obj);
      }
    );
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
      callback(entList);
    });
  }

  static fetchEntityListFromHash(userID, scaleDefStrHash, n, callback) {
    let reqData = {
      req: "entListFromHash",
      u: userID,
      h: scaleDefStrHash,
      n: n || 4000,
      o: 0,
      a: 0,
    };
    DBRequestManager.query(reqData, (entList) => {
      callback(entList);
    });
  }

  static fetchEntityListFromScaleKey(userID, scaleKey, n, callback) {
    if (typeof scaleKey === "number") {
      let scaleID = scaleKey;
      this.fetchEntityList(userID, scaleID, n, callback);
    }
    else {
      scaleDefStrHashPromise(...scaleKey).then(hash => {
        this.fetchEntityListFromHash(userID, hash, n, callback);
      });
    }
  }


  static fetchSeveralEntityLists(userIDs, scaleKeys, n, callback) {
    if (typeof userIDs === "number") {
      let userID = userIDs;
      userIDs = scaleKeys.map(() => userID);
    }

    const entLists = Array(scaleKeys.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    scaleKeys.forEach((scaleKey, ind) => {
      parallelCallbackHandler.push(() => {
        this.fetchEntityListFromScaleKey(
          userIDs[ind], scaleKey, n, (entList) => {
            entLists[ind] = entList;
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(entLists);
    });
  }



}




export function getScaleDefStr(objID, relID, qualID) {
  return JSON.stringify({
    Class: "@" + SCALES_CLASS_ID,
    Object: "@" + objID,
    Relation: "@" + relID,
    Quality: "@" + (qualID || RELEVANT_QUAL_ID),
  });
}


export async function scaleDefStrHashPromise(objID, relID, qualID) {
  let scaleDefStr = getScaleDefStr(objID, relID, qualID);
  let hashHex = await hashPromise(scaleDefStr);
  return hashHex;
}


export async function hashPromise(string) {
  let data = new TextEncoder().encode(string);
  let hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  let hashArray = Array.from(new Uint8Array(hashBuffer));
  let hashHex = hashArray
    .map(val => val.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
