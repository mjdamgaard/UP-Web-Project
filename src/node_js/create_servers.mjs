
import * as http from 'http';
import {query_handler} from './query_handler.mjs';
import {insert_handler} from './insert_handler.mjs';
import * as mysql from 'mysql';

http.createServer(query_handler).listen(8080);
http.createServer(insert_handler).listen(8081);
