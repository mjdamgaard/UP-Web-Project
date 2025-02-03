
import {dbConnectionOptions} from "./sdb_config";

class DBConnector {

  static getConnection() {
    var conn = mysql.createConnection(connOptions);

    return conn.connect((err) => {
      if (err) throw err;
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