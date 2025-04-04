
import {MainDBInterface} from "./MainDBInterface.js";
import {MainDBConnector} from "./DBConnector.js";



export class DBQueryHandler {

  static async read(route, clientCacheTime = null, minServerCacheTime = null) {

    // TODO: Step 1: Look in the server cache for the requested data. If the
    // cacheUpdateTime there is less than the minServerCacheTime, first look in
    // the DB to get the modified_at time of the file in question. If this is
    // less than or equal to the previous cacheUpdateTime in the server cache,
    // set the cacheUpdateTime to Date-now(), and also set the dbModifiedTime
    // to the new modified-at, then move on to Step 2. If on the other hand the
    // cacheUpdateTime is greater than the minServerCacheTime, do nothing else
    // for Step 1 and continue to Step 2.
    // Step 2: Look at the, perhaps just updated, dbModifiedTime in the cache
    // entry, and compare it to clientCacheTime. If the former is greater than
    // the latter, return [wasReady, data] = [false, entryData], where wasReady
    // = false means that the data that the client holds is not sufficiently
    // up-to-date. Else simply return [wasReady, data] = [true, undefined],
    // meaning that the client can go ahead and just use the data they already
    // have.

    // ...

    // Else we branch according to route and query the database for the data.
    if (
      /^\/[1-9][0-9]*\/[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*\.(js|txt|json)$/
        .test(route)
    ) {
      let indOfSecondSlash = route.indexOf("/", 1);
      let dirID = route.substring(1, indOfSecondSlash);
      let filePath = route.substring(indOfSecondSlash + 1);
      let queryString = undefined;
      if (path.length > 700) throw "...Path too long..";
      let conn = MainDBConnector.connect();
      let contentData = await MainDBInterface.readTextFileContent(
        conn, dirID, filePath
      );
      conn.end();
      return [false, contentData];
    }
    else {
      // TODO: Implement other file types.
    }
  }

}