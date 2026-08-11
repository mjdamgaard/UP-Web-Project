
import {parseRoute, isTextFileExtension, getAbsolutePath} from 'route';
import {fetch, encodeURI} from 'query';

import * as ILink from 'ILink';
import * as InputText from 'InputText';
import * as MissingPage from "../base_app/src/MissingPage.jsx";
import * as FileBrowserPage from "./src/FileBrowserPage.jsx";



export function render({style}) {
  let content;

  // First we parse the input route, and in the special case where the route
  // includes only directories, we reinterpret the route by adding a ';' right
  // after the homeDirID, which casts the "/<upNodeID>/<homeDirID>" result into
  // a list of children of the specific subdirectory pointed to by route.
  let [firstSegment, ...restSegments] = this.getSegments();
  let extRoute = "/" + restSegments.join("/");
  if (firstSegment !== "files") {
    this.replaceURL("~/files" + (restSegments[0] ? extRoute : ""));
    return <div className="loading"></div>;
  }

  if (!restSegments[0]) {
    content = <div className="loading"></div>;
  }
  else {
    // Parse and the (extended) route.
    let [route, ...castingSegments] = extRoute.split(";");
    let isLocked, upNodeID, homeDirID, localPath, dirSegments, fileName,
      fileExt, queryPathSegments;
    try {
      [
        isLocked, upNodeID, homeDirID, localPath, dirSegments, fileName,
        fileExt, queryPathSegments
      ] = parseRoute(route);
    }
    catch (err) {
      console.error(err);
      return <div className="invalid-route">{"Invalid route: "}{route}</div>;
    }

    // Calculate the home path of the route.
    let routeHomePath = homeDirID ? "/" + upNodeID + "/" + homeDirID :
      undefined;

    // If there is no fileName or casting segments, record that route is a
    // "directory path."
    let isDirectoryPath = (!fileName && castingSegments.length === 0);

    // If if it is a directory path, reinterpret the route by putting a ';'
    // after the homeDirID, which means that the route becomes a casted as a
    // subdirectory route.
    let transformedRoute = extRoute;
    if (isDirectoryPath) {
      let subdirectoryPath = dirSegments.join("/");
      transformedRoute = routeHomePath + ";/" + subdirectoryPath;
    }

    // Also record if the route is a text file, and whether is has a query path,
    // e.g. a "./call" or "./get" query path.
    let isTextFile = fileExt && isTextFileExtension(fileExt);
    let isTextFileQuery = isTextFile && queryPathSegments.length > 0;

    // Then call getRouteJSXWithSubLinks() to get a <span> element with the
    // route where every single queryable segment is an individual ILink,
    // meaning that the user can navigate to ancestor directories, or to pre-
    // casted versions of a casted route.
    let routeJSXWithSubLinks = getRouteJSXWithSubLinks(
      castingSegments, routeHomePath, dirSegments, fileName, queryPathSegments,
      isTextFileQuery
    );

    // Record wether a separate query for the text file should be made.
    let fetchFile = isTextFileQuery || isTextFile && castingSegments.length > 0;

    if (isLocked || !routeHomePath) {
      content = <div className="invalid-route">{"Invalid route: "}{route}</div>;
    }
    else {
      content = <FileBrowserPage key="p"
        extRoute={extRoute} routeHomePath={routeHomePath} localPath={localPath}
        transformedRoute={transformedRoute} isDirectoryPath={isDirectoryPath}
        fetchFile={fetchFile} isTextFile={isTextFile} route={route}
        routeJSXWithSubLinks={routeJSXWithSubLinks}
      />;
    }
  }

  // Redirect to FileBrowserPage which fetches the necessary data and renders
  // the file browser from there. 
  return <div className="app-browser" innerStyle={style}>
    <div className="search-bar">
      <InputText key="i-search" size={60} placeholder="Insert route here"
        onKeyDown={e => (!e.repeat && e.key === "Enter") && this.do("go")}
      />
      <button onClick={() => this.do("go")}>Go</button>
    </div>
    {(content)}
  </div>;
}



export const actions = {
  "go": function() {
    let relExtRoute = this.call("i-search", "getValue");
    relExtRoute = (relExtRoute ?? "").trim();
    if (relExtRoute) {
      let [ , ...restSegments] = this.getSegments();
      let curExtRoute = "/" + restSegments.join("/");
      let newExtRoute = getAbsolutePath(relExtRoute, curExtRoute);
      this.call("i-search", "setValue", "");
      this.pushURL("~/files/" + newExtRoute);
    }
  }
};




function getRouteJSXWithSubLinks(
  castingSegments, routeHomePath, dirSegments, fileName, queryPathSegments,
  isTextFileQuery
) {
  // Initialize an accumulative path for the following ILinks.
  let href, acc = "~/f" + routeHomePath;

  // Create an ILink to the home directory.
  href = acc;
  let homeILink = <ILink key="h" href={href}>{routeHomePath}</ILink>;

  // Then create an array of ILinks to each additional subdirectory, if any.
  let subdirectoryLinks = dirSegments.map((val, ind) => {
    acc += "/" + val;
    href = acc;
    return <ILink key={"s" + ind} href={href}>{val}</ILink>;
  });

  // Also create an ILinks to the file if the file is a text file and the
  // queryPathSegments array is nonempty.
  let fileLink = isTextFileQuery ?
    <ILink key={"f"} href={acc + "/" + fileName}>{fileName}</ILink> :
    undefined;
  
  // Then create an ILink to the result as it is before any casting.
  let resultSegment = fileName ? fileName + (
    queryPathSegments.length === 0 ? "" : queryPathSegments.join("/")
  ) : undefined;
  acc += "/" + resultSegment;
  href = encodeURI(acc);
  let resultLink = <ILink key={"r"} href={href}>{resultSegment}</ILink>;

  // Then create an ILink for each casting segment.
  let castingLinks = castingSegments.map((segment, ind) => {
    acc += ";" + segment;
    href = encodeURI(acc);
    return <ILink key={"cast" + ind} href={href}>{segment}</ILink>;
  });

  // Then gather all these links into an array that also includes "/"
  // delimiters, and return that.
  let slashDelimiter = <span className='slash'>{"/"}</span>;
  let semicolonDelimiter = <span className='semicolon'>{";"}</span>;
  return [
    homeILink, ...subdirectoryLinks.map(link => [slashDelimiter, link]),
    ...(fileLink ? [slashDelimiter, fileLink] : []),
    ...(resultLink ? [slashDelimiter, resultLink] : []),
    ...castingLinks.map(link => [semicolonDelimiter, link]),
  ];
}

