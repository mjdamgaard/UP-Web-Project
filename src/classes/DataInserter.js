
import {DBRequestManager} from "./DBRequestManager.js";

import {DataFetcher} from "./DataFetcher.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";



export class DataInserter {

  constructor(getAccountData, workspaceEntID) {
    this.getAccountData = getAccountData;
    this.workspaceEntID = workspaceEntID;
    this.workspaceObj = {};
  }

  fetchWorkspaceObject(callback) {
    DataFetcher.fetchObject(this.workspaceEntID, obj => {
      this.workspaceObj = obj;
      callback(obj)
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
      req: "editEnt",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      e: this.workspaceEntID,
      t: "j",
      d: JSON.stringify(this.workspaceObj),
      prv: 1,
      ed: 1,
      a: 0,
      h: 0,
    };
    DBRequestManager.input(reqData, (result) => {
      callback(result.outID, result.exitCode);
    });
  }

  createWorkspace(callback) {
    if (!callback) {
      callback = () => {};
    }
    let reqData = {
      req: "ent",
      ses: this.getAccountData("sesIDHex"),
      u: this.getAccountData("userID"),
      t: "j",
      d: JSON.stringify(this.workspaceObj),
      prv: 1,
      ed: 1,
      a: 0,
      h: 0,
    };
    DBRequestManager.input(reqData, (result) => {
      this.workspaceEntID = result.outID;
      callback(result.outID, result.exitCode);
    });
  }


  addExistingEntityToWorkspace(path, entID) {
    // Get or set the relevant node from path, then insert entID at this
    // potentially newly created node.
    let targetNode = this.#getOrSetNodeFromPath(path);
    targetNode[0] = {
      entID: entID.toString(),
      c: null,
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
        return null;
      }
      targetNode = wsObj[pathPart];
      wsObj = wsObj[pathPart][1];
    });
    return targetNode;
  }




  insertEntity(
    path, datatype, defStr,
    isAnonymous = 0, isPrivate = 0, isEditable = 1, insertHash = 0,
    callback = () => {}
  ) {
    let reqData = {
      req: "ent",
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      t: datatype,
      d: defStr,
      prv: isPrivate,
      ed: isEditable,
      a: isAnonymous,
      h: insertHash,
    };
    DBRequestManager.input(reqData, (result) => {
      if (result.exitCode >= 2) {
        callback(result.outID, result.exitCode);
        return;
      }
      // Get or set the relevant node from path, then insert entID at this
      // potentially newly created node.
      let targetNode = this.#getOrSetNodeFromPath(path);
      targetNode[0] = {
        entID: result.outID.toString(),
        c: isAnonymous ? 0 : this.getAccountData("userID"),
        prv: isAnonymous ? undefined : isPrivate,
        ed: isAnonymous ? undefined : isPrivate ? undefined : isEditable,
      };
      callback(result.outID, result.exitCode);
    });
  }

  insertParsedEntity(
    path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
    callback
  ) {
    defStr = this.parseDefStr(defStr);
    this.insertEntity(
      path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
      callback
    );
  }


  parseDefStr(str) {
    return str.replaceAll(/@\[[^\]\]]*\]/g, match => {
      let path = match.slice(2, -1);
      // Find the node pointed to by path, or return the match unchanged if
      // this does not exist.
      let targetNode = this.#getNodeFromPath(path);
      if (!targetNode) {
        return match;
      }
      // If the node has a recorded (not falsy) entID, return the corresponding
      // entity reference, or else return the match unchanged.
      let entData = targetNode[0];
      if (entData && entData.entID) {
        return "@" + entData.entID;
      }
      else {
        return match;
      }
    });
  }

  insertOrEditEntity(
    path, datatype, defStr,
    isAnonymous = 0, isPrivate = 0, isEditable = 1, insertHash = 0,
    callback = () => {}
  ) {
    // If an entID is not already recorded at path, simply insert a new entity.
    let targetNode = this.#getNodeFromPath(path);
    if (!targetNode || !targetNode[0].entID) {
      this.insertParsedEntity(
        path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
        callback
      );
      return;
    }
    // Else edit the given entity.
    let entID = targetNode[0].entID;
    let reqData = {
      req: "editEnt",
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      e: entID,
      t: datatype,
      d: defStr,
      prv: isPrivate,
      ed: isEditable,
      a: isAnonymous,
      h: insertHash,
    };
    DBRequestManager.input(reqData, (result) => {
      if (result.exitCode >= 2) {
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


  insertOrEditParsedEntity(
    path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
    callback
  ) {
    defStr = this.parseDefStr(defStr);
    this.insertOrEditEntity(
      path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
      callback
    );
  }
}
