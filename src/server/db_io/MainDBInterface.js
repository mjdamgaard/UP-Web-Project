
import {MainDBConnector} from "./DBConnector";
import {InputValidator} from "../user_input/InputValidator";

const mainDBConnector = new MainDBConnector();



export class MainDBInterface {

  static #validateAndQuery(sql, paramValArr, typeArr, paramNameArr) {
    InputValidator.validateParams(paramValArr, typeArr, paramNameArr);
    return mainDBConnector.connectAndQuery(sql, paramValArr);
  }

  /* Entity selects */

  static fetchDirMetaData(dirID) {
    let sql =
      "SELECT parent_dir_id, dir_name, is_private, is_home_dir " +
      "FROM Directories FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ?;";
    let paramValArr = [dirID];
    let paramNameArr = ["dirID"];
    let typeArr = ["ulong"];
// TODO: Possibly wrap in more destructuring:
    let [[parentDirID, name, isPrivate, isHomeDir]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [parentDirID, name, isPrivate, isHomeDir];
  }


  static fetchChildDirID(parentDirID, name) {
    let sql =
      "SELECT dir_id " +
      "FROM Directories FORCE INDEX (sec_idx) " +
      "WHERE parent_dir_id = ? AND dir_name = ?;";
    let paramValArr = [parentDirID, name,];
    let paramNameArr = ["parentDirID", "name"];
    let typeArr = ["ulong", "tiny_str"];
    let [[dirID]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return dirID;
  }


  static fetchDirChildren(
    parentDirID, maxNum = 100, numOffset = 0, isAscending = true
  ) {
    let sql =
      "SELECT dir_name, dir_id " +
      "FROM Directories FORCE INDEX (sec_idx) " +
      "WHERE parent_dir_id = ? " +
      "ORDER BY dir_name " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr = [parentDirID, numOffset, maxNum];
    let paramNameArr = ["parentDirID", "numOffset", "maxNum"];
    let typeArr = ["ulong", "uint", "uint"];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }


  static fetchDirAdmins(
    dirID, maxNum = 100, numOffset = 0, isAscending = true
  ) {
    let sql =
      "SELECT admin_id " +
      "FROM DirectoryAdmins FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? " +
      "ORDER BY admin_id " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr = [dirID, numOffset, maxNum];
    let paramNameArr = ["dirID", "numOffset", "maxNum"];
    let typeArr = ["ulong", "uint", "uint"];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }


  static fetchDirCloneChildren(
    dirID, maxNum = 100, numOffset = 0, isAscending = true
  ) {
    let sql =
      "SELECT clone_child_dir_id " +
      "FROM ClonedDirectories FORCE INDEX (sec_idx) " +
      "WHERE clone_parent_dir_id = ? " +
      "ORDER BY clone_child_dir_id " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr = [dirID, numOffset, maxNum];
    let paramNameArr = ["dirID", "numOffset", "maxNum"];
    let typeArr = ["ulong", "uint", "uint"];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }

  static fetchDirCloneParent(dirID) {
    let sql =
      "SELECT clone_parent_dir_id " +
      "FROM ClonedDirectories FORCE INDEX (PRIMARY) " +
      "WHERE clone_child_dir_id = ?;";
    let paramValArr = [dirID];
    let paramNameArr = ["dirID"];
    let typeArr = ["ulong"];
    let [[cloneParentDirID]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return cloneParentDirID;
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

