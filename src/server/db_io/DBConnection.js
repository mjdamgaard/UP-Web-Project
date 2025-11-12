
import {ConnectionPool} from "./ConnectionPool.js";
import {mainDBConnectionOptions, userDBConnectionOptions} from "./config.js";

const mainDBConnectionPool  = new ConnectionPool({
  ...mainDBConnectionOptions,
  waitForConnections: true,
  connectionLimit: 30,
});
const userDBConnectionPool  = new ConnectionPool({
  ...userDBConnectionOptions,
  waitForConnections: true,
  connectionLimit: 30,
});
// (We can hopefully increase the connectionLimits above at some point, but for
// now, I keep them low as to not risk the "ER_TOO_MANY_USER_CONNECTIONS"
// errors that I've otherwise gotten.)



export class DBConnection {

  constructor(connectionPool) {
    this.connectionPool = connectionPool;
    this.connPromise = connectionPool.getConnection();
  }

  async end() {
    // Get the connection, then close it.
    let conn = await this.connPromise;
    await this.connectionPool.releaseConnection(conn);
  }


  async queryRowsAsArray(sql, paramValArr) {
    // Get the connection.
    let conn = await this.connPromise;

    // Query the database and get the results table as a multidimensional array.
    let options = {sql: sql, rowsAsArray: true};
    let [[results = []]] = await conn.query(options, paramValArr);
    return results;
  }


  queryProcCall(procName, paramValArr) {
    // Generate the sql from the procedure name and the paramValArr.
    let sql = getProcCallSQL(procName, paramValArr.length);
    return this.queryRowsAsArray(sql, paramValArr);
  }



  async startTransaction() {
    let conn = await this.connPromise;
    await conn.query({sql: "START TRANSACTION"});
    this.hasOngoingTransaction = true;
  }

  async commit() {
    let conn = await this.connPromise;
    await conn.query({sql: "COMMIT"});
  }

  async rollback() {
    let conn = await this.connPromise;
    await conn.query({sql: "ROLLBACK"});
  }

  async getLock(name, time = 10) {
    let conn = await this.connPromise;
    let [[rowArr = []]] = await conn.query(
      {sql: "SELECT GET_LOCK(?, ?)", rowsAsArray: true}, [name, time]
    );
    this.hasAcquiredLocks = true;
    return rowArr[0];
  }

  async releaseLock(name) {
    let [[rowArr = []]] = await conn.query(
      {sql: "SELECT RELEASE_LOCK(?)", rowsAsArray: true}, [name]
    );
    return rowArr[0];
  }

  async releaseAllLocks() {
    let conn = await this.connPromise;
    let [[rowArr = []]] = await conn.query(
      {sql: "SELECT RELEASE_ALL_LOCKS()", rowsAsArray: true}, []
    );
    return rowArr[0];
  }

  get isReadyPromise() {
    return this.connPromise;
  }

}



export function getProcCallSQL(procName, paramNum = 0) {
  return (
    "CALL " + procName + " (" + Array(paramNum).fill("?").join(", ") + ")"
  );
}


export class MainDBConnection extends DBConnection {
  constructor() {
    super(mainDBConnectionPool);
  }
}

export class UserDBConnection extends DBConnection {
  constructor() {
    super(userDBConnectionPool);
  }
}
