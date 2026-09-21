
import {ServerQueryHandler} from '../src/server/ajax_io/ServerQueryHandler.js';

import fs from 'fs';
import fetch from 'node-fetch';


export class DirectoryUpdater {
  constructor(upDirectoriesPath, domain, authToken = undefined) {
    this.upDirectoriesPath = upDirectoriesPath;
    this.authToken = authToken;
    this.domain = domain;
    this.dirData = undefined;
    this.dirDataFileName = (domain === "localhost") ?
      "directories_local.json" :
      "directories.json";
    this.#readDirDataSync();
    this.timestamps = undefined;
    this.#readUploadTimestampsSync();
  }

  #readJSONFilePropertySync(fileName, propName) {
    // Read file and parse it.
    let filePath = this.upDirectoriesPath + "/" + fileName;
    if (!fs.existsSync(filePath)) {
      this[propName] = {};
      return;
    }
    let contents, propObj;
    try {
      contents = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      throw "Error when reading the " + fileName + " file";
    }
    try {
      propObj = JSON.parse(contents);
    } catch (err) {
      throw "Error when parsing " + fileName;
    }

    // Store the resulting object in the this[propName].
    this[propName] = propObj;
  }

  #writeJSONFilePropertySync(fileName, propName) {
    // Stringify the this[propName] object and write to the file.
    let filePath = this.upDirectoriesPath + "/" + fileName;
    let contents = JSON.stringify(this[propName], null, 2);
    fs.writeFileSync(filePath, contents);
  }


  #readDirDataSync() {
    return this.#readJSONFilePropertySync(this.dirDataFileName, "dirData");
  }
  #writeDirDataSync() {
    return this.#writeJSONFilePropertySync(this.dirDataFileName, "dirData");
  }

  #readUploadTimestampsSync() {
    return this.#readJSONFilePropertySync(".timestamps.json", "timestamps");
  }
  #writeUploadTimestampsSync() {
    return this.#writeJSONFilePropertySync(".timestamps.json", "timestamps");
  }



  getDirID(
    dirName, throwIfMissing = true, includeForeignDirs = false,
    domain = this.domain
  ) {
    // If dirName is falsy or equals "all", throw an error.
    if (!dirName || dirName === "all") throw (
      "No particular directory selected. (Use the 'cd' command " +
      "to select a directory, or restart the program using the \"-d\" option.)"
    );

    // Else read the dirID from the dirData.
    let dirID = (this.dirData[domain]?.ownDirectories ?? {})[dirName];
    if (!dirID && includeForeignDirs) {
      dirID = (this.dirData[domain]?.foreignDirectories ?? {})[dirName];
    }
    if (!dirID && throwIfMissing) throw (
      `No directory ID was found for "${dirName}" (domain = "${domain}") ` +
      "in directories.json"
    );
    return dirID;
  }

  #writeDirIDSync(dirName, dirID) {
    let domainEntry = this.dirData[this.domain] ??= {};
    let ownDirectories = domainEntry.ownDirectories ??= {};
    if (dirID) {
      ownDirectories[dirName] = dirID.toString();
    } else {
      delete ownDirectories[dirName];
    }
    this.#writeDirDataSync();
  }


  getOwnDirectoriesArray() {
    let ownDirectories = (this.dirData[this.domain] ?? {}).ownDirectories ?? {};
    return Object.keys(ownDirectories);
  }



  #isModifiedSince(relFilePath, timestamp) {
    let filePath = this.upDirectoriesPath + "/" + relFilePath;
    let lastModifiedAt = fs.statSync(filePath).mtimeMs;
    return lastModifiedAt > timestamp;
  }

  #isModifiedSinceLastUpload(relFilePath, dependsOnDirectoriesFile = false) {
    let timestamp = (this.timestamps[this.domain] ?? {})[relFilePath];
    if (!timestamp || this.#isModifiedSince(relFilePath, timestamp)) {
      return true;
    }
    else if (dependsOnDirectoriesFile) {
      return this.#isModifiedSince(this.dirDataFileName, timestamp);
    }
    else {
      return false;
    }
  }

  #updateUploadTimestampSync(relFilePath) {
    let domainEntry = this.timestamps[this.domain] ??= {};
    domainEntry[relFilePath] = Date.now();
    this.#writeUploadTimestampsSync();
  }

  #removeUploadTimestampSync(relFilePath) {
    let domainEntry = this.timestamps[this.domain] ?? {};
    delete domainEntry[relFilePath];
    this.#writeUploadTimestampsSync();
  }




  async login(username, password) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let [userID, authToken] = await serverQueryHandler.queryLoginServer(
      "login", undefined, {username: username, password: password}
    );
    this.authToken = authToken;
    return userID;
  }

  async createAccount(username, password, email = undefined) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let [userID, authToken] = await serverQueryHandler.queryLoginServer(
      "createAccount", email, {username: username, password: password}
    );
    this.authToken = authToken;
    return userID;
  }


  // uploadDir() first looks in 'directories.json' to get the directory ID,
  // and if none is found, it requests the server to create a new home
  // directory. Then it loops through all files of the directory at path and
  // uploads all that has a recognized file extension to the (potentially new)
  // server-side directory. Text files will generally be uploaded as is, while
  // files representing special database tables (with extensions such as
  // '.att', '.bt', and '.bbt') when "uploaded" will have the effect of
  // creating a corresponding relational table (effectively) server-side, if it
  // has not already been created before.
  // The file ~/path_map.js, if there, is treated in a special way, as it will
  // have certain placeholders replaced with node and directory IDs.
  async uploadDir(userID, curDir) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let nodeID = await serverQueryHandler.fetchNodeID();

    // If dirID is not found in directories.json, request the server to create
    // a new directory and get the new dirID, then write this dirID to the
    // directories.json file (and update this.dirData).
    let dirID = this.getDirID(curDir, false);
    if (!dirID) {
      dirID = await serverQueryHandler.post(`/this./mkdir/a/${userID}`);
      if (!dirID) throw "mkdir error";
      console.log("New directory was successfully created");
      console.log("Directory ID: " + dirID);
      this.#writeDirIDSync(curDir, dirID);
    }

    // Request a list of all the files in the server-side directory, and then
    // go through each one and check that it also exist nested in the client-
    // side directory, and for each one that doesn't, request deletion of that
    // file server-side. We do this be first constructing an array of functions
    // that generates a promise, and then we generate and wait for each promise
    // in sequence.  
    let filePaths = await serverQueryHandler.fetchAsAdmin(
      `/this/${dirID}./_all`
    );
    let deletionPromiseGenerators = [];
    let serverFilePathsToDelete = [];
    let curDirPath = this.upDirectoriesPath + "/" + curDir;
    filePaths.forEach(relPath => {
      let clientFilePath = curDirPath + "/" + relPath;
      let serverFilePath = normalizePath(`/${nodeID}/${dirID}/${relPath}`);
      if (!fs.existsSync(clientFilePath)) {
        // Push a promise to delete the file server-side, and delete the file's
        // timestamp upon return.
        deletionPromiseGenerators.push(
          () => serverQueryHandler.postAsAdmin(
            serverFilePath + "/_rm"
          ).then(x => {
            this.#removeUploadTimestampSync(curDir + "/" + relPath);
            return x;
          })
        );
        serverFilePathsToDelete.push(serverFilePath);
      }
    });
    let colorStr = "\x1b[31m%s\x1b[0m"; // red color
    let len = deletionPromiseGenerators.length;
    for (let i = 0; i < len; i++) {
      await deletionPromiseGenerators[i]();
      console.log(colorStr, "- Removed " + serverFilePathsToDelete[i]);
    }

    // Then call a helper method to recursively loop through all files in the
    // directory itself or any of its nested directories and uploads them,
    // pushing a promise for the response of each one to a
    // uploadPromiseGenerators array, which is then used to generate and wait
    // for each upload promise in sequence.
    let uploadPromiseGenerators = [];
    let serverFilePathBuffer = [];
    this.#uploadDirHelper(
      curDir, dirID, uploadPromiseGenerators, serverFilePathBuffer,
      serverQueryHandler, nodeID
    );
    let initServerFilePaths = filePaths.map(
      relPath => normalizePath(`/${nodeID}/${dirID}/${relPath}`)
    );
    len = uploadPromiseGenerators.length;
    for (let i = 0; i < len; i++) {
      await uploadPromiseGenerators[i]();
      let [serverFilePath, isTableFile] = serverFilePathBuffer[i];
      let wasCreated = !initServerFilePaths.includes(serverFilePath);
      let colorStr = wasCreated ?
        "\x1b[32m%s\x1b[0m" : // green color
        "\x1b[33m%s\x1b[0m"; // yellow color
      let initStr = isTableFile ? "- Touched " :
        wasCreated ? "- Created " : "- Modified ";
      console.log(colorStr, initStr + serverFilePath);
    }

    return dirID;
  }


  #uploadDirHelper(
    relClientPath, relServerPath, uploadPromiseGenerators,
    serverFilePathBuffer, serverQueryHandler, nodeID, depth = 0
  ) {
    // Get each file in the directory at path, and loop through and handle each
    // one according to its extension (or lack thereof).
    let absClientPath = this.upDirectoriesPath + "/" + relClientPath;
    let fileNames;
    try {
      fileNames = fs.readdirSync(absClientPath);
    } catch (_) {
      return;
    }
    fileNames.forEach(name => {
      let relChildClientPath = relClientPath + "/" + name;
      let relChildServerPath = relServerPath + "/" + name;
      let absChildClientPath = absClientPath + "/" + name;

      // If the file has no extensions, treat it as a folder, and call this
      // helper method recursively.
      if (/^\.*[^.]+$/.test(name)) {
        this.#uploadDirHelper(
          relChildClientPath, relChildServerPath, uploadPromiseGenerators,
          serverFilePathBuffer, serverQueryHandler, nodeID, depth + 1
        );
      }

      // Else if the file is a text file, upload it as is to the server. And if
      // in case of the ~/path_map.js file, also substitute its ID placeholders.
      else if (/\.(jsx?|mjs|txt|json|html|xml|svg|css|md)$/.test(name)) {
        let contentText = fs.readFileSync(absChildClientPath, 'utf8');
        // Consult .timestamps.json to see if the file should be skipped, and
        // if the the file is the special path_map.js file (at depth = 0),
        // then also check the the modifiedAt time for the directories.json
        // file. And in case of the path_map.js file, also transform the
        // file by substituting placeholders within it.
        let isPathMap = depth === 0 && name === "path_map.js";
        if (!this.#isModifiedSinceLastUpload(relChildClientPath, isPathMap)) {
          return;
        }
        if (isPathMap) {
          let errRef = [];
          contentText = this.#transformPathMapFileText(contentText, errRef);
          let [err] = errRef;
          if (err) {
            let colorStr = "\x1b[33m%s\x1b[0m"; // yellow color
            console.log(
              colorStr, "Warning: Not all placeholders in path_map.js file " +
              "was successfully substituted. Error: \n" + err + "."
            );
          }
        }

        // Push a promise to upload the file, and update the file's timestamp
        // upon return.
        uploadPromiseGenerators.push(
          () => serverQueryHandler.postAsAdmin(
            `/this/${relChildServerPath}./_put`,
            contentText,
          ).then(x => {
            this.#updateUploadTimestampSync(relChildClientPath);
            return x;
          })
        );
        serverFilePathBuffer.push([`/${nodeID}/${relChildServerPath}`, false]);
      }

      // Else if it is a database table file, simply touch the file server-side.
      else if (/\.(att|bt|ct|bbt|ftt)$/.test(name)) {
        if (!this.#isModifiedSinceLastUpload(relChildClientPath)) {
          return;
        }
        // Push a promise to touch the database table file (nothing happens if
        // the table already exists), and update the timestamp upon return.
        uploadPromiseGenerators.push(
          () => serverQueryHandler.postAsAdmin(
            `/this/${relChildServerPath}./_touch`
          ).then(x => {
            this.#updateUploadTimestampSync(relChildClientPath);
            return x;
          })
        );
        serverFilePathBuffer.push([`/${nodeID}/${relChildServerPath}`, true]);
      }
    });
  }

  #transformPathMapFileText(text, errRef = []) {
    return text.replaceAll(
      /\{\{([/.a-zA-Z0-9_-]+)\}((\/)?\{([a-zA-Z0-9_-]+)\})?\}/g,
      (match, domain, _tail, slash, dirName) => {
        let actualDomain = (domain === "this") ? this.domain : domain;
        let nodeID = this.dirData[actualDomain]?.nodeID;
        if (!nodeID) {
          errRef[0] ??= `No nodeID found for domain "${actualDomain}"`;
          return match;
        }
        if (dirName) {
          let dirID = this.getDirID(dirName, false, true, actualDomain);
          if (!dirID) {
            errRef[0] ??= `No directory ID found for "${dirName}" ` +
              `under domain "${actualDomain}"`;
            return match;
          }
          return slash ? nodeID + "/" + dirID : dirID;
        }
        else {
          return nodeID;
        }
      }
    );
  }




  async removeDir(curDir) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let nodeID = await serverQueryHandler.fetchNodeID();
    let dirID = this.getDirID(curDir, true);

    // Request a list of all the files in the server-side directory, and then
    // go through and delete each one of them.
    let filePaths = await serverQueryHandler.fetchAsAdmin(
      `/this/${dirID}./_all`
    );
    let deletionPromiseGenerators = [];
    let serverFilePathsToDelete = [];
    filePaths.forEach(relPath => {
      let serverFilePath = normalizePath(`/${nodeID}/${dirID}/${relPath}`);

      // Push a promise to delete the file server-side, and delete the file's
      // timestamp upon return.
      deletionPromiseGenerators.push(
        () => serverQueryHandler.postAsAdmin(
          serverFilePath + "/_rm"
        ).then(x => {
          this.#removeUploadTimestampSync(curDir + "/" + relPath);
          return x;
        })
      );
      serverFilePathsToDelete.push(serverFilePath);
    });
    let colorStr = "\x1b[31m%s\x1b[0m"; // red color
    let len = deletionPromiseGenerators.length;
    for (let i = 0; i < len; i++) {
      await deletionPromiseGenerators[i]();
      console.log(colorStr, "- Removed " + serverFilePathsToDelete[i]);
    }

    // Then remove the directory itself server-side, and remove directory entry
    // in directories.json.
    let wasRemoved = serverQueryHandler.postAsAdmin(`/${nodeID}/${dirID}./_rm`);
    if (!wasRemoved) {
      throw "Something went wrong when removing directory";
    }
    this.#writeDirIDSync(curDir, undefined);

    return dirID;
  }


  async untrackDir(curDir) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let nodeID = await serverQueryHandler.fetchNodeID();
    let dirID = this.getDirID(curDir, true);

    // Request a list of all the files in the server-side directory, and then
    // go through and remove their timestamps
    let filePaths = await serverQueryHandler.fetchAsAdmin(
      `/this/${dirID}./_all`
    );
    filePaths.forEach(relPath => {
      this.#removeUploadTimestampSync(curDir + "/" + relPath);
    });

    // Read and parse the untracked_directories.json file.
    let filePath = this.upDirectoriesPath + "/" +
      "untracked_" + this.dirDataFileName;
    let contents = (!fs.existsSync(filePath)) ? "{}" :
      fs.readFileSync(filePath, 'utf8');
    let propObj;
    try {
      propObj = JSON.parse(contents);
    } catch (err) {
      throw "Error when parsing " + fileName;
    }

    // Then push the dirID to an array located at propObj[nodeID][dirName].
    let dirNameDirIDArrObj = propObj[nodeID] ??= {};
    let dirIDArr = dirNameDirIDArrObj[curDir] ??= [];
    dirIDArr.push(dirID);
    let newContents = JSON.stringify(propObj, null, 2);
    fs.writeFileSync(filePath, newContents);

    // Then remove the dirID from directories.json.
    this.#writeDirIDSync(curDir, undefined);

    return dirID;
  }




  // deleteData(curDir, relativePath) deletes the table data at all table files
  // (i.e. .att, .bt, .ct, .bbt, or .ftt files) that is either equal to
  // "/<upNodeID>/<homeDirID>/<relativePath>", or extends this path if
  // relativePath ends in a '*' wildcard.
  async deleteData(curDir, relativePath, read) {
    relativePath = normalizePath(relativePath);
    if (relativePath.substring(0, 2) === "./") {
      relativePath = relativePath.substring(2);
    }
    let dirID = this.getDirID(curDir);
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let nodeID = await serverQueryHandler.fetchNodeID();

    // If no dirID was provided, fail.
    if (!dirID) {
      console.error("Failure: No dirID was provided");
      return;
    }

    // Request a list of all the files in the server-side directory, and then
    // go through each one and check if they match of relativePath, and are
    // table files (nothing happens to matched text files), and if so add them
    // to an array of serverFilePaths for data deletion.
    let filePaths = await serverQueryHandler.fetchAsAdmin(
      `/this/${dirID}./_all`
    );
    let serverFilePaths = [];
    let hasWildCard = relativePath.at(-1) === "*";
    if (hasWildCard) relativePath = relativePath.slice(0, -1);
    let relativePathLen = relativePath.length;
    filePaths.forEach((relPath) => {
      if (/\.(att|bt|ct|bbt|ftt)$/.test(relPath)) {
        let isMatch = hasWildCard ?
          relPath.substring(0, relativePathLen) === relativePath :
          relPath === relativePath;
        if (isMatch) {
          serverFilePaths.push(normalizePath(`/${nodeID}/${dirID}/${relPath}`));
        }
      }
    });
  
    // Let the user confirm that they want to delete the data at these paths.
    console.log("Matching table file paths are:")
    serverFilePaths.forEach(path => console.log(path));
    let confResponse = await read({
      prompt: 'Do you want to delete all data held in these tables? [y/n] '
    });
    if (/^[yY]$/.test(confResponse)) {
      let deletionPromiseGenerators = serverFilePaths.map(serverFilePath => (
        () => serverQueryHandler.postAsAdmin(serverFilePath + "/_put")
      ));
      let colorStr = "\x1b[31m%s\x1b[0m"; // red color
      let len = deletionPromiseGenerators.length;
      for (let i = 0; i < len; i++) {
        await deletionPromiseGenerators[i]();
        console.log(
          colorStr, "- Deleted data from " + serverFilePaths[i]
        );
      }
      console.log("Data successfully deleted");
    }
    else {
      console.log("Aborted");
    }
  }



  // post() posts a request with admin privileges. In particular, for a callSMF
  // request, if the SMF calls checkAdminPrivileges() (from the 'request' dev
  // lib), the check will succeed and the execution of the SMF will continue
  // from there.
  async post(curDir, relativeRoute, returnLog, postDataFilePath) {
    let dirID = this.getDirID(curDir);

    // Read and parse the postData from the postDataFilePath if provided.
    let postData = undefined;
    if (postDataFilePath) {
      let contents;
      try {
        contents = fs.readFileSync(postDataFilePath, 'utf8');
      } catch (err) {
        throw "Error when reading the file at " + postDataFilePath + ": " +
        err.toString()
      }
      try {
        postData = JSON.parse(contents);
      } catch (err) {
        throw "Error when parsing the file at " + postDataFilePath
      }
    }

    // Initialize the serverQueryHandler with the provided authToken.
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );

    // Construct the full route, then query the server. If the route still
    // starts with "/this/<dirID>/", post as admin, and else just post
    // regularly, without requesting admin privileges.
    let route = normalizePath("/this/" + dirID + (relativeRoute[0] === "+" ?
      relativeRoute.substring(1) :
      "/" + relativeRoute
    ));
    if (route.substring(0, dirID.length + 6) === "/this/" + dirID) {
      return await serverQueryHandler.postAsAdmin(
        route, postData, {returnLog: returnLog}
      );
    } else {
      return await serverQueryHandler.post(
        route, postData, {returnLog: returnLog}
      );
    }

  }

  // fetch() sends a fetch request as the admin, able in particular to read
  // data at locked routes directly.
  // TODO: Implement setting returnLog = true for the request, if I haven't
  // already.
  async fetch(curDir, relativeRoute, returnLog) {
    let dirID = this.getDirID(curDir);
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );

    // Construct the full route, then query the server.
    let route = normalizePath("/this/" + dirID + (relativeRoute[0] === "+" ?
      relativeRoute.substring(1) :
      "/" + relativeRoute
    ));
    return await serverQueryHandler.fetchAsAdmin(
      route, {returnLog: returnLog}
    );
  }



  async renameDir(curName, newName) {
    let dirID = this.getDirID(curName, true, true);
    let otherDirID = this.getDirID(newName, false, true);
    if (otherDirID) throw (
      "New directory name already exists in the directories" +
      (this.domain === "localhost" ? "_local" : "") + ".json file" 
    );
    let curPath = this.upDirectoriesPath + "/" + curName;
    let newPath = this.upDirectoriesPath + "/" + newName;
    if (fs.existsSync(newPath)) throw (
      `New directory "./up_directories/${newName} already exists`
    );
    this.#writeDirIDSync(curName, undefined);
    this.#writeDirIDSync(newName, dirID);
    fs.renameSync(curPath, newPath);
    // TODO: Also update timestamps.json. But also perhaps change this whole
    // method to work for all domains at once. 
  }



  // TODO: Implement a bundler method, and an associated command in the command
  // line, which can then either be called automatically for before each
  // upload, or manually so, perhaps depending on whether a bundle flag is
  // present or not.
  bundle() {

  }

}




const SEGMENT_TO_REPLACE_REGEX = /(\/\.\/|\/[^/]+\/\.\.\/)/g;

export function normalizePath(path) {
  // Then replace any occurrences of "/./", and "<dirName>/../" with "/".
  let ret = path, prevPath;
  do {
    prevPath = ret
    ret = ret.replaceAll(SEGMENT_TO_REPLACE_REGEX, "/");
  }
  while (ret !== prevPath);

  if (ret.includes("/../")) throw (
    `Ill-formed path: "${path}"`
  );

  return ret.replace(/\/$/, "");
}
