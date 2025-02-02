
import * as mysql from 'mysql';

export function query_handler(req, res) {


  var conn = mysql.createConnection({
    host: "localhost",
    database: "sdb",
    user: "mads",
    password: "lemmein",
  });

  conn.connect(function(err) {
    if (err) throw err;
    let sql = 'CALL logMsg("Hello from query handler")';
    conn.query(sql, function (err, result) {
      if (err) throw err;
    });
  });

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello World!');
}