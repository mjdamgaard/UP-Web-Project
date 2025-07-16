
const upNodeIDRegEx = /^\/([0-9A-F]+)/;
const homeDirIDRegEx = /^\/([0-9A-F]+)/;
const filePathRegEx =
  /^\/((\.*[a-zA-Z0-9_\-~!&$+=]+\/)*\.*[a-zA-Z0-9_\-~!&$+=]+\.[.a-zA-Z0-9_\-~!&$+=]+)/;
const queryPathRegEx = /^\/([a-zA-Z0-9_\-~=.]+(\/[a-zA-Z0-9_\-~=.]+)*)/;
const castingPathRegEx = /^\/>([a-zA-Z0-9_\-~=.]+(\/[a-zA-Z0-9_\-~=.]+)*)/;
const queryStringRegEx = /^\?([a-zA-Z0-9_\-.=]*(&[a-zA-Z0-9_\-.=]*))/;
const tagRegEx = /^#([a-zA-Z0-9_\-.]+)(?<!\.)/;
const lastFileExtRegEx = /\.([^.]+)$/

const lockedRouteRegex = /\/_/;



export function parseRoute(route) {
  let upNodeID, homeDirID, filePath, queryPath, queryString, castingPath, tag;
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

  // Get the query path, if any.
  [match, queryPath] = queryPathRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the query string (for serializable options), if any.
  [match, queryString] = queryStringRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the casting path, if any.
  [match, castingPath] = castingPathRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Get the trailing tag, if any.
  [match, tag] = tagRegEx.exec(routeRemainder) ?? ["", ""];
  routeRemainder = routeRemainder.substring(match.length);

  // Throw if this did not exhaust the full route.
  if (routeRemainder !== "") throw (
    `Invalid route: ${route}`
  );

  // Throw if filePath or queryPath ends with a '.'.
  if (filePath.at(-1) === "." || queryPath.at(-1) === ".") throw (
    `Invalid route: ${route}`
  );

  // Throw if a file path is used outside of any directory, or if it is too
  // long.
  if (filePath && !homeDirID) throw (
    `Invalid route: ${route}`
  );
  if (filePath.length > 700) throw (
    "File path is too long"
  );

  // Extract the file extension, if any.
  let [ , fileExt] = lastFileExtRegEx.exec(filePath) ?? [];

  // Parse whether the given file or directory, or query path, is locked for
  // the admin only.
  let isLocked = lockedRouteRegex.test(route);

  // If defined, split the queryPath into an array of key--value entries array
  // for key--value pairs, and string values in case of boolean query
  // parameters (with no "=").
  let queryPathArr;
  if (queryPath) {
    queryPathArr = queryPath.split("/").map(val => {
      let indOfEqualSign = val.indexOf("=");
      return (indOfEqualSign === -1) ? val :
        [val.substring(0, indOfEqualSign), val.substring(indOfEqualSign + 1)];
    });
  }

  // If defined, split the queryString into key--value pairs and form a
  // queryOptions object from them
  let queryOptions = {};
  if (queryPath) {
    queryPath.split("&").forEach(val => {
      let indOfEqualSign = val.indexOf("=");
      if (indOfEqualSign !== -1) {
        let key = val.substring(0, indOfEqualSign);
        if (key.length > 0) {
          queryOptions[key] = val.substring(indOfEqualSign + 1);
        }
      }
    });
  }

  // If defined, split the castingPath into an array of its segments as well,
  // each one possibly split a second time if containing a "=".
  let castingPathArr;
  if (castingPath) {
    castingPathArr = castingPath.split("/").map(val => {
      let indOfEqualSign = val.indexOf("=");
      return (indOfEqualSign === -1) ? val :
        [val.substring(0, indOfEqualSign), val.substring(indOfEqualSign + 1)];
    });
  }

  return [
    isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr,
    queryOptions, castingPathArr, tag
  ];
}
