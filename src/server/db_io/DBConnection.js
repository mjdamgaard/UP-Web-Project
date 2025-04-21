
import mysql from 'mysql2/promise';
import {mainDBConnectionOptions, userDBConnectionOptions} from "./db_config.js";



export class DBConnection {

  constructor(connectionOptions) {
    this.connPromise = mysql.createConnection(connectionOptions);
  }

  async query(sql, paramValArr) {
    // Get the connection.
    let conn = await this.connPromise;

    // Query the database and get the results table as a multidimensional array. 
    let options = {sql: sql, rowsAsArray: true};
    let [[results]] = await conn.query(options, paramValArr);
    return results ?? [];
  }

  async end() {
    // Get the connection, then close it.
    let conn = await this.connPromise;
    conn.end();
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
