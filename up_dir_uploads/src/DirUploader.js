
import {ServerInterface} from '../../src/server/ajax_io/ServerInterface.js';

const fs = require('fs');
const path = require('path');
const http = require('http');


export class DirUploader {

  // createDir() creates a directory in the filesystem if one does not already
  // exist, then reads the 'dir.id' file if one exists. If it does, the method
  // return early, and if not, the method calls the server to create a new
  // directory and get the new dirID. Upon return, it then stores the dirID in
  // a/the file called 'dir.id'.
  static async createDir(dirPath, credentials, isPrivate) {
    fs.mkdirSync(dirPath, {recursive: true});
    let idFilePath = path.normalize(dirPath + "/dir.id");
    let data;
    try {
      data = fs.readFileSync(idFilePath, 'utf8');
    } catch (_) {}

    // If the '<path>/dir.id' file already exists and isn't empty, return early.
    if (data) {
      return;
    }

    // Else call the server to create a new directory and get the new dirID.
    let dirID = await ServerInterface.createHomeDir(
      credentials, isPrivate
    );
    await fs.promises.writeFile(idFilePath, dirID.toString());
    return dirID;
  }


  // uploadDir() searches loops through all files of the directory at path and
  // uploads all that has a recognized file extension to the server-side home
  // directory with the dirID equal to the string stored in the '<path>/dir.id'
  // file. The valid file extensions are text file extensions such as '.js',
  // '.json', or '.txt', for which the content will be uploaded as is, as well
  // as file extensions of abstract files (often implemented via one or several
  // relational DB tables), for which the file content, if any, will have to
  // conform to a specific format.
  static async uploadDir(dirPath, credentials) {
    // Read the dirID.
    let idFilePath = path.normalize(dirPath + "/dir.id");
    let dirID;
    try {
      dirID = fs.readFileSync(idFilePath, 'utf8');
    } catch (_) {}
    if (!dirID) {
      return false;
    }

    // Call a helper method to recursively loop through all files in the
    // directory itself or any of its nested directories and uploads them,
    // pushing a promise for the response of each one to promiseArr.
    let promiseArr = [];
    this.#uploadDirHelper(dirPath, credentials, dirID, promiseArr);
    await Promise.all(promiseArr);
    return true;
  }


  static async #uploadDirHelper(dirPath, credentials, homeDirID, promiseArr) {
    // Get each file in the directory at path, and loop through and handle each
    // one according to its extension (or lack thereof).
    let fileNames = fs.readdirSync(dirPath);
    fileNames.forEach(name => {
      let filePath = path.normalize(dirPath + "/" + name);

      // If the file has no extensions, treat it as a folder, and call this
      // helper method recursively.
      if (name.indexOf(".") <= 0) {
        this.#uploadDirHelper(filePath, credentials, homeDirID, promiseArr);
      }

      // Else if the file is a text file, upload it as is to the server.
      else if (/\.(js|txt|json|html)$/.test(name)) {
        let contentText = fs.readFileSync(filePath, 'utf8');
        promiseArr.push(
          ServerInterface.putTextFile(credentials, filePath, contentText)
        );
      }

      // TODO: Implement some abstract DB table files as well.
    });
  }
}