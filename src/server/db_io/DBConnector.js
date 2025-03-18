
import mysql from 'mysql2/promise';
import {mainDBConnectionOptions, userDBConnectionOptions} from "./db_config.js";



export class DBConnector {

  constructor(connectionOptions) {
    this.connectionOptions = connectionOptions;
  }

  async connect() {
    return await mysql.createConnection(this.connectionOptions);
  }


  async connectAndQuery(sql, paramValArr) {

    // TODO: Maybe make a cache (as a global, above this class declaration) of
    // open connections, indexed with the pre-formatted sql string, perhaps
    // with a recurring event to handle then, and close and remove them before
    // they time out (if that is a problem), and then look up that cache here,
    // instead of creating a new connection each time. Also use prepared
    // statements for each of these connections.
    // (Before we do this, we can also use connection pools instead.)

    // Get connection.
    let conn = await this.connect();

    // Insert values into SQL query string.
    sql = conn.format(sql, paramValArr);
    
    // Query the database and get the results table as a multidimensional array. 
    let options = {sql: sql, rowsAsArray: true};
    let [[results]] = await conn.query(options, paramValArr);

    // Close the connection.
    conn.end();

    return results;
  }
}



export class MainDBConnector extends DBConnector {
  constructor() {
    super(mainDBConnectionOptions);
  }
}

export class UserDBConnector extends DBConnector {
  constructor() {
    super(userDBConnectionOptions);
  }
}
