
import {MainDBConnector} from "./DBConnector";
import {InputValidator} from "../user_input/InputValidator";

const mainDBConnector = new MainDBConnector();



export class MainDBInterface {

  static #validateAndQuery(sql, paramValArr, typeArr, paramNameArr) {
    InputValidator.validateParams(paramValArr, typeArr, paramNameArr);
    return mainDBConnector.connectAndQuery(sql, paramValArr);
  }


  /* File/directory reads */

  static readDirMetaData(dirID) {
    let sql =
      "SELECT parent_dir_id, dir_name, is_private, is_home_dir, admin_id " +
      "FROM Directories FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ?;";
    let paramValArr = [dirID];
    let paramNameArr = ["dirID"];
    let typeArr = ["ulong"];
// TODO: Possibly wrap in more destructuring:
    let [[parentDirID, name, isPrivate, isHomeDir, adminID]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [parentDirID, name, isPrivate, isHomeDir, adminID];
  }

  static readFileMetaData(fileID) {
    let sql =
      "SELECT dir_id, file_name, file_type, is_private " +
      "FROM Files FORCE INDEX (PRIMARY) " +
      "WHERE file_id = ?;";
    let paramValArr = [fileID];
    let paramNameArr = ["fileID"];
    let typeArr = ["ulong"];
    let [[dirID, name, type, isPrivate, isHomeDir]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [dirID, name, type, isPrivate, isHomeDir];
  }

  static readTextFileContent(fileID) {
    let sql =
      "SELECT CAST(content_data AS CHAR) " +
      "FROM Files FORCE INDEX (PRIMARY) " +
      "WHERE file_id = ?;";
    let paramValArr = [fileID];
    let paramNameArr = ["fileID"];
    let typeArr = ["ulong"];
    let [[contentStr]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return contentStr;
  }

  static readTextFileData(fileID) {
    let sql =
      "SELECT dir_id, file_name, file_type, is_private, " +
        "CAST(content_data AS CHAR) " +
      "FROM Files FORCE INDEX (PRIMARY) " +
      "WHERE file_id = ?;";
    let paramValArr = [fileID];
    let paramNameArr = ["fileID"];
    let typeArr = ["ulong"];
    let [[dirID, name, type, isPrivate, isHomeDir, contentStr]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [dirID, name, type, isPrivate, isHomeDir, contentStr];
  }

  static readFileData(fileID) {
    let sql =
      "SELECT dir_id, file_name, file_type, is_private, " +
      "  TO_BASE64(content_data) " +
      "FROM Files FORCE INDEX (PRIMARY) " +
      "WHERE file_id = ?;";
    let paramValArr = [fileID];
    let paramNameArr = ["fileID"];
    let typeArr = ["ulong"];
    let [[dirID, name, type, isPrivate, isHomeDir, contentBase64]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [dirID, name, type, isPrivate, isHomeDir, contentBase64];
  }



  static readChildDirID(parentDirID, name) {
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

  static readChildFileID(dirID, name) {
    let sql =
      "SELECT file_id " +
      "FROM Files FORCE INDEX (sec_idx) " +
      "WHERE dir_id = ? AND file_name = ?;";
    let paramValArr = [dirID, name,];
    let paramNameArr = ["dirID", "name"];
    let typeArr = ["ulong", "tiny_str"];
    let [[dirID]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return dirID;
  }


  static readDirChildren(
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

  static readFileChildren(
    dirID, maxNum = 100, numOffset = 0, isAscending = true
  ) {
    let sql =
      "SELECT file_name, file_id " +
      "FROM Files FORCE INDEX (sec_idx) " +
      "WHERE dir_id = ? " +
      "ORDER BY dir_name " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr = [dirID, numOffset, maxNum];
    let paramNameArr = ["dirID", "numOffset", "maxNum"];
    let typeArr = ["ulong", "uint", "uint"];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }



  static readDirCloneChildren(
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

  static readDirCloneParent(dirID) {
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





  /* Data table reads */

  static readBinKeyTableElemData(dirID, listKeyBase64, elemKeyBase64) {
    let sql =
      "SELECT TO_BASE64(elem_payload) " +
      "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
        "elem_key = FROM_BASE64(?);";
    let paramValArr = [dirID, listKeyBase64, elemKeyBase64];
    let paramNameArr = ["dirID", "listKeyBase64", "elemKeyBase64"];
    let typeArr = ["ulong", "tiny_base64_str", "tiny_base64_str"];
    let [[elemPayloadBase64]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return elemPayloadBase64;
  }

  static readBinKeyTable(
    dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null,
    numOffset = 0, isAscending = true,
  ) {
    let sql =
      "SELECT TO_BASE64(elem_key), TO_BASE64(elem_payload)" +
      "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
        "elem_key >= FROM_BASE64(?) AND " +
        (hiBase64 ? "list_key <= FROM_BASE64(?) " : "NOT ? ") +
      "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr =
      [dirID, listKeyBase64, loBase64, hiBase64, maxNum, numOffset];
    let paramNameArr =
      ["dirID", "listKeyBase64", "loBase64", "hiBase64", "maxNum", "numOffset"];
    let typeArr = [
      "ulong", "tiny_base64_str", "tiny_base64_str", "tiny_base64_str",
      "unit", "uint",
    ];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }


  static readCharKeyTableElemData(dirID, listKeyBase64, elemKey) {
    let sql =
      "SELECT TO_BASE64(elem_payload) " +
      "FROM CharKeyDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND elem_key = ?;";
    let paramValArr = [dirID, listKeyBase64, elemKey];
    let paramNameArr = ["dirID", "listKeyBase64", "elemKey"];
    let typeArr = ["ulong", "tiny_base64_str", "tiny_str"];
    let [[elemPayloadBase64]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [elemPayloadBase64];
  }

  static readCharKeyTable(
    dirID, listKeyBase64, lo = "", hi = "", maxNum = null,
    numOffset = 0, isAscending = true,
  ) {
    let sql =
      "SELECT TO_BASE64(elem_key), TO_BASE64(elem_payload)" +
      "FROM CharKeyDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
        "elem_key >= ? AND " +
        (hiBase64 ? "list_key <= ? " : "NOT ? ") +
      "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr =
      [dirID, listKeyBase64, lo, hi, maxNum, numOffset];
    let paramNameArr =
      ["dirID", "listKeyBase64", "lo", "hi", "maxNum", "numOffset"];
    let typeArr = [
      "ulong", "tiny_base64_str", "tiny_str", "tiny_str", "unit", "uint",
    ];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }



  static readBinKeyScoredTableElemData(dirID, listKeyBase64, elemKeyBase64) {
    let sql =
      "SELECT TO_BASE64(elem_score), TO_BASE64(elem_payload) " +
      "FROM BinKeyScoredDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
      "  elem_key = FROM_BASE64(?);";
    let paramValArr = [dirID, listKeyBase64, elemKeyBase64];
    let paramNameArr = ["dirID", "listKeyBase64", "elemKeyBase64"];
    let typeArr = ["ulong", "tiny_base64_str", "tiny_base64_str"];
    let [[elemScoreBase64, elemPayloadBase64]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [elemScoreBase64, elemPayloadBase64];
  }

  static readBinKeyScoredTableKeyOrdered(
    dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null,
    numOffset = 0, isAscending = true,
  ) {
    let sql =
      "SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), " +
      "  TO_BASE64(elem_payload)" +
      "FROM BinKeyScoredDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
        "elem_key >= FROM_BASE64(?) AND " +
        (hiBase64 ? "list_key <= FROM_BASE64(?) " : "NOT ? ") +
      "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr =
      [dirID, listKeyBase64, loBase64, hiBase64, maxNum, numOffset];
    let paramNameArr =
      ["dirID", "listKeyBase64", "loBase64", "hiBase64", "maxNum", "numOffset"];
    let typeArr = [
      "ulong", "tiny_base64_str", "tiny_base64_str", "tiny_base64_str",
      "unit", "uint",
    ];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }

  static readBinKeyScoredTableScoreOrdered(
    dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null,
    numOffset = 0, isAscending = true,
  ) {
    let sql =
      "SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), " +
      "  TO_BASE64(elem_payload)" +
      "FROM BinKeyScoredDataTables FORCE INDEX (sec_idx) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
        "elem_score >= FROM_BASE64(?) AND " +
        (hiBase64 ? "elem_score <= FROM_BASE64(?) " : "NOT ? ") +
      "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
      "LIMIT ?, ?;";
    let paramValArr =
      [dirID, listKeyBase64, loBase64, hiBase64, maxNum, numOffset];
    let paramNameArr =
      ["dirID", "listKeyBase64", "loBase64", "hiBase64", "maxNum", "numOffset"];
    let typeArr = [
      "ulong", "tiny_base64_str", "tiny_base64_str", "tiny_base64_str",
      "unit", "uint",
    ];
    let res =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return res;
  }





  /* File/directory creations, edits, moves, and deletions */

  static createDir(
    parentDirID = 1, name, isPrivate = 0, isHome = 0, adminID = 0
  ) {
    isPrivate = isPrivate ? 1 : 0;
    isHome = isHome ? 1 : 0;
    let sql =
      "INSERT IGNORE INTO Directories " +
      "(parent_dir_id, dir_name, is_private, is_home, admin_id)"
      "VALUES (?, ?, ?, ?, " + (adminID ? "?" : "NULL AND ?") + "); " +
      "SELECT LAST_INSERT_ID() AS dirID;";
    let paramValArr = [parentDirID, name, isPrivate, isHome, adminID];
    let paramNameArr =
      ["parentDirID", "name", "isPrivate", "isHome", "adminID"];
    let typeArr = ["ulong", "tiny_str", "bool", "bool", "ulong"];
    let [[dirID]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return dirID;
  }

  static editDir(
    dirID, name, isPrivate = 0, isHome = 0, adminID = 0
  ) {
    isPrivate = isPrivate ? 1 : 0;
    isHome = isHome ? 1 : 0;
    let sql =
      "UPDATE IGNORE Directories " +
      "SET dir_name = ?, is_private = ?, is_home = ?, " +
        "admin_id = " + (adminID ? "? " : "NULL AND ? ")
      "WHERE dir_id = ?;" +
      "SELECT ROW_COUNT() AS wasEdited";
    let paramValArr = [name, isPrivate, isHome, adminID, dirID];
    let paramNameArr = ["name", "isPrivate", "isHome", "adminID", "dirID"];
    let typeArr = ["tiny_str", "bool", "bool", "ulong", "ulong"];
    let [[wasEdited]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return wasEdited;
  }

  static moveDir(dirID, newParentID) {
    isPrivate = isPrivate ? 1 : 0;
    isHome = isHome ? 1 : 0;
    let sql =
      "UPDATE IGNORE Directories " +
      "SET parent_dir_id = ? " +
      "WHERE dir_id = ?;" +
      "SELECT ROW_COUNT() AS wasEdited";
    let paramValArr = [newParentID, dirID];
    let paramNameArr = ["newParentID", "dirID"];
    let typeArr = ["ulong", "ulong"];
    let [[wasEdited]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return wasEdited;
  }

  static deleteDir(dirID) {
    isPrivate = isPrivate ? 1 : 0;
    isHome = isHome ? 1 : 0;
    let sql =
      "DELETE FROM Directories " +
      "WHERE dir_id = ?;" +
      "SELECT ROW_COUNT() AS wasDeleted";
    let paramValArr = [dirID];
    let paramNameArr = ["dirID"];
    let typeArr = ["ulong"];
    let [[wasDeleted]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return wasDeleted;
  }

  static cloneDir(
    targetDirID, destDirID, name, isPrivate = 0, isHome = 0, adminID = 0
  ) {
    isPrivate = isPrivate ? 1 : 0;
    isHome = isHome ? 1 : 0;
    // TODO: Create a new directory as a child of destDir, and then opy all
    // public files and directories within targetDir to the new directory, and
    // also insert the clone into ClonedDirectories.
  }

}

