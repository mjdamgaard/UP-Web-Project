
import * as http from 'http';
const path = require('node:path');

import {serverURL} from './src/config.js';

// Get the directory path from the arguments, and combine it with __dirname if
// it is a relative path.
let [dirPath] = process.argv;
if (dirPath[0] === ".") {
  dirPath = path.normalize(__dirname + "/" + dirPath);
}


