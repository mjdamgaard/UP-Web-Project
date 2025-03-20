
import {MainDBConnector} from "./DBConnector";
import {InputValidator} from "../user_input/InputValidator";

const mainDBConnector = new MainDBConnector();


export class MainDBInterface {

  // static #validateAndQuery(sql, paramValArr, typeArr, paramNameArr) {
  //   InputValidator.validateParams(paramValArr, typeArr, paramNameArr);
  //   return mainDBConnector.connectAndQuery(sql, paramValArr);
  // }


  /* Entity selects */

  static fetchEntity(entID, maxLen = 0, startPos = 0) {
    let sql = `CALL selectEntity (?, ?, ?)`;
    let paramValArr = [entID, maxLen, startPos];
    // TODO: Possibly wrap in more destructuring:
    let [entType, defStr, creatorID, isEditable, whitelistID] =
      mainDBConnector.connectAndQuery(sql, paramValArr);
    return [entType, defStr, creatorID, isEditable, whitelistID];
  }

  static fetchFormalEntityID(defStr, editorID = "0", whitelistID = "0") {
    let sql = `CALL selectEntityIDFromSecKey ("f", ?, ?, ?)`;
    let paramValArr = [editorID, whitelistID, defStr];
    let [entID] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return entID;
  }


  /* Entity inserts */

  static insertScriptEntity(
    defStr, isAnonymous = 0, creatorID = "0", isEditable = 0, whitelistID = "0"
  ) {
    let sql = `CALL insertEntityWithoutSecKey ("s", ?, ?, ?, ?, ?)`;
    let paramValArr = [creatorID, defStr, whitelistID, isAnonymous, isEditable];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }


  static insertExpressionEntity(
    defStr, isAnonymous = 0, creatorID = "0", isEditable = 0, whitelistID = "0"
  ) {
    let sql = `CALL insertEntityWithoutSecKey ("e", ?, ?, ?, ?, ?)`;
    let paramValArr = [creatorID, defStr, whitelistID, isAnonymous, isEditable];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }

  static insertFormalEntity(
    defStr, isAnonymous = 0, creatorID = "0", isEditable = 0, whitelistID = "0"
  ) {
    let sql = `CALL insertEntityWithSecKey ("f", ?, ?, ?, ?, ?)`;
    let paramValArr = [creatorID, defStr, whitelistID, isAnonymous, isEditable];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }


  /* Entity edits */

  static editScriptEntity(
    entID, userID, defStr, isAnonymous = 0, isEditable = 1, whitelistID = "0",
  ) {
    let sql = `CALL editEntityWithoutSecKey ("s", ?, ?, ?, ?, ?, ?)`;
    let paramValArr = [
      userID, entID, defStr, whitelistID, isAnonymous, isEditable
    ];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }

  static editExpressionEntity(
    entID, userID, defStr, isAnonymous = 0, isEditable = 1, whitelistID = "0",
  ) {
    let sql = `CALL editEntityWithoutSecKey ("e", ?, ?, ?, ?, ?, ?)`;
    let paramValArr = [
      userID, entID, defStr, whitelistID, isAnonymous, isEditable
    ];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }

  static editFormalEntity(
    entID, userID, defStr, isAnonymous = 0, isEditable = 1, whitelistID = "0",
  ) {
    let sql = `CALL editEntityWithSecKey ("f", ?, ?, ?, ?, ?, ?)`;
    let paramValArr = [
      userID, entID, defStr, whitelistID, isAnonymous, isEditable
    ];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }


  /* Entity miscellaneous */

  static finalizeEntity(entID, userID) {
    let sql = `CALL finalizeEntity (?, ?)`;
    let paramValArr = [userID, entID];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }

  static anonymizeEntity(entID, userID) {
    let sql = `CALL anonymizeEntity (?, ?)`;
    let paramValArr = [userID, entID];
    let [outID, exitCode] = mainDBConnector.connectAndQuery(sql, paramValArr);
    return [outID, exitCode];
  }


  static substitutePlaceholdersInEntity() {
    // TODO: Make soon.
  }

  static nullUserRefsInEntity() {
    // TODO: Make at some point.
  }




  /*  Data structure reads */

  // TODO: Make data read and write methods.

}

