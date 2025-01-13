
import {DBRequestManager} from "./DBRequestManager.js";

import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";
import {DataFetcher, getScaleDefStr} from "./DataFetcher.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";


const WORKSPACES_CLASS_ID = basicEntIDs["workspaces"];
const RELEVANCY_QUAL_FORMAT_ID = basicEntIDs["relevancy qualities/format"];

const PATH_REF_REGEX = /@\[[^0-9\[\]@,;"][^\[\]@,;"]*\]/g;


export class DataInserter {

  constructor(getAccountData, workspaceEntID) {
    this.getAccountData = getAccountData;
    this.workspaceEntID = workspaceEntID;
    this.workspaceObj = {};
  }

  fetchWorkspaceObject(callback = () => {}) {
    // DataFetcher.fetchJSONObjectAsUser(
    //   this.getAccountData, this.workspaceEntID, obj => {
    //   this.workspaceObj = (obj ?? {});
    //   callback(obj);
    // });
    let reqData = {
      req: "entAsUser",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      id: this.workspaceEntID,
      m: 0,
      s: 0,
    };
    DBRequestManager.query(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      let [datatype, defStr, len, creatorID, editableUntil] = result[0] ?? [];
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
    isAnonymous = 0, userWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    if (userWhiteListID === true) {
      userWhiteListID = this.getAccountData("userID")
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
      w: userWhiteListID,
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
          w: userWhiteListID ? userWhiteListID : undefined,
          ed: isAnonymous ? undefined : userWhiteListID ? undefined :
            isEditable,
        };
      }
      callback(result.outID, result.exitCode);
    });
  }

  insertSubbedEntity(
    path, entType, defStr, isAnonymous, userWhiteListID, isEditable, callback
  ) {
    defStr = this.getSubbedDefStr(defStr);
    this.insertEntity(
      path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
      callback
    );
  }

  editEntity(
    path, entType, defStr,
    isAnonymous = 0, userWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    if (userWhiteListID === true) {
      userWhiteListID = this.getAccountData("userID")
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
      w: userWhiteListID,
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
          w: userWhiteListID ? userWhiteListID : undefined,
          ed: isAnonymous ? undefined : userWhiteListID ? undefined :
            isEditable,
        };
      }
      callback(result.outID, result.exitCode);
    });
  }

  editSubbedEntity(
    path, entType, defStr, isAnonymous, userWhiteListID, isEditable, callback
  ) {
    defStr = this.getSubbedDefStr(defStr);
    this.editEntity(
      path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
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
    isAnonymous = 0, userWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    // If an entID is not already recorded at path, simply insert a new entity.
    let entID = this.getEntIDFromPath(path);
    if (!entID) {
      this.insertSubbedEntity(
        path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
        callback
      );
    }
    else {
      this.editSubbedEntity(
        path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
        callback
      );
    }
  }

  insertOrSubstituteEntity(
    path, entType, defStr,
    isAnonymous = 0, userWhiteListID = 0, isEditable = 1,
    callback = () => {}
  ) {
    // If an entID is not already recorded at path, simply insert a new entity.
    let entID = this.getEntIDFromPath(path);
    if (!entID) {
      this.insertSubbedEntity(
        path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
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
    path, entType, defStr, isAnonymous, userWhiteListID, isEditable, callback
  ) {
    if (entType === "r" || entType === "f") {
      this.insertOrSubstituteEntity(
        path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
        callback
      );
    } else {
      this.insertOrEditEntity(
        path, entType, defStr, isAnonymous, userWhiteListID, isEditable,
        callback
      );
    }
  }



  insertOrSubstituteRelevancyQualityEntity(
    path, objPath, relPath, isAnonymous, userWhiteListID, callback
  ) {
    let objID = this.getEntIDFromPath(objPath);
    let relID = this.getEntIDFromPath(relPath);
    if (!objID || !relID) {
      callback(null, null);
      return;
    }
    let defStr = `@[${RELEVANCY_QUAL_FORMAT_ID}],@[${objID}],@[${relID}]`
    this.insertOrSubstituteEntity(
      path, "r", defStr, isAnonymous, userWhiteListID, 0, callback
    );
  }








  scoreEntityPublicly(
    entID, qualID, scoreMid, scoreRad, truncateTimeBy = 9, // 2^9 s ~ 8.5 min.
    callback = () => {}
  ) {
    let reqData = {
      req: "score",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      q: qualID,
      s: entID,
      m: scoreMid,
      r: scoreRad,
      t: truncateTimeBy,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      callback(result.outID, result.exitCode);
    });
  }



  scoreWorkspaceEntitiesPublicly(
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
        this.scoreEntityPublicly(
          subjID, qualID, scoreMid, scoreRad, undefined,
          (outID, exitCode) => {
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




  scoreEntityPrivately(
    entID, listType = "\0", userWhiteListID, listID, scoreVal,
    onIndexData, offIndexData, addedUploadDataCost, callback = () => {}
  ) {
    let reqData = {
      req: "prvScore",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      t: listType,
      w: userWhiteListID,
      l: listID,
      s: entID,
      v: scoreVal,
      d1: onIndexData,
      d2: offIndexData,
      uc: addedUploadDataCost,
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      callback(result.outID, result.exitCode);
    });
  }


  scoreWorkspaceEntitiesPrivately(
    listType = "\0", userWhiteListPath, listPath,
    PathScoreValAndOnOffIndexDataQuartets, addedUploadDataCostPerEntity,
    callback = () => {}
  ) {
    let parallelCallbackHandler = new ParallelCallbackHandler;
    let results = [];

    let userWhiteListID = this.getEntIDFromPath(userWhiteListPath);
    let listID = this.getEntIDFromPath(listPath);
    if (!userWhiteListID || !listID) {
      callback(null, null);
      return;
    }

    PathScoreValAndOnOffIndexDataQuartets.forEach((quartet, ind) => {
      parallelCallbackHandler.push((resolve) => {
        let subjPath = quartet[0];
        let scoreVal = quartet[1];
        let onIndexData = quartet[2] ?? null;
        let offIndexData = quartet[3] ?? null;
        let subjID = this.getEntIDFromPath(subjPath);
        if (!subjID) {
          results[ind] = [null, null];
          resolve();
          return;
        }
        this.scoreEntityPrivately(
          subjID, listType, userWhiteListID, listID, scoreVal,
          onIndexData, offIndexData, addedUploadDataCostPerEntity,
          (outID, exitCode) => {
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
