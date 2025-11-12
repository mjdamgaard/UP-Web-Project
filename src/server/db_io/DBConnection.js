
import mysql from 'mysql2/promise';
import {mainDBConnectionOptions, userDBConnectionOptions} from "./config.js";

const mainDBConnectionPool  = mysql.createPool({
  ...mainDBConnectionOptions,
  waitForConnections: true,
  connectionLimit: 350,
});
const userDBConnectionPool  = mysql.createPool({
  ...userDBConnectionOptions,
  waitForConnections: true,
  connectionLimit: 150,
});



export class DBConnection {

  constructor(connectionPool) {
    this.connPromise = connectionPool.getConnection();
    this.hasOngoingTransaction = false;
    this.hasAcquiredLocks = false;
    this.hasEnded = false;
  }

  async end() {
    // Get the connection, then close it, also making sure to roll back any
    // ongoing transaction, and releasing all locks held by the connection.
    this.hasEnded = true;
    let conn = await this.connPromise;
    if (this.hasOngoingTransaction) await this.rollback(true);
    if (this.hasAcquiredLocks) await this.releaseAllLocks(true);
    conn.release();
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
    if (this.hasEnded) return;
    this.hasOngoingTransaction = true;
    let conn = await this.connPromise;
    await conn.query({sql: "START TRANSACTION"});
    this.hasOngoingTransaction = true;
  }

  async commit() {
    if (this.hasEnded) return;
    this.hasOngoingTransaction = false;
    let conn = await this.connPromise;
    await conn.query({sql: "COMMIT"});
  }

  async rollback(calledByEnd = false) {
    if (this.hasEnded && !calledByEnd) return;
    this.hasOngoingTransaction = false;
    let conn = await this.connPromise;
    await conn.query({sql: "ROLLBACK"});
  }

  async getLock(name, time = 10) {
    if (this.hasEnded) return;
    this.hasAcquiredLocks = true;
    let conn = await this.connPromise;
    let [[rowArr = []]] = await conn.query(
      {sql: "SELECT GET_LOCK(?, ?)", rowsAsArray: true}, [name, time]
    );
    this.hasAcquiredLocks = true;
    return rowArr[0];
  }

  async releaseLock(name) {
    if (this.hasEnded) return;
    let conn = await this.connPromise;
    let [[rowArr = []]] = await conn.query(
      {sql: "SELECT RELEASE_LOCK(?)", rowsAsArray: true}, [name]
    );
    return rowArr[0];
  }

  async releaseAllLocks(calledByEnd = false) {
    if (this.hasEnded && !calledByEnd) return;
    this.hasAcquiredLocks = false;
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
