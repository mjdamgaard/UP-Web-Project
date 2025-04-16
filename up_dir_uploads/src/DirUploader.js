
import {ServerInterface} from '../../src/server/ajax_io/ServerInterface.js';

const fs = require('fs');
const path = require('path');
const http = require('http');


export class DirUploader {

  // createDir() creates a directory in the filesystem if one does not already
  // exist, then reads the '.id' file if one exists. If it does, the method
  // return early, and if not, the method calls the server to create a new
  // directory and get the new dirID. Upon return, it then stores the dirID in
  // a/the file called '.id'.
  static async createDir(path, adminID, credentials, isPrivate) {
    if (!adminID) throw (
      "DirUploader.createDir(): No adminID specified."
    );

    fs.mkdirSync(path, {recursive: true});
    let idFilePath = path.normalize(path + "/.id");
    let data;
    try {
      data = fs.readFileSync(idFilePath, 'utf8');
    } catch (_) {}

    // If the '<path>/.id' file already exists and isn't empty, return early.
    if (data) {
      return;
    }

    // Else call the server to create a new directory with adminID as the admin,
    // and get the new dirID.
    let dirID = await ServerInterface.createHomeDir(
      adminID, credentials, isPrivate
    );
    await fs.promises.writeFile(idFilePath, dirID.toString());
    return dirID;
  }


  // uploadDir() searches through the directory at path for all files with
  // UTF-8-associated file extensions, such as '.js', '.json', or '.txt', and
  // uploads each one (with the same relative path) to the server-side home
  // directory with the dirID equal to the string stored in the '<path>/.id'
  // file.
  static async uploadDir(path, adminID, credentials) {
    // TODO: Implement.
  }
}