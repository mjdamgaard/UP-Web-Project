
import * as process from 'process';
import path from 'path';
import {read} from 'read';

import {DirectoryUploader} from './src/DirectoryUploader.js';

let directoryUploader = new DirectoryUploader();

let hasExited = false;

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
  // Prompt for the user's username and password, then try to log in and on
  // success prompt the user if they want to (re-)upload directory.
  let username = await read({prompt: "Username: "});
  let password = await read({prompt: "Password: ", silent: true});
  console.log("");

  // Create/update the directory on the server side.
  let userID = await directoryUploader.login(username, password);
  let dirID = await directoryUploader.getReadDirID(dirPath) ?? "";
  if (!userID) {
    console.log("Login failed.");
    return;
  }
  console.log(`Logged in with user #${userID}, and directory #${dirID}.`);
  console.log(
    "Type 'u' for upload, or 'e' for exit."
  );
  if (deleteTableData) {
    console.log(
      "CAUTION: The DELETE_DATA option was chosen, meaning that all table " +
      "data will be deleted at every upload. If this is not desired, exit " +
      "program and remove the DELETE_DATA option from the command."
    );
  }
  let hasExited = false;
  while(!hasExited) {
    let inst = await read({prompt: `dir #${dirID}> `});
    if (/^([uU]|upload)$/.test(inst)) {
      console.log("Uploading...");
      try {
        dirID = await directoryUploader.uploadDir(
          dirPath, dirID, deleteTableData
        );
      } catch (err) {
        console.error(err);
        continue;
      }
      console.log("OK");
    }
    else if (/^([eE]|exit)$/.test(inst)) {
      hasExited = true;
    }
    else {
      console.log("Unrecognized command.");
    }
  }
};


main().then(() => {
  console.log("Bye");
}).catch(err => {
  if (!hasExited) {
    console.error(err);
  }
});
