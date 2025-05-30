
const upNodeIDRegEx = /^\/([a-zA-Z0-9_\-]+)/;
const homeDirIDRegEx = /^\/([a-zA-Z0-9_\-]+)/;
const filePathRegEx =
  /^\/(([a-zA-Z0-9_\-.]+(?<!\.)\/)*[a-zA-Z0-9_\-.]+(?<!\.))(?=($|[?#]))/;
const queryStringRegEx = /^\?([^=&#]*(=[^=&#]*)?(&[^=&#]*(=[^=&#])*)?)/;
const tagRegEx = /^#([a-zA-Z0-9_\-.]*)/;
const lastFileExtRegEx = /\.([^.]+)$/


export function parseRoute(route) {
  let upNodeID, homeDirID, filePath, queryString, tag;
  let match, routeRemainder = route;

  // Get the UP node ID.
  [match, upNodeID] = homeDirIDRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the home directory ID, if any.
  [match, homeDirID] = homeDirIDRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the file path, if any.
  [match, filePath] = filePathRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the final query string, if any.
  [match, queryString] = queryStringRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the trailing tag, if any.
  [match, tag] = queryStringRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Throw if this did not exhaust the full route.
  if (routeRemainder !== "") throw (
    `Invalid route: ${route}`
  );

  // Throw if a file path is used outside of any directory, or if it is too
  // long.
  if (filePath && ! homeDirID) throw (
    `Invalid route: ${route}`
  );
  if (filePath.length > 700) throw (
    "File path is too long"
  );

  // Extract the file extension, if any.
  let [ , fileExt] = lastFileExtRegEx.exec(filePath) ?? [];

  // If it is defined, split the queryString into an array of key--value
  // entries array for key--value pairs, and string values in case of boolean
  // query parameters (with no "=").
  let queryStringArr;
  if (queryString) {
    queryStringArr = queryString.split("&").map(val => (
      (val.indexOf("=") === -1) ? val : val.split("=", 2)
    ));
  }

  // Parse whether the given file or directory, or query path, is locked for
  // the admin only.
  let isLocked = false;
  if (filePath) {
    isLocked = filePath[0] === "_" || filePath.indexOf("/_") >= 0;
  }
  if (queryString) {
    isLocked ||= queryString[0] === "_" || queryString.indexOf("&_") >= 0;
  }

  return [
    upNodeID, homeDirID, filePath, fileExt, queryStringArr, tag, isLocked
  ];
}
