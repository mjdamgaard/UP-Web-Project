
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


  async queryList(procName, paramValArr) {
    // Generate the sql from the procedure name and the paramValArr.
    let sql = "CALL " + procName + " (" +
      paramValArr.map(() => "?").join(", ") + ")";
  
    let list = await this.queryRowsAsArray(sql, paramValArr);
    return list;
  }

  async queryRow(procName, paramValArr) {
    let [row = []] = await this.queryList(procName, paramValArr);
    return row;
  }

  async queryValue(procName, paramValArr) {
    let [val = null] = await this.queryRow(procName, paramValArr);
    return val;
  }



  static async querySingleList(procName, paramValArr) {
    let conn = new MainDBConnection();
    let list = await conn.queryList(sql, paramValArr);
    conn.end();
    return list;
  }

  async querySingleRow(procName, paramValArr) {
    let conn = new MainDBConnection();
    let row = await conn.queryRow(sql, paramValArr);
    conn.end();
    return row;
  }

  async querySingleValue(procName, paramValArr) {
    let conn = new MainDBConnection();
    let val = await conn.queryValue(sql, paramValArr);
    conn.end();
    return val;
  }

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
