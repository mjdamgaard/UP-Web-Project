
import * as process from 'process';
import path from 'path';
import {read} from 'read';
import fs from 'fs';

import {DirectoryUpdater} from './updating/DirectoryUpdater.js';

// Get the current path and use it to construct the path to the up_directories
// directory. Also get a second 'domain' argument, which determines to where
// the data is uploaded.
const [ , curPath, domain, ...optArgs] = process.argv;
if (domain !== "localhost" && domain !== "up-web.org") throw (
  "Unrecognized domain: " + domain
);
const upDirectoriesPath = path.normalize(
  path.dirname(curPath) + "/up_directories"
);

// Initialize the DirectoryUpdater instance.
const directoryUpdater = new DirectoryUpdater(upDirectoriesPath, domain);


// Construct plain object with optional argument values.
const optArgObj = {};
let optArgsLen = optArgs.length;
for (let i = 0; i < optArgsLen; i++) {
  let flag = optArgs[i];

  // transform abbreviations.
  if (flag[0] === "-" || flag[1] !== "-") {
    switch (flag) {
      case "-d": flag = "--directory"; break;
      case "-u": flag = "--user"; break;
      default: throw (
        'Unrecognized optional argument "' + flag + '". Expected a flag ' +
        'starting with "-".'
      );
    }
  }

  if (flag.slice(0, 2) !== "--" || flag.length <= 2) throw (
    'Unrecognized optional argument "' + flag + '". Expected a flag ' +
    'starting with "-" or "--".'
  );

  // Branch according to the flag and set flagArgs accordingly.
  let flagArg;
  switch (flag) {
    // Handle all boolean flags.
    case "": // (Can be replaced with a list of actual flag names.)
      flagArg = true;
    break;

    // Handle all single-argument flags.
    case "--directory":
    case "--user":
      flagArg = optArgs[++i];
    break;

    default: throw (
      'Unrecognized flag "' + flag + '".'
    );
  }
  
  // Add optional argument to optArgObj.
  optArgObj[flag.substring(2)] = flagArg;
}



let curDir = false;

