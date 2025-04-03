
import {MainDBInterface} from "./MainDBInterface.js";



export class DBQueryHandler {

  static async queryPublic(route, lastUpdatedAt = null) {

    // TODO: If lastUpdatedAt is not null, it means that the user has a version
    // of the requested data in their cache already. If so, first simply query
    // the modified_at time of the file pointed to by the path part of route,
    // and if it is earlier than lastUpdatedAt, simply write [true, undefined]
    // back to the client, where true here that the cached data is still valid.
    // And if not we first look in the server's own cache to see if the data is
    // there, and with an earlier "updated-at time." If it is, we can write back
    // [false, data], and if not, we query the DB again for the actual data,
    // then set it in the cache, and also write back [false, data] to the
    // client.

    // TODO: And if lastUpdatedAt is null, we just skip the first part of the
    // last paragraph, never writing back [true, undefined], but always [false,
    // data].
    // But in this early implementation, we just forget all about the cache and
    // the modified-at and updated-at times, and just always queries the DB
    // immediately, and return [false, data].

    // So pretend that this paragraph is a placeholder for querying for the
    // modified-at time, confirming that the user needs to be sent the data
    // anew (or returning early), and then looking in the cache with no luck.
    
    // ...

    // Else we branch according to route and query the database for the data.
    if (
      /\/...\/[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*\.(js|mjs|txt|json)/.test(route)
    ) {
      let conn = "...";
      let dirID = "...";
      let path = route;
      let queryString = undefined;
      if (path.length > 700) throw "...Path too long..";
      let contentData = await MainDBInterface.readTextFileContent(
        conn, dirID, path
      );
      return [false, contentData];
    }
    else {
      // TODO: Implement other file types.
    }
  }

}