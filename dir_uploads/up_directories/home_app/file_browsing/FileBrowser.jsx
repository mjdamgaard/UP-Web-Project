
import {split, indexOf} from 'string';
import {some, slice, at, join, map, concat, createArray} from 'array';
import {parseRoute, isTextFileExtension} from 'route';



export function render({route}) {
  // Split the route along any point that is the end of a valid, queryable
  // subroute, and then also generate the corresponding array of all queryable
  // subroutes (plus two initial non-queryable subroutes of the form
  // "/upNodeID" and "/upNodeID/homeDirID").
  let routeParts = getQueryableRouteParts(route);
  let subroutes = createArray(routeParts.length, ind => (
    join(slice(routeParts, 0, ind + 1), "")
  ));

  // Now create an array 


  return (
    <EntityMetadataPage key="0" entKey={entKey} />
  );
}






// getQueryableRouteParts() splits the input into segments such that for each
// index, i, join(slice(ret, 0, i + 1), "") is a valid route to query, where
// ret is the returned array.
export function getQueryableRouteParts(extendedRoute) {
  // Parse and the (extended) route.
  let [route, ...castingSegments] = split(extendedRoute, ";");
  let [
    isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr
  ] = parseRoute(route);

  // If the route is locked for the admin only (or SMFs), return false.
  if (isLocked) return false;

  // If the there is no filePath, return 
  let pathSegments = split(filePath, "/");
  let directorySegments = slice(pathSegments, 0, -1);
  let filename = at(pathSegments, -1);

  // If the file is not a text file, join the filename and query path into one
  // part, or else join only the query path segments.
  let filenameAndQueryPath = (queryPathArr.length === 0) ? [
    filename
  ] : isTextFileExtension(fileExt) ? [
    filename, join(queryPathArr, "/")
  ] : [
    filename + "/" + join(queryPathArr, "/")
  ];

  // Then return the array of route parts, that when joined yields the full
  // extended route, and when joined only partially, up until some index, i <
  // ret.length, yields a queryable subroute.
  return "/" + upNodeID + "/" + homeDirID + "/"

  // For the route in front, find the index of the filename segment.
  let fileSegmentIndex;
  some(routeSegments, (segment, ind) => {
    let indOfDot = indexOf(segment, ".");
    if (indOfDot > 0 && indOfDot < length - 1) {
      fileSegmentIndex = ind;
      return true;
    }
  });

  // Then we concatenate all segments that is part of the "query path" (i.e.
  // the segments after the filename, but before any ";"), and return an array
  // of each route parts, that when joined yields the full extended route, and
  // when joined only partially, up until some index >= 2, yields a queryable
  // subroute. 
  if (fileSegmentIndex !== undefined) {
    routeSegments = [
      upNodeID, homeDirID,
      ...slice(routeSegments, 0, fileSegmentIndex + 1),
      join(slice(routeSegments, fileSegmentIndex + 1), "/")
    ];
    routeSegments = map(segment => "/" + segment);
  }
  return join(concat(routeSegments, ...castingSegments), ";");
}

