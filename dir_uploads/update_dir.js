
import * as process from 'process';
import path from 'path';
import {read} from 'read';

import {DirectoryUpdater} from './DirectoryUpdater.js';

let directoryUpdater = new DirectoryUpdater();

let hasExited = false;

// Get the directory path from the arguments, and combine it with __dirname if
// it is a relative path.
let [ , curPath, dirPath, ...options] = process.argv;
if (!dirPath) throw (
  "Specify dirPath in '$ node <program path> <dirPath>'"
);
if (dirPath[0] === ".") {
  dirPath = path.normalize(path.dirname(curPath) + "/" + dirPath);
}

async function main() {
  // Prompt for the user's username and password, then try to log in, and on
  // success, prompt the user about how they want to update the directory.
  let username = await read({prompt: "Username: "});
  let password = await read({prompt: "Password: ", silent: true});
  console.log("");

  // Create/update the directory on the server side.
  let userID = await directoryUpdater.login(username, password);
  let dirID = directoryUpdater.readDirID(dirPath) ?? "";
  if (!userID) {
    console.log("Login failed.");
    return;
  }
  console.log(`Logged in with user #${userID}, and directory #${dirID}.`);
  console.log(
    "Type 'u' for upload, 'b' for bundle, 'p' for post, 'f' for fetch, " +
    "'d' for delete data, or 'e' for exit."
  );
  let hasExited = false;
  while(!hasExited) {
    let command = await read({prompt: `dir #${dirID}> `});
    if (/^([uU]|upload)$/.test(command)) {
      console.log("Uploading...");
      try {
        dirID = await directoryUpdater.uploadDir(userID, dirPath, dirID);
      } catch (err) {
        console.error(err);
        continue;
      }
      console.log("Success");
    }
    else if (/^([bB]|bundle)$/.test(command)) {
      console.log("Bundling not implemented yet.");
    }
    else if (/^([pP]|post)$/.test(command)) {
      // TODO: Implement syntax to append a file path after the request route,
      // which should lead to a file containing the postData for the request.
      let relativeRoute = await read({prompt: `~# `});
      let postDataFilePath = undefined;
      console.log("Posting...");
      let result;
      try {
        result = await directoryUpdater.post(
          dirID, relativeRoute, dirPath, postDataFilePath
        );
      } catch (err) {
        console.error(err);
        continue;
      }
      console.log("Post request returned with result:");
      console.log(result);
    }
    else if (/^([fF]|fetch)$/.test(command)) {
      let relativeRoute = await read({prompt: `~# `});
      console.log("Fetching...");
      let result;
      try {
        result = await directoryUpdater.fetch(dirID, relativeRoute);
      } catch (err) {
        console.error(err);
        continue;
      }
      console.log("Fetch request returned with result:");
      console.log(result);
    }
    else if (/^([dD]|delete)$/.test(command)) {
      let relativePath = await read({prompt: `Path of file(s) to delete: `});
      await directoryUpdater.deleteData(dirID, relativePath);
    }
    else if (/^([eE]|exit)$/.test(command)) {
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
