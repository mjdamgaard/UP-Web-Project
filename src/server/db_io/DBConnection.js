
import mysql from 'mysql2/promise';
import {mainDBConnectionOptions, userDBConnectionOptions} from "./db_config.js";


export class DBConnection {

  constructor(connectionOptions) {
    this.connPromise = mysql.createConnection(connectionOptions);
  }

  async end() {
    // Get the connection, then close it.
    let conn = await this.connPromise;
    conn.end();
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



  // async queryRow(procName, paramValArr) {
  //   let [row = []] = await this.queryList(procName, paramValArr);
  //   return row;
  // }

  // async queryValue(procName, paramValArr) {
  //   let [val = null] = await this.queryRow(procName, paramValArr);
  //   return val;
  // }



  async startTransaction() {
    let conn = await this.connPromise;
    await conn.query({sql: "START TRANSACTION"});
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
      {sql: "GET_LOCK(?, ?)", rowsAsArray: true}, [name, time]
    );console.log("rowArr=", rowArr); // Check that rowArr[0] is the correct boolean value.
    return rowArr[0];
  }
  async releaseLock(name) {
    let conn = await this.connPromise;
    let [[rowArr = []]] = await conn.query(
      {sql: "RELEASE_LOCK(?)", rowsAsArray: true}, [name]
    );
    return rowArr[0];
  }

  isReadyPromise() {
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
    super(mainDBConnectionOptions);
  }
}

export class UserDBConnection extends DBConnection {
  constructor() {
    super(userDBConnectionOptions);
  }
}
