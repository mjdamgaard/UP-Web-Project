
import {MainDBConnection, getProcCallSQL} from "./DBConnection.js";
import {payGas} from '../../interpreting/ScriptInterpreter.js';

// Cache placeholder:
const mainDBCache = {
  get: () => {}, set: () => {}, remove: () => {}, removeExtensions: () => {},
};



export class DBQueryHandler {

  // #getMainDBConn() and #releaseMainDBConn() can be modified if we want to
  // implement/use a connection pool.
 
  #getMainDBConn() {
    return new MainDBConnection();
  }

  #releaseMainDBConn(conn) {
    conn.end();
  }


  // queryDBProcOrCache() handles a lot of common queries, namely ones that
  // is implemented via a single DB procedure, and where the whole result is
  // stored directly at the route in the cache, or simply not cached at all,
  // namely when the noCache parameter is truthy.
  async queryDBProcOrCache(
    procName, paramValArr, route, upNodeID, maxAge, noCache, lastUpToDate,
    node, env, routesToEvict,
  ) {
    // Get a connection the the main DB.
    let conn = this.#getMainDBConn();

    // Generate the SQL (with '?' placeholders in it).
    let sql = getProcCallSQL(procName, paramValArr.length);
  
    // Query the DB or the cache.
    let [result, wasReady] = await this.#queryDBOrCache(
      conn, sql, paramValArr, route, maxAge, noCache, lastUpToDate, node, env,
      routesToEvict,
    )

    // Release the connection again.
    this.#releaseMainDBConn(conn);

    // Return the result and/or wasReady boolean.
    return [result, wasReady];
  }


  async #queryDBOrCache(
    conn, sql, paramValArr, route, maxAge, noCache, lastUpToDate, node, env,
    routesToEvict,
  ) {
    maxAge = maxAge ? maxAge : 60000;

    // If noCache is falsy, look in the cache first.
    let result, cachedAt, lastUpdated, now;
    if (!noCache) {
      payGas(node, env, {cacheRead: 1});
      now = Date.now();
      [result, cachedAt, lastUpdated] = mainDBCache.get(route) ?? [];
      if (result !== undefined) {
        // If the resource was cached, check if it is still considered fresh
        // by the client, and if so, either return the result, or if the
        // resource was also stored in the client's cache, with a lastUdToDate
        // time greater than the time that the resource was first cached on the
        // server (since it was last evicted), simply return wasReady = true.
        let isFresh = now - lastUpdated <= maxAge;
        if (isFresh) {
          let wasReady = lastUpToDate && cachedAt <= lastUpToDate;
          if (wasReady) {
            return [undefined, wasReady];
          } else {
            return [result];
          }
        }
        // Else if not fresh, we still continue to query the DB.
      }
    }

    // Query the database for the result. (TODO: Make the dbRead cost depend on
    // the size of the result list, perhaps divided by 1000, or something like
    // that, and then rounded up.)
    payGas(node, env, {dbRead: 1});
    result = await conn.queryRowsAsArray(sql, paramValArr);

    // If noCache is not truthy, we also update the cache.
    if (!noCache) {
      payGas(node, env, {cacheWrite: 1});
      cachedAt ??= now;
      lastUpdated = now;
      mainDBCache.set(route, [result, cachedAt, lastUpdated]);
    }

    // If routesToEvict is defined, it means that the query modifies the
    // database, and therefore should also evict previously stored results in
    // the cache (at least when the query is expected to potentially out-date
    // some cache entries).
    if (routesToEvict) {
      if (!noCache) throw (
        "ServerQueryHandler.queryServerOrCache(): routesToEvict must not be " +
        "used with a falsy noCache"
      )
      routesToEvict.forEach(route => {
        // If a route entry in the array is not a string, treat it as a route--
        // removeExtensions pair, where if removeExtensions is true, it means
        // that all routes that are extensions of route should also be removed.
        let removeExtensions = false; 
        if (typeof route !== "string") {
          [route, removeExtensions] = route;
        }
        if (removeExtensions) {
          mainDBCache.removeExtensions(route);
        }
        mainDBCache.remove(route);
      });
    }

    // Then we return the result (with a falsy wasReady).
    return [result];
  }


}





    // else if (
    //   /^\/[1-9][0-9]*\/[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*\.bbs\?/.test(route)
    // ) {
    //   let dirID = route.substring(1, route.indexOf("/", 1));
    //   let indOfQMark = route.indexOf("?");
    //   let filePath = route.substring(dirID.length + 2, indOfQMark);
    //   let queryString = route.substring(indOfQMark + 1);
    //   let queryObj = querystring.parse(queryString);

    //   if (queryObj.get === "entry") {
    //     let {elemKey = null} = queryObj;

    //     let paramValArr = [dirID, filePath, elemKey];
    //     let sql = "CALL readBinScoredBinKeyStructEntry (?, ?, ?)";
  
    //     let conn = new MainDBConnection();
    //     let [elemScore, elemPayload] =
    //       (await conn.query(sql, paramValArr))[0] ?? [];
    //     conn.end();
  
    //     return [elemScore, elemPayload];
    //   }
    //   else if (queryObj.get === "list") {
    //     let {
    //       lo = null, hi = null, offset = 0, maxNum = DEFAULT_LIST_MAX_NUM,
    //       isAsc = 0
    //     } = queryObj;

    //     let paramValArr = [dirID, filePath, lo, hi, offset, maxNum, isAsc];
    //     let sql = "CALL readBinScoredBinKeyStructList (?, ?, ?, ?, ?, ?, ?)";
  
    //     let conn = new MainDBConnection();
    //     let keyScorePayloadList = await conn.query(sql, paramValArr);
    //     conn.end();
  
    //     return keyScorePayloadList;
    //   }
    //   else if (queryObj.get === "keyList") {
    //     let {
    //       lo = null, hi = null, offset = 0, maxNum = DEFAULT_LIST_MAX_NUM,
    //       isAsc = 0
    //     } = queryObj;

    //     let paramValArr = [dirID, filePath, lo, hi, offset, maxNum, isAsc];
    //     let sql =
    //       "CALL readBinScoredBinKeyStructKeyOrderedList (?, ?, ?, ?, ?, ?, ?)";
  
    //     let conn = new MainDBConnection();
    //     let keyScorePayloadList = await conn.query(sql, paramValArr);
    //     conn.end();
  
    //     return keyScorePayloadList;
    //   }
    //   else {
    //     throw new ClientError(
    //       `Unrecognized "get" value for .bbs files: ${queryObj.get}`
    //     );
    //   }
    // }