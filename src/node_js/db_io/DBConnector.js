
import * as mysql from 'mysql2';
import {dbConnectionOptions} from "./sdb_config";



export class DBConnector {

  static getConnectionPromise() {
    var conn = mysql.createConnection(connOptions);

    return new Promise((resolve, reject) => {
      conn.connect((err) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });
  }



  static queryAndGetResultsPromise(conn, sql, paramValArr) {
    // Insert values into SQL query string.
    sql = conn.format(sql, paramValArr);
    // 
    let options = {sql: sql, rowsAsArray: true};
    conn.query(options, (err, results) => {
      // ...
    });
  }
}



// conn.connect(function(err) {
//   if (err) throw err;
//   let sql = 'CALL logMsg("Hello from query handler")';
//   conn.query(sql, function (err, result) {
//     if (err) throw err;
//   });
// });