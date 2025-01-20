
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


  static fetchPublicEntity(entID, maxLen, callback) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 700;
    }
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "ent",
      u: "19",
      ses: "00".repeat(60),
      id: entID,
      m: maxLen,
      s: 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      let [datatype, defStr, len, creatorID, editableUntil] = result[0] ?? [];
      let isContained = (len <= maxLen); 
      callback(datatype, defStr, isContained, len, creatorID, editableUntil);
    });
  }


  static fetchSeveralPublicEntities(entIDs, maxLen, callback) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 700;
    }

    const results = Array(entIDs.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    entIDs.forEach((entID, ind) => {
      parallelCallbackHandler.push((resolve) => {
        this.fetchPublicEntity(entID, maxLen,
          (datatype, defStr, isContained, len, creatorID, editableUntil) => {
            results[ind] = [
              datatype, defStr, isContained, len, creatorID, editableUntil
            ];
            resolve();
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  static fetchPublicAttrObject(entID, callback) {
    DataFetcher.fetchPublicEntity(entID,
      (datatype, defStr) => {
        if (datatype !== "a") {
          callback(null);
          return;
        }
        callback(JSON.parse(defStr));
      }
    );
  }


  static fetchEntityAsUser(getProfileData, entID, maxLen, callback) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 700;
    }
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "entAsUser",
      ses: getProfileData("sesIDHex"),
      u: getProfileData("userID"),
      id: entID,
      m: maxLen,
      s: 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      let [datatype, defStr, len, creatorID, editableUntil, isPrivate] =
        result[0] ?? [];
      let isContained = (len <= maxLen); 
      callback(
        datatype, defStr, isContained, len, creatorID, editableUntil,
        isPrivate
      );
    });
  }


  static fetchSeveralEntitiesAsUser(
    getProfileData, entIDs, maxLen, callback
  ) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 700;
    }

    const results = Array(entIDs.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    entIDs.forEach((entID, ind) => {
      parallelCallbackHandler.push((resolve) => {
        this.fetchEntityAsUser(getProfileData, entID, maxLen,
          (
            datatype, defStr, isContained, len, creatorID, editableUntil,
            isPrivate
          ) => {
            results[ind] = [
              datatype, defStr, isContained, len, creatorID, editableUntil,
              isPrivate
            ];
            resolve();
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  static fetchAttrObjectAsUser(getProfileData, entID, callback) {
    DataFetcher.fetchEntityAsUser(getProfileData, entID,
      (datatype, defStr) => {
        if (datatype !== "a") {
          callback(null);
          return;
        }
        callback(JSON.parse(defStr));
      }
    );
  }


  static fetchJSONObjectAsUser(getProfileData, entID, maxLen, callback) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 65535;
    }

    DataFetcher.fetchEntityAsUser(getProfileData, entID, maxLen,
      (datatype, defStr, isContained) => {
        if (datatype !== "j" || !isContained) {
          callback(null);
          return;
        }
        callback(JSON.parse(defStr));
      }
    );
  }



  static fetchEntityList(userID, scaleID, n, lo, hi, o, a, callback) {
    if (callback === undefined) {
      (
        a  instanceof Function ? (callback = a ) && (a  = undefined) :
        o  instanceof Function ? (callback = o ) && (o  = undefined) :
        hi instanceof Function ? (callback = hi) && (hi = undefined) :
        lo instanceof Function ? (callback = lo) && (lo = undefined) :
        n  instanceof Function ? (callback = n ) && (n  = undefined) :
        (callback = () => {})
      );
    }
    let reqData = {
      req: "entList",
      u: userID,      
      s: scaleID,
      hi: hi ?? 3.402823466E+38,
      lo: lo ?? -3.402823466E+38,
      n: n || 4000,
      o: o ?? 0,
      a: a ?? 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let entList = JSON.parse(responseText);
      callback(entList);
    });
  }

  static fetchEntityListFromHash(
    userID, scaleDefStrHash, n, lo, hi, o, a, callback
  ) {
    if (callback === undefined) {
      (
        a  instanceof Function ? (callback = a ) && (a  = undefined) :
        o  instanceof Function ? (callback = o ) && (o  = undefined) :
        hi instanceof Function ? (callback = hi) && (hi = undefined) :
        lo instanceof Function ? (callback = lo) && (lo = undefined) :
        n  instanceof Function ? (callback = n ) && (n  = undefined) :
        (callback = () => {})
      );
    }
    let reqData = {
      req: "entListFromHash",
      u: userID,
      h: scaleDefStrHash,
      hi: hi ?? 3.402823466E+38,
      lo: lo ?? -3.402823466E+38,
      n: n || 4000,
      o: 0,
      a: 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let entList = JSON.parse(responseText);
      callback(entList);
    });
  }

  static fetchEntityListFromScaleKey(
    userID, scaleKey, n, lo, hi, o, a, callback
  ) {
    if (typeof scaleKey === "number") {
      let scaleID = scaleKey;
      this.fetchEntityList(userID, scaleID, n, lo, hi, o, a, callback);
    }
    else {
      scaleDefStrHashPromise(...scaleKey).then(hash => {
        this.fetchEntityListFromHash(userID, hash, n, lo, hi, o, a, callback);
      });
    }
  }


  static fetchSeveralEntityLists(
    userIDs, scaleKeys, n, lo, hi, o, a, callback
  ) {
    if (callback === undefined) {
      (
        a  instanceof Function ? (callback = a ) && (a  = undefined) :
        o  instanceof Function ? (callback = o ) && (o  = undefined) :
        hi instanceof Function ? (callback = hi) && (hi = undefined) :
        lo instanceof Function ? (callback = lo) && (lo = undefined) :
        n  instanceof Function ? (callback = n ) && (n  = undefined) :
        (callback = () => {})
      );
    }
    if (typeof userIDs !== "object") {
      let userID = userIDs;
      userIDs = Array(scaleKeys.length).fill(userID);
    }

    const entLists = Array(scaleKeys.length);

    const parallelCallbackHandler = new ParallelCallbackHandler;

    scaleKeys.forEach((scaleKey, ind) => {
      parallelCallbackHandler.push((resolve) => {
        this.fetchEntityListFromScaleKey(
          userIDs[ind], scaleKey, n, lo, hi, o, a, (entList) => {
            entLists[ind] = entList;
            resolve();
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
  let hashHex = await hashPromise("j." + scaleDefStr);
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
