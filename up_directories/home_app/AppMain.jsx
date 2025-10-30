
import {slice, substring, at, indexOf} from 'string';
import {fetchEntityID} from "/1/1/entities.js";

import * as UPIndexPage from "./UPIndexPage.jsx";
import * as EntityPage from "./variable_components/EntityPage.jsx";
import * as FileBrowser from "./file_browsing/FileBrowser.jsx";
import * as TutorialIndexPage from "./tutorials/TutorialIndexPage.jsx";


export function render({url = "", history, homeURL}) {
  if (at(url, -1) === "/") {
    url = slice(url, 0, -1);
  }
  let relURL = substring(url, homeURL.length);

  // If the relURL is empty, replace it with "up" ('up' for 'user-programmed'),
  // taking the user to the user-defined home page.
  if (!relURL) {
    history.replaceState(
      history.state,
      homeURL + "/up"
    );
    return <div className="fetching">{"..."}</div>;
  }

  // If the relURL is of the form "/up[/...]", go to a page with the current
  // top-rated user-programmed page component for redirecting the the user
  // further to page/app that fits the subsequent part of the url.
  let indOfSecondSlash = indexOf(relURL, "/", 1);
  let firstSegment = (indOfSecondSlash === -1) ?
    substring(relURL, 1) : slice(relURL, 1, indOfSecondSlash);
  if (firstSegment === "up") {
    return (
      <main className="app-main">
        <UPIndexPage key="idx" url={url} history={history} homeURL={homeURL} />
      </main>
    );
  }

  // Else if relURL is of the form "/entPath" + entPath, fetch the entity ID and
  // then redirect to the "/e/" + entID relURL (using replaceState()).
  if (firstSegment === "entPath") {
    let entPath = slice(url, 8);
    fetchEntityID(entPath).then(entID => {
      if (entID) {
        history.replaceState(history.state, homeURL + "/e/" + entID);
      }
      else {
        history.replaceState(history.state, homeURL + "/f" + entPath);
      }
    });
    return (
      <main className="app-main">
        <div className="fetching">{"..."}</div>
      </main>
    );
  } 

  // Else if relURL is of the form "/e/<entID>", go to the EntityPage of the
  // given entity.
  if (firstSegment === "e") {
    let indOfThirdSlash = indexOf(relURL, "/", 3);
    let endOfID = (indOfThirdSlash === -1) ? undefined : indOfThirdSlash;
    let entID = slice(relURL, 3, endOfID);
    let urlRemainder = substring(relURL, 3 + entID.length);
    return (
      <main className="app-main">
        <EntityPage key="e"
          entKey={entID} url={urlRemainder} pageURL={"~/e/" + entID}
        />
      </main>
    );
  } 

  // Else if relURL is of the form "/f" + route (where 'f' might stand for
  // 'file' or 'fetch' if you will), go to the file browser app with that route.
  if (firstSegment === "f") {
    let route = slice(relURL, 2);
    return (
      <main className="app-main">
        <FileBrowser key="f" route={route} />
      </main>
    );
  }

// Oh, maybe I'll drop these "/c" pages, and instead just give the entity pages
// a way to enhance a nested component up to fullscreen.. either starting from
// just under the AppHeader, or with.. yeah, no, starting from under the
// AppHeader, let's say..
  // // Else if url is of the form "/c" + entPath go to the component showcasing
  // // app and open the given component entity pointed to by entPath.
  // if (urlStart === "/c/") {
  //   let entPath = slice(url, 2);
  //   return (
  //     <main className="app-main">
  //       {"TODO: Insert component showcasing app component here."}
  //     </main>
  //   );
  // }

  // Else if relURL = "/about", go to the about page.
  if (relURL === "/about") {
    return (
      <main className="app-main">
        {"TODO: Insert 'About' page component here."}
      </main>
    );
  }

  // Else if relURL = "/tutorials", go to a tutorial index page, which
  // similarly to the home page is also supposed to be a variable, user-
  // determined page some point. TODO: Implement that.
  if (relURL === "/tutorials") {
    return (
      <main className="app-main">
        <TutorialIndexPage key="tut"/>
      </main>
    );
  }

  // Else if relURL = "/donations", go to the about page.
  if (relURL === "/donations") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Donations' page component here."}
      </main>
    );
  }

  // Else if relURL = "/sponsors", go to the about page.
  if (relURL === "/sponsors") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Sponsors' page component here."}
      </main>
    );
  }

  // And else if none of those relURL types was matched, go to a 404 error page.
  return (
    <main className="app-main">
      {"404 error: Missing page."}
    </main>
  );
}

