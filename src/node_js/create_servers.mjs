
import * as http from 'http';
import * as query_handler from './query_handler.mjs';
import * as insert_handler from './insert_handler.mjs';
import * as mysql from 'mysql';

http.createServer(query_handler).listen(8080);
http.createServer(insert_handler).listen(8081);


var conn = mysql.createConnection({
  host: "localhost",
  database: "mydatabase",
  user: "mads",
  password: "lemmein"
});

conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});