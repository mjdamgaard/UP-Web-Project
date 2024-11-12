
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
    });
    callback(obj)
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
      h: 0,
    };
    DBRequestManager.input(reqData, (result) => {
      this.workspaceEntID = result.outID;
      callback(result.outID, result.exitCode);
    });
  }


  addExistingEntityToWorkspace(path, entID) {
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
    // Finally insert entID at this potentially newly created node.
    targetNode[0] = {
      entID: entID.toString(),
      c: null,
    }
  }


  insertEntity(
    path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
    callback
  ) {
    let reqData = {
      req: "ent",
      ses: this.getAccountData("sesIDHex"),
      u: isAnonymous ? 0 : this.getAccountData("userID"),
      t: datatype,
      d: defStr,
      prv: isPrivate,
      ed: isEditable,
      h: insertHash,
    };
    DBRequestManager.input(reqData, (result) => {
      if (result.exitCode >= 2) {
        callback(result.outID, result.exitCode)
        return;
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
      // Finally insert entID at this potentially newly created node.
      targetNode[0] = {
        entID: result.outID.toString(),
        c: isAnonymous ? 0 : this.getAccountData("userID"),
        prv: isAnonymous ? undefined : isPrivate,
        ed: isAnonymous ? undefined : isPrivate ? undefined : isEditable,
      }
      callback(result.outID, result.exitCode)
    });

  }

  insertParsedEntity(
    path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
    callback
  ) {
    let defStr = this.parseDefStr(defStr);
    this.insertEntity(
      path, datatype, defStr, isAnonymous, isPrivate, isEditable, insertHash,
      callback
    );
  }


  parseDefStr(str) {
    
  }
}

