
import {MainDBInterface} from "./MainDBInterface.js";
import {MainDBConnection} from "./DBConnection.js";
import {ClientError} from '../err/errors.js';



export class DBQueryHandler {

  static async read(
    route, reqUserID = null, clientCacheTime = null, minServerCacheTime = null
  ) {

    // TODO: Step 1: Look in the server cache for the requested data. If the
    // cacheUpdateTime there is less than the minServerCacheTime, first look in
    // the DB to get the modified_at time of the file in question. If this is
    // less than or equal to the previous cacheUpdateTime in the server cache,
    // set the cacheUpdateTime to Date-now(), and also set the dbModifiedTime
    // to the new modified-at, then move on to Step 2. If on the other hand the
    // cacheUpdateTime is greater than the minServerCacheTime, do nothing else
    // for Step 1 and continue to Step 2. *(I forgot about also looking in the
    // DB for data if the cache's dbModifiedTime is less than the gotten
    // modified_at time, and then set the new data in the cache.)
    // Step 2: Look at the, perhaps just updated, dbModifiedTime in the cache
    // entry, and compare it to clientCacheTime. If the former is greater than
    // the latter, return [wasReady, data] = [false, entryData], where wasReady
    // = false means that the data that the client holds is not sufficiently
    // up-to-date. Else simply return [wasReady, data] = [true, undefined],
    // meaning that the client can go ahead and just use the data they already
    // have.

    // But for now, we just forget about the cache and the querying

    // ...

    // Else we branch according to route and query the database for the data.
    if (
      /^\/[1-9][0-9]*\/[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*\.(js|txt|json|html)$/
        .test(route)
    ) {
      let [dirID, filePath] = parseDirIDAndFilePath(route);

      let paramValArr = [dirID, filePath];
      let sql = "CALL readTextFileContent (?, ?)";

      let conn = new MainDBConnection();
      let [contentText] = (await conn.query(sql, paramValArr))[0] ?? [];
      conn.end();

      return contentText;
    }
    else if (
      /^\/[1-9][0-9]*$/.test(route)
      ) {
        let dirID = route.substring(1);

        let paramValArr = [dirID];
        let sql = "CALL readHomeDirDescendants (?, 10000, 0)";
  
        let conn = new MainDBConnection();
        let filePaths = (await conn.query(sql, paramValArr) ?? []).map(val => (
          val[0]
        ));
        conn.end();
  
        return filePaths;
    }
    else if (
      /^\/[1-9][0-9]*\?get=adminID$/.test(route)
      ) {
        let dirID = route.substring(1, route.indexOf("?"));

        let paramValArr = [dirID];
        let sql = "CALL readHomeDirAdminID (?)";
  
        let conn = new MainDBConnection();
        let [adminID] = (await conn.query(sql, paramValArr))[0] ?? [];
        conn.end();
  
        return adminID;
    }
    else if (false) {
      // TODO: Implement other file types.
    }
    else {
      throw new ClientError(
        'Unrecognized type of "read" request'
      );
    }
  }



  static async put(
    reqUserID, route, content, isBase64
  ) {
    // If route has the type of a (UTF-8-encoded) text file, create or
    // overwrite that file with the content.
    if (
      /^\/[1-9][0-9]*\/[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*\.(js|txt|json|html)$/
        .test(route)
    ) {
      let [dirID, filePath] = parseDirIDAndFilePath(route);

      // TODO: Verify that reqUser is the admin of the given home dir here.

      let paramValArr = [dirID, filePath, content];
      let sql = "CALL putTextFile (?, ?, ?)";

      let conn = new MainDBConnection();
      let [wasCreated] = (await conn.query(sql, paramValArr))[0] ?? [];
      conn.end();

      return wasCreated;
    }

    // TODO: Implement other file types.
  }


  static async mkdir(reqUserID) {
    let adminID = reqUserID;
    let paramValArr = [adminID];
    let sql = "CALL createHomeDir (?)";

    let conn = new MainDBConnection();
    let [dirID] = (await conn.query(sql, paramValArr))[0] ?? [];

    conn.end();
    return dirID;
  }



  static async delete(reqUserID, route) {

    // TODO: Remove data from cache when a file, or directory, is deleted.

    if (
      /^\/[1-9][0-9]*\/[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*\.(js|txt|json|html)$/
        .test(route)
    ) {
      let [dirID, filePath] = parseDirIDAndFilePath(route);

      let paramValArr = [dirID, filePath];
      let sql = "CALL deleteTextFile (?, ?)";

      let conn = new MainDBConnection();
      let [wasDeleted] = (await conn.query(sql, paramValArr))[0] ?? [];
      conn.end();

      return wasDeleted;
    }
    else if (
      /^\/[1-9][0-9]*$/.test(route)
      ) {
        // TODO: IMplement directory deletion.
    }
    else if (false) {
      // TODO: Implement other file types.
    }
    else {
      throw new ClientError(
        'Unrecognized type of "delete" request'
      );
    }
  }

}




function parseDirIDAndFilePath(route) {
  let indOfSecondSlash = route.indexOf("/", 1);
  let dirID = route.substring(1, indOfSecondSlash);
  let filePath = route.substring(indOfSecondSlash + 1);
  if (filePath.length > 700) throw new ClientError(
    "File path is too long"
  );
  return [dirID, filePath];
}