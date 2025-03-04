
import {MainDBConnector} from "./DBConnector";
import {InputValidator} from "../user_input/InputValidator";

const mainDBConnector = new MainDBConnector();


export class MainDBInterface {

  static #validateAndQuery(sql, paramValArr, typeArr, paramNameArr) {
    InputValidator.validateParams(paramValArr, typeArr, paramNameArr);
    return mainDBConnector.connectAndQuery(sql, paramValArr);
  }


  /* Entity selects */

  static selectEntity(entID, maxLen = 4294967295, startPos = 0) {
    let sql = `CALL selectEntity (?, ?, ?)`;
    paramValArr = [entID, maxLen, startPos];
    paramNameArr = ["entID", "maxLen", "startPos"];
    typeArr = ["id", "uint", "uint"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }

  static selectFormalEntityID(defStr, whitelistID = "0") {
    let sql = `CALL selectEntityIDFromSecKey ("f", ?, ?)`;
    paramValArr = [whitelistID, defStr];
    paramNameArr = ["whitelistID", "defStr"];
    typeArr = ["id", "string"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }


  /* Entity inserts */

  static insertScriptEntity(
    script, isAnonymous = 0, creatorID = "0", isEditable = 0, whitelistID = "0",
  ) {
    let sql = `CALL insertEntityWithoutSecKey ("s", ?, ?, ?, ?, ?)`;
    paramValArr = [creatorID, script, whitelistID, isAnonymous, isEditable];
    paramNameArr = [
      "creatorID", "script", "whitelistID", "isAnonymous", "isEditable"
    ];
    typeArr = ["id", "text", "id", "bool", "bool"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }


  static insertExpressionEntity(
    exp, isAnonymous = 0, creatorID = "0", isEditable = 0, whitelistID = "0",
  ) {
    let sql = `CALL insertEntityWithoutSecKey ("e", ?, ?, ?, ?, ?)`;
    paramValArr = [creatorID, exp, whitelistID, isAnonymous, isEditable];
    paramNameArr = [
      "creatorID", "exp", "whitelistID", "isAnonymous", "isEditable"
    ];
    typeArr = ["id", "text", "id", "bool", "bool"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }


  static insertFormalEntity(
    defStr, isAnonymous = 0, creatorID = "0", whitelistID = "0",
  ) {
    let sql = `CALL insertEntityWithSecKey ("f", ?, ?, ?, ?)`;
    paramValArr = [creatorID, defStr, whitelistID, isAnonymous];
    paramNameArr = ["creatorID", "defStr", "whitelistID", "isAnonymous"];
    typeArr = ["id", "string", "id", "bool"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }


  /* Entity edits */

  static editScriptEntity(
    entID, userID, defStr, isAnonymous = 0, isEditable = 1, whitelistID = "0",
  ) {
    let sql = `CALL editEntity ("s", ?, ?, ?, ?, ?, ?)`;
    paramValArr = [userID, entID, defStr, whitelistID, isAnonymous, isEditable];
    paramNameArr = [
      "userID", "entID", "defStr", "whitelistID", "isAnonymous", "isEditable"
    ];
    typeArr = ["id", "id", "text", "id", "bool", "bool"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }

  static editExpressionEntity(
    entID, userID, defStr, isAnonymous = 0, isEditable = 1, whitelistID = "0",
  ) {
    let sql = `CALL editEntity ("e", ?, ?, ?, ?, ?, ?)`;
    paramValArr = [userID, entID, defStr, whitelistID, isAnonymous, isEditable];
    paramNameArr = [
      "userID", "entID", "defStr", "whitelistID", "isAnonymous", "isEditable"
    ];
    typeArr = ["id", "id", "text", "id", "bool", "bool"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }


  /* Entity miscellaneous */

  static finalizeEntity(entID, userID) {
    let sql = `CALL finalizeEntity (?, ?)`;
    paramValArr = [userID, entID];
    paramNameArr = ["userID", "entID"];
    typeArr = ["id", "id"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
  }

  static anonymizeEntity(entID, userID) {
    let sql = `CALL anonymizeEntity (?, ?)`;
    paramValArr = [userID, entID];
    paramNameArr = ["userID", "entID"];
    typeArr = ["id", "id"];
    return this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
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

