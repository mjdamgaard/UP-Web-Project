
import {DBRequestManager} from "../classes/DBRequestManager.js";

import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";
import {DataParser} from "./DataParser.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";



const CLASSES_CLASS_ID = basicEntIDs["classes"];
const RELATIONS_CLASS_ID = basicEntIDs["relations"];
const SCALES_CLASS_ID = basicEntIDs["scales"];
const RELATIONS_REL_ID = basicEntIDs["relations/relations"];
const RELEVANT_QUAL_ID = basicEntIDs["qualities/relevant"];



export class DataFetcher {

  constructor(getAccountData) {
    this.getAccountData = getAccountData;
  }

  static fetchEntity(entID, maxLen, callback) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 700;
    }
    maxLen ??= 700;
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "ent",
      u: "19",
      ses: "00".repeat(60),
      e: entID,
      m: maxLen,
      s: 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      // output: [[
      //  [entType, defStr, len, creatorID, isEditable, readerWhitelistID] |
      //  [null, exitCode]
      // ]].
      let [
        entType, defStrOrExitCode, len, creatorID, isEditable,
        readerWhitelistID
      ] = (result[0][0] ?? [])[0];
      callback(
        entType, defStrOrExitCode, len, creatorID, isEditable,
        readerWhitelistID
      );
    });
  }

  static fetchEntityRecursively(
    entID, recurseInstructions, maxRecLevel, maxLen, callback
  ) {
    if (!callback && maxLen instanceof Function) {
      callback = maxLen;
      maxLen = 700;
    }
    if (!callback && maxRecLevel instanceof Function) {
      callback = maxRecLevel;
      maxRecLevel = 2;
    }
    maxLen ??= 700;
    maxRecLevel ??= 2;
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "entRec",
      u: "19",
      ses: "00".repeat(60),
      e: entID,
      m: maxLen,
      i: recurseInstructions,
      l: maxRecLevel,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      // output: [[
      //  [entID, entType, defStr, len, creatorID, isEditable,
      //    readerWhitelistID
      //  ] |
      //  [entID, null, exitCode]
      // ], ...].
      callback(
        result.map(resArrArr => resArrArr[0] ?? [])
      );
    });
  }

  static fetchEntityID(
    entType, readerWhiteListID, defStr, callback
  ) {
    let reqData = {
      req: "entID",
      u: "19",
      ses: "00".repeat(60),
      t: entType,
      w: readerWhiteListID,
      d: defStr, // ("def_key" is always equal to def_str currently.)
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      // output: [[[entID | null]]].
      let [[[entID]]] = result;
      callback(entID);
    });
  }

  static fetchParsedRegularEntity(
    readerWhiteListID, explodedDefStr, callback
  ) {
    let reqData = {
      req: "regEnt",
      u: "19",
      ses: "00".repeat(60),
      w: readerWhiteListID,
      d: explodedDefStr,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      // output: [
      //   [[(tagName | null), outID, exitCode]], ...
      // ].
      callback(
        result.map(resArrArr => resArrArr[0] ?? [])
      );
    });
  }




  static fetchAndParseSmallEntity(entID, callback) {
    this.fetchEntity(
      entID, 700, (
        entType, defStrOrExitCode, len, creatorID, isEditable,
        readerWhitelistID
      ) => {
        if (!entType) {
          callback(null);
        } else {
          let defStr = defStrOrExitCode;
          callback(
            DataParser.parseEntity(
              entType, defStr, len, creatorID, isEditable, readerWhitelistID
            )
          );
        }
      }
    )
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
          (entType, defStr, isContained, len, creatorID, isEditable) => {
            results[ind] = [
              entType, defStr, isContained, len, creatorID, isEditable
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
      (entType, defStr) => {
        if (entType !== "a") {
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
      let [entType, defStr, len, creatorID, isEditable, isPrivate] =
        result[0] ?? [];
      let isContained = (len <= maxLen); 
      callback(
        entType, defStr, isContained, len, creatorID, isEditable,
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
            entType, defStr, isContained, len, creatorID, isEditable,
            isPrivate
          ) => {
            results[ind] = [
              entType, defStr, isContained, len, creatorID, isEditable,
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
      (entType, defStr) => {
        if (entType !== "a") {
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
      (entType, defStr, isContained) => {
        if (entType !== "j" || !isContained) {
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
