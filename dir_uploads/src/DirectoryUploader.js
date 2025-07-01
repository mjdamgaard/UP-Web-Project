
import {ServerQueryHandler}
  from '../../src/server/ajax_io/ServerQueryHandler.js';

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';


export class DirectoryUploader {

  // uploadDir() first looks in a '.id' file to get the dirID of the home
  // directory, and if noe is found, it requests the server to create a new home
  // directory. Then it loops through all files of the directory at path and
  // uploads all that has a recognized file extension to the (potentially new)
  // server-side directory. The valid file extensions are text file extensions
  // such as '.js', '.json', or '.txt', for which the content will be uploaded
  // as is, as well as file extensions of abstract files (often implemented via
  // one or several relational DB tables), for which the file content, if any,
  // will have to conform to a specific format.
  static async uploadDir(dirPath, authToken, deleteTableData) {
    if (!authToken) throw "No authentication token provided";

    // Initialize the serverQueryHandler with the provided authToken.
    let serverQueryHandler = new ServerQueryHandler(authToken, Infinity, fetch);

    // Read the dirID.
    let idFilePath = path.normalize(dirPath + "/.id.js");
    let dirID;
    try {
      let contents = fs.readFileSync(idFilePath, 'utf8');
      [ , dirID] = /\/[0-9A-F]+\/([0-9A-F]+)/.exec(contents) ?? [];
    } catch (_) {}

    // If no dirID was gotten, request the server to create a new directory and
    // get the new dirID.
    if (!dirID) {
      let [resultRow = []] = await serverQueryHandler.post("/1/mkdir") ?? [];
      [dirID] = resultRow;
      fs.writeFileSync(
        idFilePath, dirID ? `export default "/1/${dirID}";` : ""
      );
    }

    // Request a list of all the files in the server-side directory, and then
    // go through each one and check that it also exist nested in the client-
    // side directory, and for each one that doesn't, request deletion of that
    // file server-side.
    let [filePaths = []] = await serverQueryHandler.post(
      `/1/${dirID}/_all`
    ) ?? [[]];
    let deletionPromises = [];
    filePaths.forEach((relPath) => {
      let clientFilePath = path.normalize(dirPath + "/" + relPath);
      let serverFilePath = path.normalize(`/1/${dirID}/${relPath}`);
      if (!fs.existsSync(clientFilePath)) {
        deletionPromises.push(
          serverQueryHandler.post(serverFilePath + "/_delete")
        );
      }
    });
    await Promise.all(deletionPromises);

    // Then call a helper method to recursively loop through all files in the
    // directory itself or any of its nested directories and uploads them,
    // pushing a promise for the response of each one to uploadPromises.
    let uploadPromises = [];
    this.#uploadDirHelper(
      dirPath, dirID, deleteTableData, uploadPromises, serverQueryHandler
    );
    await Promise.all(uploadPromises);
  }


  static async #uploadDirHelper(
    dirPath, relPath, deleteTableData, uploadPromises, serverQueryHandler
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
          childAbsPath, childRelPath, deleteTableData, uploadPromises,
          serverQueryHandler
        );
      }

      // Else if the file is a text file, upload it as is to the server.
      else if (/\.(jsx?|txt|json|html|xml|svg|scss|md)$/.test(name)) {
        let contentText = fs.readFileSync(childAbsPath, 'utf8');
        uploadPromises.push(
          serverQueryHandler.post(
            `/1/${childRelPath}/_put`,
            contentText,
          )
        );
      }
      else if (/\.(att|bt|ct|bbt|ftt)$/.test(name)) {
        if (deleteTableData) {
          uploadPromises.push(
            serverQueryHandler.post(`/1/${childRelPath}/_put`)
          );
        }
        else {
          uploadPromises.push(
            serverQueryHandler.post(`/1/${childRelPath}/_touch`)
          );
        }
      }

      // TODO: Implement some abstract DB table files as well.
    });
  }
}