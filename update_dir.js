
import * as process from 'process';
import path from 'path';
import {read} from 'read';

import {DirectoryUpdater} from './updating/DirectoryUpdater.js';

let directoryUpdater = new DirectoryUpdater();

let hasExited = false;

// Get the current path and the path to the UP directory from the arguments,
// and combine them if the latter is a relative path. Also get a third 'domain'
// argument, which determines to where the data is uploaded. If wanting to
// upload to a server on your localhost, install following the ./install.md
// instructions, then domain should be "localhost" (or undefined, as this is
// the also default), and if wanting to upload to e.g. up-web.org, domain
// should be set as "up-web.org".
let [ , curPath, dirPath, domain = "localhost"] = process.argv;
if (!dirPath) throw (
  "Specify dirPath in '$ node <program path> <dirPath>'"
);
if (domain !== "localhost" && domain !== "up-web.org") throw (
  "Unrecognized domain: " + domain
);
if (dirPath[0] === ".") {
  dirPath = path.normalize(path.dirname(curPath) + "/" + dirPath);
}
if (dirPath.at(-1) === "/" || dirPath.at(-1) === "\\") {
  dirPath = dirPath.slice(0, -1);
}
directoryUpdater.setDomain(domain);


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
    "'delete' for deleting table data, or 'e' for exit."
  );
  let hasExited = false;
  while(!hasExited) {
    let command = await read({prompt: `dir #${dirID}> `});
    // TODO: For the 'u' command, create a file with a list of file paths and
    // timestamps for when the files have last been uploaded, and then use that
    // file to skip uploading files that have not been modified since the last
    // timestamp.
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
      // TODO: More urgent: Implement a -data and -flags option as well to
      // supply postData and flags (as JSON objects) to the command. 
      console.log("Usage: ~# relative_route [--log] [-d JSON_data] [-f flags]");
      // TODO:  Implement the -d and -f options.
      let answer = await read({prompt: `~# `});
      let [relativeRoute, ...options] = answer.split(/ +/);
      let returnLog = options.includes("--log");
      let postDataFilePath = undefined;
      console.log("Posting...");
      let result;
      try {
        result = await directoryUpdater.post(
          dirID, relativeRoute, returnLog, dirPath, postDataFilePath
        );
      } catch (err) {
        console.error(err);
        continue;
      }
      if (returnLog) {
        let log;
        [result, log] = result;
        if (log.error) {
          console.log("Post request failed with error:");
          console.error(log.error);
        }
        else {
          console.log("Post request returned with result:");
          console.log(result);
        }
        console.log("And log:");
        (log.entries ?? []).forEach(entry => console.log(...entry));
        console.log(" ");
      }
      else {
        console.log("Post request returned with result:");
        console.log(result);
      }
    }
    else if (/^([fF]|fetch)$/.test(command)) {
      let answer = await read({prompt: `~# `});
      let [relativeRoute, ...options] = answer.split(/ +/);
      let returnLog = options.includes("--log");
      console.log("Fetching...");
      let result;
      try {
        result = await directoryUpdater.fetch(dirID, relativeRoute, returnLog);
      } catch (err) {
        console.error(err);
        continue;
      }
      if (returnLog) {
        let log;
        [result, log] = result;
        if (log.error) {
          console.log("Fetch request failed with error:");
          console.error(log.error);
        }
        else {
          console.log("Fetch request returned with result:");
          console.log(result);
        }
        console.log("And log:");
        (log.entries ?? []).forEach(entry => console.log(...entry));
      }
      else {
        console.log("Fetch request returned with result:");
        console.log(result);
      }
    }
    else if (/^delete$/.test(command)) {
      let relativePath = await read({prompt: `Path of file(s) to delete: `});
      await directoryUpdater.deleteData(dirID, relativePath, read);
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
