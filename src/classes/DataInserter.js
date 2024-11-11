
import {DBRequestManager} from "./DBRequestManager.js";

import {DataFetcher} from "./DataFetcher.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";



export class DataInserter {

  constructor(getAccountData, workspaceEntID) {
    this.getAccountData = getAccountData;
    this.workspaceEntID = workspaceEntID;
    this.workspaceObj = null;
  }

  fetchWorkspaceObj(callback) {
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
      ses: getAccountData("sesIDHex"),
      u: getAccountData("userID"),
      e: this.workspaceEntID,
      t: "j",
      d: JSON.stringify(this.workspaceObj),
    };
    DBRequestManager.input(reqData, (result) => {
      callback(result);
    });
  }

  createWorkspace(workspaceObj, callback) {
    if (!callback) {
      callback = () => {};
    }
    if (!workspaceObj) {
      return;
    }
    let reqData = {
      req: "ent",
      ses: getAccountData("sesIDHex"),
      u: getAccountData("userID"),
      t: "j",
      d: JSON.stringify(workspaceObj),
      prv: 1,
    };
    DBRequestManager.input(reqData, (result) => {
      this.workspaceEntID = result.outID;
      this.workspaceObj = workspaceObj;
      callback(result.outID);
    });
  }


  addExistingEntToWorkspace(path, entID) {
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
      isOwnedByUser: 0,
    }
  }


  insertEnt(path, datatype, defStr, isAnonymous, isPrivate) {
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
      isAnonymous: isAnonymous,
      isPrivate: isAnonymous ? undefined : isPrivate,
      isOwnedByUser: !isAnonymous,
    }
  }


}

