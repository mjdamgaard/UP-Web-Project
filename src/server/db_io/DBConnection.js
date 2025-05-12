
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
