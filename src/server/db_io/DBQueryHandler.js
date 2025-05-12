
import * as querystring from 'querystring';

import {MainDBConnection, getProcCallSQL} from "./DBConnection.js";
import {payGas} from '../../interpreting/ScriptInterpreter.js';


const mainDBCache = {get: () => {}, set: () => {}, "placeholder": true};


export class DBQueryHandler {

  // #getMainDBConn() and #releaseMainDBConn() can be modified if we want to
  // implement/use a connection pool.
 
  static #getMainDBConn() {
    return new MainDBConnection();
  }

  static #releaseMainDBConn(conn) {
    conn.end();
  }


  // queryDBProcOrCache() handles a lot of common queries, namely ones that
  // is implemented via a single DB procedure, and where the whole result is
  // stored directly at the route in the cache, or simply not cached at all,
  // namely when the noCache parameter is truthy.
  static async queryDBProcOrCache(
    procName, paramValArr, node, env, route, maxAge, noCache, lastUpToDate
  ) {
    // Get a connection the the main DB.
    let conn = DBQueryHandler.#getMainDBConn();

    // Generate the SQL (with '?' placeholders in it).
    let sql = getProcCallSQL(procName, paramValArr.length);
  
    // Query the DB or the cache.
    let [result, wasReady] = await this.#queryDBOrCache(
      conn, sql, paramValArr, node, env, route, maxAge, noCache, lastUpToDate
    )

    // Release the connection again.
    DBQueryHandler.#releaseMainDBConn(conn);

    // Return the result and/or wasReady boolean.
    return [result, wasReady];
  }


  static async #queryDBOrCache(
    conn, sql, paramValArr, node, env, route, maxAge, noCache, lastUpToDate
  ) {
    maxAge = maxAge ? maxAge : 60000;

    // If noCache is not true, look in the cache first.
    let result, cachedAt, lastUpdated, now;
    if (!noCache) {
      payGas(node, env, {cacheRead: 1});
      now = Date.now();
      [result, cachedAt, lastUpdated] = mainDBCache.get(route);
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

    // Query the database for the result.
    payGas(callerNode, callerEnv, {dbRead: 1});
    result = await conn.queryRowsAsArray(sql, paramValArr);

    // If noCache is not truthy, we also update the cache, before returning the
    // result.
    if (!noCache) {
      payGas(node, env, {cacheWrite: 1});
      cachedAt = cachedAt ? cachedAt : now;
      lastUpdated = now;
      mainDBCache.set(route, [result, cachedAt, lastUpdated]);
    }
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