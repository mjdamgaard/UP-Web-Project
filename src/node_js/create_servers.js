
import * as http from 'http';
import {query_handler} from './query_handler.js';
import {insert_handler} from './insert_handler.js';
import {Error, endWithError, endWithInternalError} from './err/errors.js';

// console.log(String({toString: null}))

http.createServer(async function(req, res) {
  try {
    await query_handler(req, res);

  } catch (err) {
    if (err instanceof Error) {
      endWithError(res, err);
    } else {
      endWithInternalError(res, err);
    }
  }
}).listen(8080);

http.createServer(async function(req, res) {
  try {
    await insert_handler(req, res);

  } catch (err) {
    if (err instanceof Error) {
      endWithError(res, err);
    } else {
      endWithInternalError(res, err);
    }
  }
}).listen(8081);
