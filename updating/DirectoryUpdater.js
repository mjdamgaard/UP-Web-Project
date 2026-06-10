
import {ServerQueryHandler} from '../src/server/ajax_io/ServerQueryHandler.js';

import fs from 'fs';
import fetch from 'node-fetch';


export class DirectoryUpdater {
  constructor(upDirectoriesPath, domain, authToken = undefined) {
    this.upDirectoriesPath = upDirectoriesPath;
    this.authToken = authToken;
    this.domain = domain;
    this.dirData = undefined;
    this.#readDirDataSync();
  }

  #readDirDataSync() {
    // Read directories.json and parse it.
    let dirDataPath = this.upDirectoriesPath + "/directories.json";
    let contents, dirData;
    try {
      contents = fs.readFileSync(dirDataPath, 'utf8');
    } catch (err) {
      throw "Error when reading the directories.json file"
    }
    try {
      dirData = JSON.parse(contents);
    } catch (err) {
      throw "Error when parsing directories.json"
    }
    this.dirData = dirData;
  }

  #writeDirDataSync(dirData = this.dirData) {
    // Stringify the dirData and write to directories.json.
    let dirDataPath = this.upDirectoriesPath + "/directories.json";
    let contents = JSON.stringify(dirData, null, 2);
    fs.writeFileSync(dirDataPath, contents);
    this.dirData = dirData;
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
    let domainEntry = this.dirData[this.domain];
    if (!domainEntry) {
      domainEntry = this.dirData[this.domain] = {};
    }
    domainEntry[dirName] = dirID.toString();
    this.#writeDirDataSync();
  }


  getOwnDirectoriesArray() {
    let ownDirectories = (this.dirData[this.domain] ?? {}).ownDirectories ?? {};
    return Object.keys(ownDirectories);
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


  // uploadDir() first looks in '.directories.json' to get the directory ID,
  // and if none is found, it requests the server to create a new home
  // directory. Then it loops through all files of the directory at path and
  // uploads all that has a recognized file extension to the (potentially new)
  // server-side directory. Text files will generally be uploaded as is, while
  // files representing special database tables (with extensions such as
  // '.att', '.bt', and '.bbt') when "uploaded" will have the effect of
  // creating a corresponding relational table (effectively) server-side, if it
  // has not already been created before.
  // The file name of 'dependencies.json' is treated in a special way, namely
  // since it is transformed before being uploaded, by replacing the contained
  // dirName arrays with dirName--ID objects, where the IDs are read from the
  // shared directories.json file (i.e. the file from which this.dirData is
  // parsed). And instead of a JSON file, it also gets transformed to a '.js'
  // module instead, with the object as its default export.
  async uploadDir(userID, curDir, upDirectoriesPath) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let nodeID = await serverQueryHandler.fetchNodeID();
    let dirPath = upDirectoriesPath + "/" + curDir;

    // If dirID is not found in directories.json, request the server to create
    // a new directory and get the new dirID, then write this dirID to the
    // directories.json file (and update this.dirData).
    let dirID = this.getDirID(curDir, false);
    if (!dirID) {
      dirID = await serverQueryHandler.post(`/this./mkdir/a/${userID}`);
      if (!dirID) throw "mkdir error";
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
    let serverFilePaths = [];
    filePaths.forEach(relPath => {
      let clientFilePath = dirPath + "/" + relPath;
      let serverFilePath = normalizePath(`/${nodeID}/${dirID}/${relPath}`);
      if (!fs.existsSync(clientFilePath)) {
        deletionPromiseGenerators.push(
          () => serverQueryHandler.postAsAdmin(serverFilePath + "./_rm")
        );
        serverFilePaths.push(serverFilePath);
      }
    });
    let len = deletionPromiseGenerators.length;
    for (let i = 0; i < len; i++) {
       await deletionPromiseGenerators[i]();
       console.log("Removed " + serverFilePaths[i]);
    }

    // Then call a helper method to recursively loop through all files in the
    // directory itself or any of its nested directories and uploads them,
    // pushing a promise for the response of each one to a
    // uploadPromiseGenerators array, which is then used to generate and wait
    // for each upload promise in sequence.
    let uploadPromiseGenerators = [];
    serverFilePaths = [];
    await this.#uploadDirHelper(
      dirPath, dirID, uploadPromiseGenerators, serverFilePaths,
      serverQueryHandler, nodeID
    );
    len = uploadPromiseGenerators.length;
    for (let i = 0; i < len; i++) {
      await uploadPromiseGenerators[i]();
      let [serverFilePath, isTableFile] = serverFilePaths[i];
      console.log((isTableFile ? "Touched " : "Uploaded ") + serverFilePath);
    }

    return dirID;
  }


  async #uploadDirHelper(
    dirPath, relPath, uploadPromiseGenerators, serverFilePaths,
    serverQueryHandler, nodeID, depth = 0
  ) {
    // Get each file in the directory at path, and loop through and handle each
    // one according to its extension (or lack thereof).
    let fileNames;
    try {
      fileNames = fs.readdirSync(dirPath);
    } catch (_) {
      return;
    }
    fileNames.forEach(name => {
      let childAbsPath = dirPath + "/" + name;
      let childRelPath = relPath + "/" + name;

      // If the file has no extensions, treat it as a folder, and call this
      // helper method recursively.
      if (/^\.*[^.]+$/.test(name)) {
        this.#uploadDirHelper(
          childAbsPath, childRelPath, uploadPromiseGenerators, serverFilePaths,
          serverQueryHandler, nodeID, depth + 1
        );
      }

      // Else consult the .timestamps.json file to see if the file should be
      // skipped.
      // TODO: Implement.

      // Then if the file is a text file, upload it as is to the server, unless
      // it is ~/dependencies.json, in which case transform it first to
      // ~/dependencies.json.
      else if (/\.(jsx?|txt|json|html|xml|svg|css|md)$/.test(name)) {
        let contentText = fs.readFileSync(childAbsPath, 'utf8');
        if (depth === 0 && name === "dependencies.json") {
          childRelPath = relPath + "/dependencies.js";
          contentText = this.#transformDependenciesFileText(contentText);
        }
        uploadPromiseGenerators.push(
          // TODO: Change this promise to also update the timestamp when it
          // resolves.
          () => serverQueryHandler.postAsAdmin(
            `/this/${childRelPath}./_put`,
            contentText,
          )
        );
        serverFilePaths.push([`/${nodeID}/${childRelPath}`, false]);
      }

      // Else if it is a database table file, simply touch the file serer-side.
      else if (/\.(att|bt|ct|bbt|ftt)$/.test(name)) {
        // TODO: Change this promise to also update the timestamp when it
        // resolves.
        uploadPromiseGenerators.push(
          () => serverQueryHandler.postAsAdmin(`/this/${childRelPath}./_touch`)
        );
        serverFilePaths.push([`/${nodeID}/${childRelPath}`, true]);
      }
    });
  }

  #transformDependenciesFileText(jsonText) {
    let deps, transformedDeps = {};
    try {
      deps = JSON.parse(jsonText);
    } catch (err) {
      throw "Error when parsing dependencies.json"
    }
    Object.entries(deps).forEach(([domain, dirNameArr]) => {
      // Put the nodeID property on transformedDeps[domain], and create
      // a new directory property by looping over all directory names from
      // dirNameArr, looking up the ID for each in this.dirData, and then
      // storing each dirName--ID pair in transformedDeps[domain].directories.
      let actualDomain = (domain === "this") ? this.domain : domain;
      let nodeID = this.dirData[actualDomain]?.nodeID;
      if (!nodeID) throw (
        "No nodeID found in directories.json for domain = " + actualDomain
      );
      transformedDeps[domain] = {nodeID: nodeID.toString(), directories: {}};
      let directories = transformedDeps[domain].directories;
      dirNameArr.forEach(dirName => {
        let dirID = this.getDirID(dirName, true, true, actualDomain);
        directories[dirName] = dirID;
      });
    });
    return (
    `export default ${JSON.stringify(transformedDeps, null, 2)};`
    );
  }



  // deleteData(curDir, relativePath) deletes the table data at all table files
  // (i.e. .att, .bt, .ct, .bbt, or .ftt files) that is either equal to
  // "/<upNodeID>/<homeDirID>/<relativePath>", or extends this path if
  // relativePath ends in a '*' wildcard.
  async deleteData(curDir, relativePath, read) {
    let dirID = this.getDirID(curDir);
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );
    let nodeID = await serverQueryHandler.fetchNodeID();

    // If no dirID was provided, fail.
    if (!dirID) {
      console.error("Failure: No dirID was provided.");
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
        () => serverQueryHandler.postAsAdmin(serverFilePath + "./_put")
      ));
      let len = deletionPromiseGenerators.length;
      for (let i = 0; i < len; i++) {
        await deletionPromiseGenerators[i]();
        console.log("Deleted data from " + serverFilePaths[i]);
      }
      console.log("Data successfully deleted.");
    }
    else {
      console.log("Aborted.");
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
