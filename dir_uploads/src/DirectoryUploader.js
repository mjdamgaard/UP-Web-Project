
import {ServerQueryHandler}
  from '../../src/server/ajax_io/ServerQueryHandler.js';

import fs from 'fs';
import path from 'path';

const serverQueryHandler = new ServerQueryHandler();


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
  static async uploadDir(dirPath, username, password, deleteStructData) {

    // TODO: Call the server to get a new or an existing session ID here, and
    // also get the userID.
    let credentials = btoa(`${username}:${password}`);
    let userID = "1";
    let token = "test_token";

    // Read the dirID.
    let idFilePath = path.normalize(dirPath + "/.id");
    let dirID;
    try {
      dirID = fs.readFileSync(idFilePath, 'utf8');
    } catch (_) {}

    // If no dirID was gotten, request the server to create a new directory and
    // get the new dirID.
    if (!dirID) {
      [[dirID]] = await serverQueryHandler.post(
        `/1/mkdir/a=${userID}`,
        undefined,
        {"Authorization": `Bearer ${token}`},
      );
      fs.writeFileSync(idFilePath, `${dirID ?? ""}`);
    }

    // Request a list of all the files in the server-side directory, and then
    // go through each one and check that it also exist nested in the client-
    // side directory, and for each one that doesn't, request deletion of that
    // file server-side.
    let [filePaths] = await serverQueryHandler.post(
      `/1/${dirID}/~all`,
      undefined,
      {"Authorization": `Bearer ${token}`},
    ) ?? [[]];
    let deletionPromises = [];
    filePaths.forEach(([relPath]) => {
      let clientFilePath = path.normalize(dirPath + "/" + relPath);
      let serverFilePath = path.normalize(`/1/${dirID}/${relPath}`);
      if (!fs.existsSync(clientFilePath)) {
        deletionPromises.push(
          serverQueryHandler.post(serverFilePath + "/~delete", {
            method: "post",
            credentials: credentials,
          })
        );
      }
    });debugger;
    await Promise.all(deletionPromises);

    // Then call a helper method to recursively loop through all files in the
    // directory itself or any of its nested directories and uploads them,
    // pushing a promise for the response of each one to uploadPromises.
    let uploadPromises = [];
    this.#uploadDirHelper(
      dirPath, credentials, dirID, deleteStructData, uploadPromises
    );
    await Promise.all(uploadPromises);
  }


  static async #uploadDirHelper(
    dirPath, credentials, relPath, deleteStructData, uploadPromises
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
      if (name.indexOf(".") <= 0) {
        this.#uploadDirHelper(
          childAbsPath, credentials, childRelPath, deleteStructData,
          uploadPromises
        );
      }

      // Else if the file is a text file, upload it as is to the server.
      else if (/\.(js|txt|json|html)$/.test(name)) {
        let contentText = fs.readFileSync(childAbsPath, 'utf8');
        uploadPromises.push(
          serverQueryHandler.post(
            `/1/${childRelPath}/~put`, 
            contentText,
            {"Authorization": `Bearer ${token}`},
          )
        );
      }
      else if (/\.[a-z]+$/.test(name)) {
        if (deleteStructData) {
          uploadPromises.push(
            // ServerInterface.putStructFile(credentials, "/" + childRelPath)
            "TODO..."
          );
        }
        else {
          uploadPromises.push(
            // ServerInterface.touchStructFile(credentials, "/" + childRelPath)
            "TODO..."
          );
        }
      }

      // TODO: Implement some abstract DB table files as well.
    });
  }
}