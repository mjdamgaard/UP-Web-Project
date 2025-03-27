
import {MainDBConnector} from "./DBConnector";
import {InputValidator} from "../user_input/InputValidator";

const mainDBConnector = new MainDBConnector();



export class MainDBInterface {

  static #validateAndQuery(sql, paramValArr, typeArr, paramNameArr) {
    InputValidator.validateParams(paramValArr, typeArr, paramNameArr);
    return mainDBConnector.connectAndQuery(sql, paramValArr);
  }

  /* Entity selects */

  static selectDirMetaData(dirID) {
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

  static selectFileMetaData(fileID) {
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

  static selectTextFileContent(fileID) {
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

  static selectTextFileData(fileID) {
    let sql =
      "SELECT dir_id, file_name, file_type, is_private, " +
      "  CAST(content_data AS CHAR) " +
      "FROM Files FORCE INDEX (PRIMARY) " +
      "WHERE file_id = ?;";
    let paramValArr = [fileID];
    let paramNameArr = ["fileID"];
    let typeArr = ["ulong"];
    let [[dirID, name, type, isPrivate, isHomeDir, contentStr]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [dirID, name, type, isPrivate, isHomeDir, contentStr];
  }

  static selectFileData(fileID) {
    let sql =
      "SELECT dir_id, file_name, file_type, is_private, HEX(content_data) " +
      "FROM Files FORCE INDEX (PRIMARY) " +
      "WHERE file_id = ?;";
    let paramValArr = [fileID];
    let paramNameArr = ["fileID"];
    let typeArr = ["ulong"];
    let [[dirID, name, type, isPrivate, isHomeDir, contentHexStr]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return [dirID, name, type, isPrivate, isHomeDir, contentHexStr];
  }



  static selectChildDirID(parentDirID, name) {
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

  static selectChildFileID(dirID, name) {
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


  static selectDirChildren(
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

  static selectFileChildren(
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



  static selectDirAdmins(
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


  static selectDirCloneChildren(
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

  static selectDirCloneParent(dirID) {
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





  static selectBinTableElemData(dirID, listKeyBase64, elemKeyBase64) {
    let sql =
      "SELECT TO_BASE64(elem_payload) " +
      "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
      "  elem_key = FROM_BASE64(?);";
    let paramValArr = [dirID, listKeyBase64, elemKeyBase64];
    let paramNameArr = ["dirID", "listKeyBase64", "elemKeyBase64"];
    let typeArr = ["ulong", "tiny_base64_str", "tiny_base64_str"];
    let [[elemPayloadHexStr]] =
      this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
    return elemPayloadHexStr;
  }

  static selectBinTable(
    dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null, numOffset = 0,
    isAscending = true,
  ) {
    let sql =
      "SELECT TO_BASE64(elem_key), TO_BASE64(elem_payload)" +
      "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
      "WHERE dir_id = ? AND list_key >= FROM_BASE64(?) AND " +
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



}

