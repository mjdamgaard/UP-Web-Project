
import {ClientError} from './err/errors.js';


const dirPathRegEx = /^(\/[^/?.]+)+/;
const filenameRegEx = /^\/([^/?.]*\.[^/?]*)/;
const queryStringRegEx = /^\?([^=&]*(=[^=&]*)?(&[^=&]*(=[^=&])*)?)/;


export function parseRoute(route) {
  let dirPath, filename, queryString;
  let match, routeRemainder = route;

  // Get the directory path, if any.
  [match, dirPath] = dirPathRegEx.exec(routeRemainder) ?? [""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the filename, if any.
  [match, filename] = filenameRegEx.exec(routeRemainder) ?? [""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the final query string, if any.
  [match, queryString] = queryStringRegEx.exec(routeRemainder) ?? [""];
  routeRemainder = routeRemainder.substring(match.length);

  // Throw if this did not exhaust the full route.
  if (routeRemainder !== "") throw new ClientError(
    `Invalid route: ${route}`
  );

  // Throw if a filename is used outside of any directory.
  if (filename && ! dirPath) throw new ClientError(
    `Invalid route: ${route}. Filename has to be preceded by a directory path`
  );

  // Extract the homeDirID from dirPath, if any, and also construct the
  // filePath (after the initial homeDirID).
  let homeDirID, filePath;
  if (dirPath) {
    homeDirID = dirPath.substring(1, dirPath.indexOf("/", 1));
    filePath = dirPath.substring(homeDirID + 2);
    if (filename) {
      filePath +=  "/" + filename;
    }
  }

  // Extract the file extension, if any.
  let fileExt;
  if (filename) {
    fileExt = filename.substring(filename.indexOf(".") + 1);
  }

  // If it is defined, split the queryString into an array of key--value
  // entries array for key--value pairs, and string values in case of boolean
  // query parameters (with no "=").
  let queryStringArr;
  if (queryString) {
    queryStringArr = queryString.split("&").map(val => (
      (val.indexOf("=") === -1) ? val : val.split("=")
    ));
  }

  // Parse whether the given file or directory, or query path, is locked for
  // the admin only.
  let isLocked = false;
  if (filePath) {
    isLocked = filePath.indexOf("/_") >= 0;
  }
  if (queryString) {
    isLocked ||= queryString.indexOf("&_") >= 0;
  }

  return [
    homeDirID, filePath, fileExt, queryStringArr, isLocked
  ];
}
