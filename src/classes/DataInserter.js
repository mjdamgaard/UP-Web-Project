
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

  updateWorkspaceObj(callback) {
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

  
}

