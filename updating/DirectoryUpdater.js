
import {ServerQueryHandler} from '../src/server/ajax_io/ServerQueryHandler.js';

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';


export class DirectoryUpdater {
  constructor(authToken = undefined, domain = undefined) {
    this.authToken = authToken;
    this.domain = domain;
  }

  setDomain(domain) {
    this.domain = domain;
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


  readDirID(dirPath) {
    // Read the dirID.
    let idFilePath = path.normalize(dirPath + "/.id.js");
    let dirID;
    try {
      let contents = fs.readFileSync(idFilePath, 'utf8');
      [ , dirID] = /\/[0-9a-f]+\/([0-9a-f]+)/.exec(contents) ?? [];
    } catch (_) {}
    return dirID;
  }

  // uploadDir() first looks in a '.id.js' file to get the dirID of the home
  // directory, and if not is found, it requests the server to create a new home
  // directory. Then it loops through all files of the directory at path and
  // uploads all that has a recognized file extension to the (potentially new)
  // server-side directory. The valid file extensions are text file extensions
  // such as '.js', '.json', or '.txt', for which the content will be uploaded
  // as is, as well as file extensions of abstract files (often implemented via
  // one or several relational DB tables), for which the file content, if any,
  // will have to conform to a specific format.
  async uploadDir(userID, dirPath, dirID) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );

    // If no dirID was provided, request the server to create a new directory
    // and get the new dirID.
    let idFilePath = path.normalize(dirPath + "/.id.js");
    if (!dirID) {
      dirID = this.readDirID(dirPath) ?? "";
      if (!dirID) {
        dirID = await serverQueryHandler.post(`/1/mkdir/a=${userID}`);
        if (!dirID) throw "mkdir error";
        fs.writeFileSync(idFilePath, `export default "/1/${dirID}";`);
      }
    }

    // Request a list of all the files in the server-side directory, and then
    // go through each one and check that it also exist nested in the client-
    // side directory, and for each one that doesn't, request deletion of that
    // file server-side.
    let filePaths = await serverQueryHandler.fetchAsAdmin(
      `/1/${dirID}/_all`
    );
    let deletionPromises = [];
    filePaths.forEach((relPath) => {
      let clientFilePath = path.normalize(dirPath + "/" + relPath);
      let serverFilePath = path.normalize(`/1/${dirID}/${relPath}`);
      if (!fs.existsSync(clientFilePath)) {
        deletionPromises.push(
          serverQueryHandler.postAsAdmin(serverFilePath + "/_rm")
        );
      }
    });
    await Promise.all(deletionPromises);

    // Then call a helper method to recursively loop through all files in the
    // directory itself or any of its nested directories and uploads them,
    // pushing a promise for the response of each one to uploadPromises.
    let uploadPromises = [];
    this.#uploadDirHelper(dirPath, dirID, uploadPromises, serverQueryHandler);
    await Promise.all(uploadPromises);

    return dirID;
  }


  async #uploadDirHelper(
    dirPath, relPath, uploadPromises, serverQueryHandler
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
          childAbsPath, childRelPath, uploadPromises, serverQueryHandler
        );
      }

      // Else if the file is a text file, upload it as is to the server.
      else if (/\.(jsx?|txt|json|html|xml|svg|css|md)$/.test(name)) {
        let contentText = fs.readFileSync(childAbsPath, 'utf8');
        uploadPromises.push(
          serverQueryHandler.postAsAdmin(
            `/1/${childRelPath}/_put`,
            contentText,
          )
        );
      }
      else if (/\.(att|bt|ct|bbt|ftt)$/.test(name)) {
        uploadPromises.push(
          serverQueryHandler.postAsAdmin(`/1/${childRelPath}/_touch`)
        );
      }
    });
  }



  // deleteData(dirID, relativePath) deletes the table data at all table files
  // (i.e. .att, .bt, .ct, .bbt, or .ftt files) that is either equal to
  // "/<upNodeID>/<homeDirID>/<relativePath>", or extends this path if
  // relativePath ends in a '*' wildcard.
  async deleteData(dirID, relativePath, read) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );

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
      `/1/${dirID}/_all`
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
          serverFilePaths.push(path.normalize(`/1/${dirID}/${relPath}`));
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
      await Promise.all(serverFilePaths.map(serverFilePath => (
        serverQueryHandler.postAsAdmin(serverFilePath + "/_put")
      )));
      console.log("Filed successfully deleted.");
    }
    else {
      console.log("Aborted.");
    }
  }



  // post() posts a request with admin privileges. In particular, for a callSMF
  // request, if the SMF calls checkAdminPrivileges() (from the 'request' dev
  // lib), the check will succeed and the execution of the SMF will continue
  // from there.
  // TODO: Implement postDataFilePath to read the postData from a file.
  async post(dirID, relativeRoute, returnLog, dirPath, postDataFilePath) {
    let postData = undefined;

    // Initialize the serverQueryHandler with the provided authToken.
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );

    // Construct the full route, then query the server. If the route still
    // starts with "/1/<dirID>/", post as admin, and else just post regularly,
    // without requesting admin privileges.
    let route = path.normalize("/1/" + dirID + "/" + relativeRoute);
    if (route.substring(0, dirID.length + 3) === "/1/" + dirID) {
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
  async fetch(dirID, relativeRoute, returnLog) {
    let serverQueryHandler = new ServerQueryHandler(
      this.authToken, Infinity, fetch, this.domain
    );

    // Construct the full route, then query the server.
    let route = path.normalize("/1/" + dirID + "/" + relativeRoute);
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