async function main() {
  // Prompt for the user's username and password, then try to log in.
  let username = optArgObj["user"];
  if (!username) {
    username = await read({prompt: "Username: "});
  }
  let password = await read({prompt: "Password: ", silent: true});
  console.log("");
  let userID = await directoryUpdater.login(username, password);
  if (!userID) {
    console.log("Login failed");
    return;
  }
  console.log(`Logged in with user #${userID}`);

  // If the -d/--directory flag is set, change curDir to that directory name.
  let initDir = optArgObj["directory"];
  if (initDir) {
    curDir = initDir;
  }
  if (curDir) {
    curDir = getValidatedDirectoryNameOrUndefined(curDir);
  }

  // Read the ID of the current directory, if any is provided, and if curDir is
  // not equal to "all", in which which the user can choose to upload to all
  // directories at the same time (if they are not marked as "foreign" in
  // directories.json).
  let dirID = false;
  if (curDir && curDir !== "all") {
    dirID = directoryUpdater.getDirID(curDir, false);
    console.log(`Current directory: ${curDir}`);
  }
  if (curDir === "all") {
    let ownDirectories = directoryUpdater.getOwnDirectoriesArray();
    console.log("Current directories: \n- " + ownDirectories.join(",\n- "));
  }
  if (dirID) {
    console.log(`Directory ID: ${dirID}`);
  }
  else {
    console.log(`Directory has not yet been uploaded`);
  }

  // Show command options at the start.
  let commandOptionsText =
    "Type 'u' for upload, 'b' for bundle, 'p' for post, 'f' for fetch, " +
    "'delete' for deleting table data, 'cd' for changing directory, " +
    "or 'e' for exit.";
  console.log(commandOptionsText);

  let hasExited = false;
  while(!hasExited) {
    let command = await read({prompt: `${curDir ? curDir : ""}> `});
    if (/^([uU]|upload)$/.test(command)) {
      if (!curDir) {
         console.log(
          "No directory selected. Use the 'cd' command to select a directory."
        );
        continue;
      }
      let dirNameArr = (curDir !== "all") ? [curDir] :
        directoryUpdater.getOwnDirectoriesArray();
      try {
        let len = dirNameArr.length;
        for (let i = 0; i < len; i++) {
          let dirName = dirNameArr[i];
          console.log("Uploading files in " + dirName + "...");
          await directoryUpdater.uploadDir(userID, dirName);
          console.log("Files in " + dirName + " was uploaded.");
          console.log("");
        }
      } catch (err) {
        console.error(err);
        continue;
      }
      console.log("Success");
    }
    // TODO: Instead of implementing a bundle command, I might implement a
    // command to just "hoist" all descendant imports of a module up to the
    // module itself. 
    // TODO: Also implement a 'compile' command which request the server to
    // compile a module into a dev library/module instead, where the JS(X) is
    // transformed into some safe JS instead (with variable re-namings and
    // added guard clauses, etc.). And maybe we'll reserve a special file
    // extension for these compiled modules, which means that the client can
    // import them in a way where the actual (safe) JS module is imported and
    // used (similar to importing a dev module).
    else if (/^([bB]|build|bundle)$/.test(command)) {
      console.log("Bundling not implemented yet");
    }
    else if (/^([pP]|post)$/.test(command)) {
      console.log("Usage: ~# relative_route [--log] [--data json_file]");
      let answer = await read({prompt: `~# `});
      let [relativeRoute, ...options] = answer.split(/ +/);

      let returnLog = options.includes("--log");
      let postDataFilePath = !options.includes("--data") ? undefined :
        options[options.indexOf("--data") + 1];
      if (postDataFilePath && postDataFilePath[0] === ".") {
        postDataFilePath = path.normalize(
          path.dirname(curPath) + "/" + postDataFilePath
        );
      }

      console.log("Posting...");
      let result;
      try {
        result = await directoryUpdater.post(
          curDir, relativeRoute, returnLog, postDataFilePath
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
        result = await directoryUpdater.fetch(curDir, relativeRoute, returnLog);
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
      try {
        await directoryUpdater.deleteData(curDir, relativePath, read);
      } catch (err) {
        console.error(err);
        continue;
      }
    }
    else if (/^(cd )/.test(command)) {
      let newDir = command.substring(3).trim();
      curDir = getValidatedDirectoryNameOrUndefined(newDir);
      if (curDir === "all") {
        let ownDirectories = directoryUpdater.getOwnDirectoriesArray();
        console.log("Current directories: \n- " + ownDirectories.join(",\n- "));
      }
      else {
        console.log(`Directory was changed to ${curDir}`);
        if (curDir) {
          let dirID = directoryUpdater.getDirID(curDir, false);
          if (dirID) {
            console.log(`Directory ID: ${dirID}`);
          }
          else {
            console.log(`Directory has not yet been uploaded`);
          }
        }
      }
    }
    else if (command === "rename directory") {
      let curDirName = await read({prompt: "Current directory name: "});
      let newDirName = await read({prompt: "New directory name: "});
      try {
        await directoryUpdater.renameDir(curDirName, newDirName);
        console.log(
          `Directory was renamed form "${prevDirName}" to "${newDirName}"`
        );
      } catch (err) {
        console.error(err);
        continue;
      }
    }
    else if (/^([hH]|help)$/.test(command)) {
      console.log(commandOptionsText);
    }
    else if (/^([eE]|exit)$/.test(command)) {
      hasExited = true;
    }
    // TODO: Add command to remove a whole directory server-side (while also
    // untracking it from directories.json), as well as a command just to
    // untrack an uploaded directory client-side (from directories.json).
    else {
      console.log("Unrecognized command");
    }
  }
};


function getValidatedDirectoryNameOrUndefined(dirName) {
  if (dirName === "all") {
    return dirName;
  }
  if (!/^[a-z-A-Z._-][a-z-A-Z0-9._-]*$/.test(dirName)) {
    console.log("Invalid directory name");
    return undefined;
  }
  if (/^[0-9a-fA-F]+$/.test(dirName)) {
      console.log(
        "Error: Directory name must include other symbols than [0-9a-f]."
      );
      return undefined;
  }
  if (!fs.existsSync(upDirectoriesPath + "/" + dirName)) {
    console.log(
      `Error: No directory of the name ${dirName} in ${upDirectoriesPath}.`
    );
    return undefined;
  }
  else {
    return dirName;
  }
}



let hasExited = false;

main().then(() => {
  console.log("Bye");
}).catch(err => {
  if (!hasExited) {
    console.error(err);
  }
});
