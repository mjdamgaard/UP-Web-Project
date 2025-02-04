
import mysql from 'mysql2/promise';
import {dbConnectionOptions} from "./sdb_config.js";



export class DBConnector {

  static async connect() {
    return await mysql.createConnection(dbConnectionOptions);
  }



  static async connectAndQuery(sql, paramValArr) {
    let con = await this.connect();

    // TODO: Make a cache (as a global, above this class declaration) of open
    // connections, indexed with the pre-formatted sql string, perhaps with a
    // recurring event to handle then, and close and remove them before they
    // time out (if that is a problem), and then look up that cache here,
    // instead of creating a new connection each time. Also use prepared
    // statements for each of these connections.

    // Insert values into SQL query string.
    sql = con.format(sql, paramValArr);
    
    // Query the database and get the results table as a multidimensional array. 
    let options = {sql: sql, rowsAsArray: true};
    let [results, fields] = await con.query(options, paramValArr);
    return [results, fields];
  }
}


// return new Promise((resolve, reject) => {
//   con.connect((err) => {
//     if (err) reject(err);
//     else resolve(con);
//   });
// });

// conn.connect(function(err) {
//   if (err) throw err;
//   let sql = 'CALL logMsg("Hello from query handler")';
//   conn.query(sql, function (err, result) {
//     if (err) throw err;
//   });
// });