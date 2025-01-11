
import {DBRequestManager} from "./DBRequestManager.js";

import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";
import {DataFetcher, getScaleDefStr} from "./DataFetcher.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";


const WORKSPACES_CLASS_ID = basicEntIDs["workspaces"];

const STANDARD_EDITING_DAYS = 100; // TODO: Reduce before going beta.

const PATH_REF_REGEX = /@\[[^0-9\[\]@,;"][^\[\]@,;"]*\]/g;


export class DataInserter {

  constructor(getAccountData, workspaceEntID) {
    this.getAccountData = getAccountData;
    this.workspaceEntID = workspaceEntID;
    this.workspaceObj = {};
  }

  fetchWorkspaceObject(callback = () => {}) {
    DataFetcher.fetchJSONObjectAsUser(
      this.getAccountData, this.workspaceEntID, obj => {
      this.workspaceObj = (obj ?? {});
      callback(obj);
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
      def: JSON.stringify(this.workspaceObj),
      prv: 1,
      a: 0,
      days: 0,
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
      prv: 1,
      a: 0,
      days: 0,
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
    path, datatype, defStr,
    isAnonymous = 0, isPrivate = 0, isEditable = 1, callback = () => {}
  ) {
    let req =
      (datatype === "f") ? "funEnt" :
      (datatype === "c") ? "callEnt" :
      (datatype === "a") ? "attrEnt" :
      (datatype === "8") ? "utf8Ent" :
      (datatype === "h") ? "htmlEnt" :
      (datatype === "j") ? "jsonEnt" :
      "unrecognized datatype";
    let reqData = {
      req: req,
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      def: defStr,
      prv: isPrivate,
      a: isAnonymous,
      days: isEditable ? STANDARD_EDITING_DAYS : 0,
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
          c: isAnonymous ? 0 : this.getAccountData("userID"),
          prv: isAnonymous ? undefined : isPrivate,
          ed: isAnonymous ? undefined : isPrivate ? undefined : isEditable,
        };
      }
      callback(result.outID, result.exitCode);
    });
  }

  insertSubbedEntity(
    path, datatype, defStr, isAnonymous, isPrivate, isEditable, callback
  ) {
    defStr = this.getSubbedDefStr(defStr);
    this.insertEntity(
      path, datatype, defStr, isAnonymous, isPrivate, isEditable,
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

  insertOrSubstituteEntity(
    path, datatype, defStr,
    isAnonymous = 0, isPrivate = 0, isEditable = 1, callback = () => {}
  ) {
    // If an entID is not already recorded at path, simply insert a new entity.
    let entID = this.getEntIDFromPath(path);
    if (!entID) {
      this.insertEntity(
        path, datatype, defStr, isAnonymous, isPrivate, isEditable, callback
      );
      return;
    }
    // Else substitute the given entity, by first parsing all contained paths
    // in defStr, then looking the entID of them all, and then we make the
    // "subEnt" request for each found path-entID pair.
    let pathRefs = defStr.match(PATH_REF_REGEX);
    let substitutionEntIDs = pathRefs.map(pathRef => {
      let pathStr = pathRef.slice(2, -1);
      return this.getEntIDFromPath(pathStr);
    });
    let reqData = {
      req: "subEnt",
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      e: entID,
      p: pathRefs.join(","),
      s: substitutionEntIDs.join(","),
    };
    DBRequestManager.insert(reqData, (responseText) => {
      let result = JSON.parse(responseText);
      if (parseInt(result.exitCode) >= 2) {
        callback(result.outID, result.exitCode);
        return;
      }
      // Get or set the relevant node from path, then insert entID at this
      // potentially newly created node.
      let targetNode = this.#getOrSetNodeFromPath(path);
      targetNode[0] = {
        entID: result.outID.toString(),
        c: result.exitCode == "1" ? null :
          isAnonymous ? 0 : this.getAccountData("userID"),
        prv: isAnonymous ? undefined : isPrivate,
        ed: isAnonymous ? undefined : isPrivate ? undefined : isEditable,
      };
      callback(result.outID, result.exitCode);
    });
  }


  insertOrEditSubbedEntity(
    path, datatype, defStr, isAnonymous, isPrivate, isEditable, callback
  ) {
    defStr = this.getSubbedDefStr(defStr);
    this.insertOrSubstituteEntity(
      path, datatype, defStr, isAnonymous, isPrivate, isEditable, callback
    );
  }




  insertOrFindScale(scaleKey, callback) {
    scaleKey = scaleKey.map(val => {
      if (parseInt(val) > 0) {
        return val;
      }
      else {
        return this.getEntIDFromPath(val);
      }
    });
    if (!scaleKey.reduce((acc, val) => acc && val)) {
      return;
    }
    let scaleDefStr = getScaleDefStr(...scaleKey);
    this.insertEntity(
      "", "j", scaleDefStr,
      1, 0, 0, 1,
      (outID, exitCode) => callback(outID, exitCode)
    );
  }



  addEntitiesToListFromScaleID(
    scaleID, PathScorePairArr, callback = () => {}
  ) {
    let parallelCallbackHandler = new ParallelCallbackHandler;
    let results = [];

    PathScorePairArr.forEach((pathScorePair, ind) => {
      parallelCallbackHandler.push((resolve) => {
        let entPath = pathScorePair[0];
        let scoreVal = pathScorePair[1];
        let entID = this.getEntIDFromPath(entPath);
        if (!entID) {
          return;
        }
        let reqData = {
          req: "score",
          ses: this.getAccountData("sesIDHex"),
          u: this.getAccountData("userID"),
          s: scaleID,
          e: entID,
          v: scoreVal,
        };
        DBRequestManager.insert(reqData, (result) => {
          results[ind] = result;
          resolve();
        });
      });
    });

    parallelCallbackHandler.execAndThen(() => {
      callback(results);
    });
  }

  addEntitiesToListFromScalePath(scalePath, PathScorePairArr, callback) {
    let scaleID = this.getEntIDFromPath(scalePath);
    if (!scaleID) {
      return;
    }
    this.addEntitiesToListFromScaleID(scaleID, PathScorePairArr, callback);
  }


  addEntitiesToListFromScaleKey(scaleKey, PathScorePairArr, callback) {
    this.insertOrFindScale(scaleKey, (outID, exitCode) => {
      if (parseInt(exitCode) <= 1) {
        this.addEntitiesToListFromScaleID(outID, PathScorePairArr, callback);
      }
    });
  }



}
