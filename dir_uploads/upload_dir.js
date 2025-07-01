
import * as process from 'process';
import path from 'path';
import {read} from 'read';

import {DirectoryUploader} from './src/DirectoryUploader.js';


// Get the directory path from the arguments, and combine it with __dirname if
// it is a relative path.
let [ , curPath, dirPath, ...options] = process.argv;
if (!dirPath) throw (
  "Specify dirPath in '$ node <program path> <dirPath> [DELETE_DATA]'"
);
if (dirPath[0] === ".") {
  dirPath = path.normalize(path.dirname(curPath) + "/" + dirPath);
}
let deleteTableData = options[0] === "DELETE_DATA";

async function main() {
  // Prompt for the user's authentication token, then request the new directory.
  let authToken = await read({prompt: "Token: ", silent: true});
  console.log("");

  // Create/update the directory on the server side.
  await DirectoryUploader.uploadDir(dirPath, authToken, deleteTableData);
};


main().then(() => {
  console.log("OK");
}).catch(err => {
  console.error(err);
});
