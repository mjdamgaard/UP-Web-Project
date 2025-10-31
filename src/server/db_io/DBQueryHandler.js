
import {MainDBConnection, getProcCallSQL} from "./DBConnection.js";
import {ArgTypeError, NetworkError} from '../../interpreting/ScriptInterpreter.js';
import {Connection} from "../../dev_lib/db_connection/connection.js";



export class DBQueryHandler {

  // #getMainDBConn() and #releaseMainDBConn() can be modified if we want to
  // implement/use a connection pool.
 
  getConnection() {
    return new MainDBConnection();
  }

  releaseConnection(conn) {
    conn.end();
  }


  // queryDBProc() handles queries that is implemented via a single stored DB
  // procedure.
  async queryDBProc(procName, paramValArr, route, {connection}, node, env) {
    // TODO: route is unused as of yet, but will be used if/when we implement
    // a server-side cache, which we might do at some point.
    route = route; 

    // Get a connection the the main DB, if one is not provided as part of
    // options.
    let conn;
    if (connection) {
      if (!(connection instanceof Connection)) throw new ArgTypeError(
        "Connection option is not a valid instance of the Connection class",
        node, env
      );
      conn = connection.conn;
    }
    else {
      conn = this.getConnection();
    }

    // Generate the SQL (with '?' placeholders in it).
    let sql = getProcCallSQL(procName, paramValArr.length);
  
    let result;
    try {
      result = await conn.queryRowsAsArray(sql, paramValArr);
    } catch (err) {
      console.error(err);
      throw new NetworkError(
        "Database query failed internally",
        node, env
      );
    }

    // Release the connection again if it was not provided through options.
    if (!connection) {
      this.releaseConnection(conn);
    }

    // Return the result.
    return result;
  }



}

