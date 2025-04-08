

export class MainDBInterface {

  static #validateAndQuery(sql, paramValArr, typeArr, paramNameArr) {
    InputValidator.validateParams(paramValArr, typeArr, paramNameArr);
    return mainDBConnector.connectAndQuery(sql, paramValArr);
  }



  static async readHomeDirMetaData(conn, dirID) {
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  IF (dirID IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT admin_id, is_private
  FROM HomeDirectories FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      adminID, isPrivate
    ]]] = await conn.query(options, [
      dirID
    ]);
    return [adminID, isPrivate];
  }


  static async readHomeDirDescendants(conn, dirID, maxNum, numOffset) {
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE maxNum INT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE numOffset INT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  IF (dirID IS NULL OR maxNum IS NULL OR numOffset IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_path
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID
  ORDER BY file_path ASC
  LIMIT numOffset, maxNum;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[pathArr]] = await conn.query(options, [
      dirID, maxNum, numOffset
    ]);
    return [pathArr];
  }



  static async createHomeDir(conn, adminID, isPrivate) {
    isPrivate = isPrivate ? 1 : 0;
    let sql =
`BEGIN proc:
  DECLARE adminID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE isPrivate BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  IF (adminID IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  INSERT INTO HomeDirectories (admin_id, is_private)
  VALUES (adminID, isPrivate);
  SELECT LAST_INSERT_ID() AS dirID;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      dirID
    ]]] = await conn.query(options, [
      adminID, isPrivate
    ]);
    return dirID;
  }


  static async editHomeDir(conn, dirID, adminID, isPrivate) {
    isPrivate = isPrivate ? 1 : 0;
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE adminID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE isPrivate BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  IF (dirID IS NULL OR adminID IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  UPDATE HomeDirectories
  SET admin_id = adminID, is_private = isPrivate
  WHERE dir_id = dirID;
  SELECT ROW_COUNT() AS wasEdited;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      wasEdited
    ]]] = await conn.query(options, [
      dirID, adminID, isPrivate
    ]);
    return wasEdited;
  }


  static async deleteHomeDir(conn, dirID) {
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE firstFileID BIGINT UNSIGNED;
  IF (dirID IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO firstFileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID
  ORDER BY file_path
  LIMIT 1;
  IF (firstFileID IS NOT NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  DELETE FROM HomeDirectories
  WHERE dir_id = dirID;
  SELECT ROW_COUNT() AS wasDeleted;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      wasDeleted
    ]]] = await conn.query(options, [
      dirID
    ]);
    return wasDeleted;
  }




  static async readFileMetaData(conn, dirID, filePath) {
    if (typeof filePath !== "string" || filePath.length > 700) throw (
      "readFileMetaData(): filePath is not a string, or is too long"
    );
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  IF (dirID IS NULL OR filePath IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT modified_at, prev_modified_at
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      modifiedAt, prevModifiedAt
    ]]] = await conn.query(options, [
      dirID, filePath
    ]);
    return [modifiedAt, prevModifiedAt];
  }


  static async moveFile(conn, dirID, filePath, newFilePath) {
    if (typeof filePath !== "string" || filePath.length > 700) throw (
      "readFileMetaData(): filePath is not a string, or is too long"
    );
    if (typeof newFilePath !== "string" || newFilePath.length > 700) throw (
      "readFileMetaData(): newFilePath is not a string, or is too long"
    );
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE newFilePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  IF (dirID IS NULL OR filePath IS NULL OR newFilePath IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  UPDATE IGNORE Files
  SET file_path = newFilePath
  WHERE dir_id = dirID AND file_path = filePath;
  SELECT ROW_COUNT() AS wasMoved;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      wasMoved
    ]]] = await conn.query(options, [
      dirID, filePath, newFilePath
    ]);
    return wasMoved;
  }



  static async readTextFileContent(conn, dirID, filePath) {
    if (typeof filePath !== "string" || filePath.length > 700) throw (
      "readFileMetaData(): filePath is not a string, or is too long"
    );
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE fileID BIGINT UNSIGNED;
  IF (dirID IS NULL OR filePath IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO fileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
  SELECT content_data
  FROM TextFileContents FORCE INDEX (PRIMARY)
  WHERE file_id = fileID;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      contentData
    ]]] = await conn.query(options, [
      dirID, filePath
    ]);
    return contentData;
  }


  static async putTextFile(conn, dirID, filePath, contentText) {
    if (typeof filePath !== "string" || filePath.length > 700) throw (
      "readFileMetaData(): filePath not a string, or is too long"
    );
    if (typeof contentText !== "string" || contentText.length > 65535) throw (
      "readFileMetaData(): contentText not a string, or is too long"
    );
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE contentText TEXT DEFAULT (CAST(? AS CHAR));
  DECLARE fileID BIGINT UNSIGNED;
  IF (dirID IS NULL OR filePath IS NULL OR contentText IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO fileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
  IF (fileID IS NOT NULL) THEN
    UPDATE TextFileContents
    SET content_text = contentText
    WHERE file_id = fileID;
    SELECT 0 AS wasCreated;
  ELSE
    INSERT INTO FileIDs () VALUES ();
    SET fileID = LAST_INSERT_ID();
    DELETE FROM FileIDs WHERE file_id < fileID;
    INSERT INTO TextFileContents (file_id, content_text)
    VALUES (fileID, contentText);
    SELECT 1 AS wasCreated;
  END IF;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      wasCreated
    ]]] = await conn.query(options, [
      dirID, filePath, contentText
    ]);
    return wasCreated;
  }


  static async editTextFile(conn, dirID, filePath, contentText) {
    if (typeof filePath !== "string" || filePath.length > 700) throw (
      "readFileMetaData(): filePath not a string, or is too long"
    );
    if (typeof contentText !== "string" || contentText.length > 65535) throw (
      "readFileMetaData(): filePath not a string, or is too long"
    );
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE contentText TEXT DEFAULT (CAST(? AS CHAR));
  DECLARE fileID BIGINT UNSIGNED;
  IF (dirID IS NULL OR filePath IS NULL OR contentText IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO fileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
  UPDATE TextFileContents
  SET content_text = contentText
  WHERE file_id = fileID;
  SELECT ROW_COUNT() AS wasEdited;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      wasEdited
    ]]] = await conn.query(options, [
      dirID, filePath, contentText
    ]);
    return wasEdited;
  }


  static async deleteTextFile(conn, dirID, filePath) {
    if (typeof filePath !== "string" || filePath.length > 700) throw (
      "readFileMetaData(): filePath not a string, or is too long"
    );
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE fileID BIGINT UNSIGNED;
  IF (dirID IS NULL OR filePath IS NULL) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO fileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
  DELETE FROM TextFileContents
  WHERE file_id = fileID;
  DELETE FROM Files
  WHERE dir_id = dirID AND file_path = filePath;
  SELECT ROW_COUNT() AS wasDeleted;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      wasDeleted
    ]]] = await conn.query(options, [
      dirID, filePath
    ]);
    return wasDeleted;
  }




  static async readBSTFileScoreOrderedList(
    conn, dirID, filePath, loBase64 = null, hiBase64 = null, maxNum,
    numOffset = 0, isAscending = 0
  ) {
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE lo VARBINARY(255) DEFAULT (FROM_BASE64(CAST(? AS CHAR)));
  DECLARE hi VARBINARY(255) DEFAULT (FROM_BASE64(CAST(? AS CHAR)));
  DECLARE maxNum INT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE numOffset INT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE fileID BIGINT UNSIGNED;
  IF (
    dirID IS NULL OR filePath IS NULL OR lo IS NULL OR hi IS NULL OR
    maxNum IS NULL OR numOffset IS NULL
  ) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO fileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
  SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), TO_BASE64(elem_payload)
  FROM BinKeyScoredDataTables FORCE INDEX (sec_idx)
  WHERE file_id = fileID
    ${(hi !== null) ? "AND elem_score >= lo" : ""}
    ${(hi !== null) ? "AND elem_score <= hi" : ""}
  ORDER BY elem_score ${isAscending ? "ASC" : "DESC"}
  LIMIT numOffset, maxNum;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[rowArr]] = await conn.query(options, [
      dirID, filePath, loBase64, hiBase64, maxNum, numOffset, isAscending
    ]);
    return rowArr;
  }


  static async readBSTFileRow(
    conn, dirID, filePath, elemKeyBase64
  ) {
    let sql =
`BEGIN proc:
  DECLARE dirID BIGINT UNSIGNED DEFAULT (CAST(? AS UNSIGNED));
  DECLARE filePath VARCHAR(700) DEFAULT (CAST(? AS CHAR));
  DECLARE elemKey VARBINARY(255) DEFAULT (FROM_BASE64(CAST(? AS CHAR)));
  DECLARE fileID BIGINT UNSIGNED;
  IF (
    dirID IS NULL OR filePath IS NULL OR lo IS NULL OR hi IS NULL OR
    maxNum IS NULL OR numOffset IS NULL
  ) THEN
    SELECT NULL;
    LEAVE proc;
  END IF;
  SELECT file_id INTO fileID
  FROM Files FORCE INDEX (PRIMARY)
  WHERE dir_id = dirID AND file_path = filePath;
  SELECT TO_BASE64(elem_score), TO_BASE64(elem_payload)
  FROM BinKeyScoredDataTables FORCE INDEX (PRIMARY)
  WHERE file_id = fileID AND elem_key = elemKey;
END proc`;
    let options = {sql: sql, rowsAsArray: true};
    let [[[
      elemScoreBase64, elemPayloadBase64
    ]]] = await conn.query(options, [
      dirID, filePath, elemKeyBase64
    ]);
    return [elemScoreBase64, elemPayloadBase64];
  }


  // TODO: Make binary-key scored table (BST) write functions as well.

  // TODO: Make other kinds of data table file types for other purposes, also
  // including a full-text index file type.




  /* File/directory creations, edits, moves, and deletions */










//   static createTextFile(dirID, name, isPrivate = 0, contentStr) {
//     isPrivate = isPrivate ? 1 : 0;
//     let sql =
//       "INSERT IGNORE INTO Files " +
//       "(dir_id, file_name, is_private, content_data)"
//       "VALUES (?, ?, ?, CAST(? AS BINARY)); " +
//       "SELECT LAST_INSERT_ID() AS dirID;";
//     let paramValArr = [dirID, name, isPrivate, contentStr];
//     let paramNameArr = ["dirID", "name", "isPrivate", "contentStr"];
//     let typeArr = ["ulong", "str255", "bool", "blob_text"];
//     let [[dirID]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return dirID;
//   }

//   static createFile(dirID, name, isPrivate = 0, contentBase64) {
//     isPrivate = isPrivate ? 1 : 0;
//     let sql =
//       "INSERT IGNORE INTO Files " +
//       "(dir_id, file_name, is_private, content_data)"
//       "VALUES (?, ?, ?, FROM_BASE64(?)); " +
//       "SELECT LAST_INSERT_ID() AS dirID;";
//     let paramValArr = [dirID, name, isPrivate, contentBase64];
//     let paramNameArr = ["dirID", "name", "isPrivate", "contentBase64"];
//     let typeArr = ["ulong", "str255", "bool", "blob_base64"];
//     let [[dirID]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return dirID;
//   }

//   static editTextFile(
//     fileID, name, isPrivate = 0, contentStr
//   ) {
//     isPrivate = isPrivate ? 1 : 0;
//     let sql =
//       "UPDATE IGNORE Files " +
//       "SET file_name = ?, is_private = ?, content_data = CAST(? AS BINARY) " +
//       "WHERE file_id = ?;" +
//       "SELECT ROW_COUNT() AS wasEdited";
//     let paramValArr = [name, isPrivate, contentStr, fileID];
//     let paramNameArr = ["name", "isPrivate", "contentStr", "fileID"];
//     let typeArr = ["str255", "bool", "blob_text", "ulong"];
//     let [[wasEdited]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return wasEdited;
//   }

//   static moveFile(fileID, newParentID) {
//     let sql =
//       "UPDATE IGNORE Files " +
//       "SET dir_id = ? " +
//       "WHERE file_id = ?;" +
//       "SELECT ROW_COUNT() AS wasEdited";
//     let paramValArr = [newParentID, fileID];
//     let paramNameArr = ["newParentID", "fileID"];
//     let typeArr = ["ulong", "ulong"];
//     let [[wasEdited]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return wasEdited;
//   }

//   static deleteFile(fileID) {
//     let sql =
//       "DELETE FROM Directories " +
//       "WHERE file_id = ?;" +
//       "SELECT ROW_COUNT() AS wasDeleted";
//     let paramValArr = [fileID];
//     let paramNameArr = ["fileID"];
//     let typeArr = ["ulong"];
//     let [[wasDeleted]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return wasDeleted;
//   }






//   /* Data table reads */

//   static readBinKeyTableElemData(dirID, listKeyBase64, elemKeyBase64) {
//     let sql =
//       "SELECT TO_BASE64(elem_payload) " +
//       "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//         "elem_key = FROM_BASE64(?);";
//     let paramValArr = [dirID, listKeyBase64, elemKeyBase64];
//     let paramNameArr = ["dirID", "listKeyBase64", "elemKeyBase64"];
//     let typeArr = ["ulong", "str255_base64", "str255_base64"];
//     let [[elemPayloadBase64]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return elemPayloadBase64;
//   }

//   static readBinKeyTable(
//     dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null,
//     numOffset = 0, isAscending = true,
//   ) {
//     let sql =
//       "SELECT TO_BASE64(elem_key), TO_BASE64(elem_payload)" +
//       "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//         "elem_key >= FROM_BASE64(?) AND " +
//         (hiBase64 ? "list_key <= FROM_BASE64(?) " : "NOT ? ") +
//       "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
//       "LIMIT ?, ?;";
//     let paramValArr =
//       [dirID, listKeyBase64, loBase64, hiBase64, maxNum, numOffset];
//     let paramNameArr =
//       ["dirID", "listKeyBase64", "loBase64", "hiBase64", "maxNum", "numOffset"];
//     let typeArr = [
//       "ulong", "str255_base64", "str255_base64", "str255_base64",
//       "unit", "uint",
//     ];
//     let res =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return res;
//   }


//   static readCharKeyTableElemData(dirID, listKeyBase64, elemKey) {
//     let sql =
//       "SELECT TO_BASE64(elem_payload) " +
//       "FROM CharKeyDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND elem_key = ?;";
//     let paramValArr = [dirID, listKeyBase64, elemKey];
//     let paramNameArr = ["dirID", "listKeyBase64", "elemKey"];
//     let typeArr = ["ulong", "str255_base64", "str255"];
//     let [[elemPayloadBase64]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return [elemPayloadBase64];
//   }

//   static readCharKeyTable(
//     dirID, listKeyBase64, lo = "", hi = "", maxNum = null,
//     numOffset = 0, isAscending = true,
//   ) {
//     let sql =
//       "SELECT TO_BASE64(elem_key), TO_BASE64(elem_payload)" +
//       "FROM CharKeyDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//         "elem_key >= ? AND " +
//         (hiBase64 ? "list_key <= ? " : "NOT ? ") +
//       "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
//       "LIMIT ?, ?;";
//     let paramValArr =
//       [dirID, listKeyBase64, lo, hi, maxNum, numOffset];
//     let paramNameArr =
//       ["dirID", "listKeyBase64", "lo", "hi", "maxNum", "numOffset"];
//     let typeArr = [
//       "ulong", "str255_base64", "str255", "str255", "unit", "uint",
//     ];
//     let res =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return res;
//   }



//   static readBinKeyScoredTableElemData(dirID, listKeyBase64, elemKeyBase64) {
//     let sql =
//       "SELECT TO_BASE64(elem_score), TO_BASE64(elem_payload) " +
//       "FROM BinKeyScoredDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//       "  elem_key = FROM_BASE64(?);";
//     let paramValArr = [dirID, listKeyBase64, elemKeyBase64];
//     let paramNameArr = ["dirID", "listKeyBase64", "elemKeyBase64"];
//     let typeArr = ["ulong", "str255_base64", "str255_base64"];
//     let [[elemScoreBase64, elemPayloadBase64]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return [elemScoreBase64, elemPayloadBase64];
//   }

//   static readBinKeyScoredTableKeyOrdered(
//     dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null,
//     numOffset = 0, isAscending = true,
//   ) {
//     let sql =
//       "SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), " +
//       "  TO_BASE64(elem_payload)" +
//       "FROM BinKeyScoredDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//         "elem_key >= FROM_BASE64(?) AND " +
//         (hiBase64 ? "list_key <= FROM_BASE64(?) " : "NOT ? ") +
//       "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
//       "LIMIT ?, ?;";
//     let paramValArr =
//       [dirID, listKeyBase64, loBase64, hiBase64, maxNum, numOffset];
//     let paramNameArr =
//       ["dirID", "listKeyBase64", "loBase64", "hiBase64", "maxNum", "numOffset"];
//     let typeArr = [
//       "ulong", "str255_base64", "str255_base64", "str255_base64",
//       "unit", "uint",
//     ];
//     let res =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return res;
//   }

//   static readBinKeyScoredTableScoreOrdered(
//     dirID, listKeyBase64, loBase64 = "", hiBase64 = "", maxNum = null,
//     numOffset = 0, isAscending = true,
//   ) {
//     let sql =
//       "SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), " +
//       "  TO_BASE64(elem_payload)" +
//       "FROM BinKeyScoredDataTables FORCE INDEX (sec_idx) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//         "elem_score >= FROM_BASE64(?) AND " +
//         (hiBase64 ? "elem_score <= FROM_BASE64(?) " : "NOT ? ") +
//       "ORDER BY elem_key " + (isAscending ? "ASC " : "DESC ") +
//       "LIMIT ?, ?;";
//     let paramValArr =
//       [dirID, listKeyBase64, loBase64, hiBase64, maxNum, numOffset];
//     let paramNameArr =
//       ["dirID", "listKeyBase64", "loBase64", "hiBase64", "maxNum", "numOffset"];
//     let typeArr = [
//       "ulong", "str255_base64", "str255_base64", "str255_base64",
//       "unit", "uint",
//     ];
//     let res =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return res;
//   }



//   /* Data table writes */

//   static writeBinKeyTableElemData(dirID, listKeyBase64, elemKeyBase64) {
//     let sql =
//       "SELECT TO_BASE64(elem_payload) " +
//       "FROM BinKeyDataTables FORCE INDEX (PRIMARY) " +
//       "WHERE dir_id = ? AND list_key = FROM_BASE64(?) AND " +
//         "elem_key = FROM_BASE64(?);";
//     let paramValArr = [dirID, listKeyBase64, elemKeyBase64];
//     let paramNameArr = ["dirID", "listKeyBase64", "elemKeyBase64"];
//     let typeArr = ["ulong", "str255_base64", "str255_base64"];
//     let [[elemPayloadBase64]] =
//       this.#validateAndQuery(sql, paramValArr, typeArr, paramNameArr);
//     return elemPayloadBase64;
//   }
// }

}