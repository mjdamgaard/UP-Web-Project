
import {DBRequestManager} from "./DBRequestManager.js";

import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";
import {DefStrConstructor} from "./DefStrConstructor.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";


const PATH_REF_REGEX = /@\[[^0-9\[\]@,;"][^\[\]@,;"]+\]/g;
const PATH_REGEX = /^[^0-9\[\]@,;"][^\[\]@,;"]*$/;



export class DataInserter {

  constructor(getAccountData, workspaceEntID) {
    this.getAccountData = getAccountData;
    this.workspaceEntID = workspaceEntID;
    this.workspaceObj = {};
  }

  fetchWorkspaceObject(callback = () => {}) {
    let reqData = {
      req: "ent",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      e: this.workspaceEntID,
      m: 0,
      s: 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      let [[[datatype, defStr, len, creatorID, editableUntil]]] = result;
      this.workspaceObj = JSON.parse(defStr);
      callback(datatype, defStr, len, creatorID, editableUntil);
    });
  }

  updateWorkspace(callback) {
    if (!callback) {
      callback = () => {};
    }
    if (!this.workspaceObj) {
      return;
    }
    let reqData = {
      req: "editJSONEnt",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      e: this.workspaceEntID,
      d: JSON.stringify(this.workspaceObj),
      w: this.getAccountData("userID"),
      a: 0,
      ed: 1,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      callback(result.outID, result.exitCode);
    });
  }

  createWorkspace(callback) {
    if (!callback) {
      callback = () => {};
    }
    let reqData = {
      req: "jsonEnt",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      def: JSON.stringify(this.workspaceObj),
      w: this.getAccountData("userID"),
      a: 0,
      ed: 1,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      this.workspaceEntID = result.outID.toString();
      callback(result.outID, result.exitCode);
    });
  }


  addExistingEntityToWorkspace(path, entID) {
    // Get or set the relevant node from path, then insert entID at this
    // potentially newly created node.
    let targetNode = this.#getOrSetNodeFromPath(path);
    targetNode[0] = {
      entID: entID.toString(),
      c: null, // 'c' for 'children.'
    }
  }

  #getOrSetNodeFromPath(path) {
    if (!PATH_REGEX.test(path)) {
      return null;
    }
    let pathParts = path.split("/");
    var wsObj = this.workspaceObj;
    var targetNode;
    // First create all required nodes in the workspace, and finish by having
    // targetNode be the last node where entID is supposed to be inserted. 
    pathParts.forEach(pathPart => {
      if (!wsObj[pathPart]) {
        wsObj[pathPart] = [null, {}];
      }
      targetNode = wsObj[pathPart];
      wsObj = wsObj[pathPart][1];
    });
    return targetNode;
  }

  #getNodeFromPath(path) {
    let pathParts = path.split("/");
    var wsObj = this.workspaceObj;
    var targetNode;
    // Find the node pointed to by path, or return the match unchanged if
    // this does not exist.
    pathParts.forEach(pathPart => {
      if (!wsObj[pathPart]) {
        targetNode = null;
        return;
      }
      targetNode = wsObj[pathPart];
      wsObj = wsObj[pathPart][1];
    });
    return targetNode;
  }

  getEntIDFromPath(path) {
    let targetNode = this.#getNodeFromPath(path);
    if (!targetNode || !targetNode[0]) {
      return;
    }
    else {
      return targetNode[0].entID;
    }
  }



  insertEntity(
    path, entType, defStr,
    isAnonymous = 0, readerWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    if (readerWhiteListID === true) {
      readerWhiteListID = this.getAccountData("userID")
    }
    let req =
      (entType === "f") ? "funEnt" :
      (entType === "r") ? "regEnt" :
      (entType === "8") ? "utf8Ent" :
      (entType === "h") ? "htmlEnt" :
      (entType === "j") ? "jsonEnt" :
      "unrecognized entity type";
    if (entType === "f" || entType === "r") {
      isEditable = undefined;
    }
    let reqData = {
      req: req,
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      d: defStr,
      w: readerWhiteListID,
      a: isAnonymous,
      ed: isEditable,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      if (parseInt(result.exitCode) >= 2) {
        callback(result.outID, result.exitCode);
        return;
      }
      // If path is provided, get or set the relevant node from path, then
      // insert entID at this potentially newly created node.
      if (path) {
        let targetNode = this.#getOrSetNodeFromPath(path);
        targetNode[0] = {
          entID: result.outID.toString(),
          c: result.exitCode == "1" ? null : isAnonymous ? 0 :
            this.getAccountData("userID"),
          w: readerWhiteListID ? readerWhiteListID : undefined,
          ed: isAnonymous ? undefined : readerWhiteListID ? undefined :
            isEditable,
        };
      }
      callback(result.outID, result.exitCode);
    });
  }

  insertSubbedEntity(
    path, entType, defStr, isAnonymous, readerWhiteListID, isEditable, callback
  ) {
    defStr = this.getSubbedDefStr(defStr);
    this.insertEntity(
      path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
      callback
    );
  }

  editEntity(
    path, entType, defStr,
    isAnonymous = 0, readerWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    if (readerWhiteListID === true) {
      readerWhiteListID = this.getAccountData("userID")
    }
    let entID = this.getEntIDFromPath(path);
    if (!entID) {
      debugger;throw (
        "editEntity(): entID was not found."
      );
    }

    if (entType === "r" || entType === "f") {
      debugger;throw (
        "editEntity(): 'r' and 'f' entities cannot be edited, only substituted."
      );
    }
    let req =
      (entType === "8") ? "editUTF8Ent" :
      (entType === "h") ? "editHTMLEnt" :
      (entType === "j") ? "editJSONEnt" :
      "unrecognized entity type";
    let reqData = {
      req: req,
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      e: entID,
      d: defStr,
      w: readerWhiteListID,
      a: isAnonymous,
      ed: isEditable,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      if (parseInt(result.exitCode) >= 1) {
        callback(result.outID, result.exitCode);
        return;
      }
      // If path is provided, get or set the relevant node from path, then
      // insert entID at this potentially newly created node.
      if (path) {
        let targetNode = this.#getOrSetNodeFromPath(path);
        targetNode[0] = {
          entID: result.outID.toString(),
          c: isAnonymous ? 0 : this.getAccountData("userID"),
          w: readerWhiteListID ? readerWhiteListID : undefined,
          ed: isAnonymous ? undefined : readerWhiteListID ? undefined :
            isEditable,
        };
      }
      callback(result.outID, result.exitCode);
    });
  }

  editSubbedEntity(
    path, entType, defStr, isAnonymous, readerWhiteListID, isEditable, callback
  ) {
    defStr = this.getSubbedDefStr(defStr);
    this.editEntity(
      path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
      callback
    );
  }


  getSubbedDefStr(str) {
    return str.replaceAll(PATH_REF_REGEX, match => {
      // Find the entID pointed to by path, or return the match unchanged if
      // this does not exist.
      let path = match.slice(2, -1);
      let entID = this.getEntIDFromPath(path);
      return entID ? ('@[' + entID + ']') : match;
    });
  }



  insertOrEditEntity(
    path, entType, defStr,
    isAnonymous = 0, readerWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    // If an entID is not already recorded at path, simply insert a new entity.
    let entID = this.getEntIDFromPath(path);
    if (!entID) {
      this.insertSubbedEntity(
        path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
        callback
      );
    }
    else {
      this.editSubbedEntity(
        path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
        callback
      );
    }
  }

  insertOrSubstituteEntity(
    path, entType, defStr,
    isAnonymous = 0, readerWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    // If an entID is not already recorded at path, simply insert a new entity.
    let entID = this.getEntIDFromPath(path);
    if (!entID) {
      this.insertSubbedEntity(
        path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
        callback
      );
      return;
    }
    // Else substitute the given entity, by first parsing all contained paths
    // in defStr, then looking the entID of them all, and then we make the
    // "subEnt" request for each found path-entID pair.
    let pathRefs = defStr.match(PATH_REF_REGEX) ?? [];
    let paths = pathRefs.map(pathRef => pathRef.slice(2, -1));
    let substitutionEntIDs = paths.map(
      pathStr => this.getEntIDFromPath(pathStr)
    );
    let reqData = {
      req: "subEnt",
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      e: entID,
      p: paths.join(","),
      s: substitutionEntIDs.join(","),
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      callback(result.outID, result.exitCode);
    });
  }


  insertSubstituteOrEditEntity(
    path, entType, defStr, isAnonymous, readerWhiteListID, isEditable, callback
  ) {
    if (entType === "r" || entType === "f") {
      this.insertOrSubstituteEntity(
        path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
        callback
      );
    } else {
      this.insertOrEditEntity(
        path, entType, defStr, isAnonymous, readerWhiteListID, isEditable,
        callback
      );
    }
  }









  scoreEntity(
    entID, listDefStr, readerWhiteListID, score1, score2 = 0, otherDataHex = "",
    callback = () => {}
  ) {
    let reqData = {
      req: "score",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      d: listDefStr,
      w: readerWhiteListID,
      s: entID,
      s1: score1,
      s2: score2,
      odh: otherDataHex,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      callback(result.outID, result.exitCode);
    });
  }





  scoreEntityWRTQuality(
    entID, qualIDOrDefStr, scoreMid, scoreRadius, callback = () => {}
  ) {
    let userID = this.getAccountData("userID");
    let listDefStr = DefStrConstructor.getUserScoreListExplodedDefStr(
      userID, qualIDOrDefStr
    );
    this.scoreEntity(
      entID, listDefStr, 0, scoreMid, scoreRadius, "", (listID, exitCode) => {
        if (exitCode <= 1) {
          // We store the ID of the user score list at "@userScoreListIDs"
          // (which is an illegal entity path) in the workspaceObj if it is
          // not already there.
          let userScoreListIDs = this.workspaceObj["@userScoreListIDs"];
          if (!userScoreListIDs) {
            userScoreListIDs = (this.workspaceObj["@userScoreListIDs"] = []);
          }
          if (!userScoreListIDs.includes(listID)) {
            userScoreListIDs.push(listID);
            this.updateWorkspace();
          }
        }
        callback(listID, exitCode);
      }
    );
  }

  scoreEntityWRTRelevancyQuality(
    entID, classIDOrDefStr, scoreMid, scoreRadius, callback = () => {}
  ) {
    let qualDefStr = DefStrConstructor.getRelevancyQualityExplodedDefStr(
      classIDOrDefStr
    );
    this.scoreEntityWRTQuality(
      entID, qualDefStr, scoreMid, scoreRadius, callback
    );
  }

  scoreEntityWRTRelationalClassRelevancyQuality(
    entID, objID, relID, scoreMid, scoreRadius, callback = () => {}
  ) {
    let classDefStr = DefStrConstructor.getRelationalClassExplodedDefStr(
      objID, relID
    );
    this.scoreEntityWRTRelevancyQuality(
      entID, classDefStr, scoreMid, scoreRadius, callback
    );
  }





  scoreWorkspaceEntitiesWRTQuality(
    qualPath, PathScoreMidAndRadiusTriples, callback = () => {}
  ) {
    let parallelCallbackHandler = new ParallelCallbackHandler;
    let results = [];

    let qualID = this.getEntIDFromPath(qualPath);
    if (!qualID) {
      callback(null, null);
      return;
    }

    PathScoreMidAndRadiusTriples.forEach((triple, ind) => {
      parallelCallbackHandler.push((resolve) => {
        let subjPath = triple[0];
        let scoreMid = triple[1];
        let scoreRad = triple[2] ?? 0;
        let subjID = this.getEntIDFromPath(subjPath);
        if (!subjID) {
          results[ind] = [null, null];
          resolve();
          return;
        }
        this.scoreEntityWRTQuality(
          subjID, qualID, scoreMid, scoreRad, (outID, exitCode) => {
            results[ind] = [outID, exitCode];
            resolve();
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  scoreWorkspaceEntitiesWRTRelevancyQuality(
    classPath, PathScoreMidAndRadiusTriples, callback = () => {}
  ) {
    let parallelCallbackHandler = new ParallelCallbackHandler;
    let results = [];

    let classID = this.getEntIDFromPath(classPath);
    if (!classID) {
      callback(null, null);
      return;
    }

    PathScoreMidAndRadiusTriples.forEach((triple, ind) => {
      parallelCallbackHandler.push((resolve) => {
        let subjPath = triple[0];
        let scoreMid = triple[1];
        let scoreRad = triple[2] ?? 0;
        let subjID = this.getEntIDFromPath(subjPath);
        if (!subjID) {
          results[ind] = [null, null];
          resolve();
          return;
        }
        this.scoreEntityWRTRelevancyQuality(
          subjID, classID, scoreMid, scoreRad, (outID, exitCode) => {
            results[ind] = [outID, exitCode];
            resolve();
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  scoreWorkspaceEntitiesWRTRelationalClassRelevancyQuality(
    objPath, relPath, PathScoreMidAndRadiusTriples, callback = () => {}
  ) {
    let parallelCallbackHandler = new ParallelCallbackHandler;
    let results = [];

    let objID = this.getEntIDFromPath(objPath);
    let relID = this.getEntIDFromPath(relPath);
    if (!objID || !relID) {
      callback(null, null);
      return;
    }

    PathScoreMidAndRadiusTriples.forEach((triple, ind) => {
      parallelCallbackHandler.push((resolve) => {
        let subjPath = triple[0];
        let scoreMid = triple[1];
        let scoreRad = triple[2] ?? 0;
        let subjID = this.getEntIDFromPath(subjPath);
        if (!subjID) {
          results[ind] = [null, null];
          resolve();
          return;
        }
        this.scoreEntityWRTRelationalClassRelevancyQuality(
          subjID, objID, relID, scoreMid, scoreRad, (outID, exitCode) => {
            results[ind] = [outID, exitCode];
            resolve();
          }
        );
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }






}
