
import {slice, substring, at, indexOf} from 'string';
import {fetchEntityID} from "/1/1/entities.js";

import * as TutorialIndexPage from "./tutorials/TutorialIndexPage.jsx";
import * as TutorialIntroPage from "./tutorials/intro.jsx";
import * as AboutPage from "./about.jsx";
import * as HomePage from "./home.jsx";
import * as EntityPage from "./variable_components/EntityPage.jsx";
import * as FileBrowser from "./file_browsing/FileBrowser.jsx";


export function render({url = "", history, homeURL}) {
  if (at(url, -1) === "/") {
    url = slice(url, 0, -1);
  }

// TODO: Remove this:
if (url === "") url = "/entPath/1/1/em1.js;get/entities";

  // If the url is equal to "", go to the home page.
  if (!url) {
    return (
      <main className="app-main">
        <HomePage key="home" url={url} />
      </main>
    );
  }

  // Else if url is of the form "/entPath" + entPath, fetch the entity ID and
  // then redirect to the "/e/" + entID url (using replaceState()).
  if (slice(url, 0, 9) === "/entPath/") {
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

  // Else if url is of the form "/e" + entID, go to the EntityPage of the
  // given entity.
  let urlStart = slice(url, 0, 3);
  if (urlStart === "/e/") {
    let indOfThirdSlash = indexOf(url, "/", 3);
    let endOfID = (indOfThirdSlash === -1) ? undefined : indOfThirdSlash;
    let entID = slice(url, 3, endOfID);
    let urlRemainder = substring(url, 3 + entID.length);
    return (
      <main className="app-main">
        <EntityPage key="e"
          entKey={entID} url={urlRemainder} pageURL={"~/e/" + entID}
        />
      </main>
    );
  }  
 

  // Else if url is of the form "/f" + route (where 'f' might stand for 'file'
  // or 'fetch' if you will), go to the file browser app with that route
  // given entity.
  if (urlStart === "/f/") {
    let route = slice(url, 2);
    return (
      <main className="app-main">
        <FileBrowser key="f" route={route} />
      </main>
    );
  }

  // Else if url is of the form "/c" + entPath go to the component showcasing
  // app and open the given component entity pointed to by entPath.
  if (urlStart === "/c/") {
    let entPath = slice(url, 2);
    return (
      <main className="app-main">
        {"TODO: Insert component showcasing app component here."}
      </main>
    );
  }

  // Else if url = "/about", go to the about page.
  if (url === "/about") {
    return (
      <main className="app-main">
        {"TODO: Insert 'About' page component here."}
      </main>
    );
  }

  // Else if url = "/tutorials", go to a tutorial index page, which similarly to
  // the home page is also supposed to be a variable, user-determined page at
  // some point. TODO: Implement that.
  if (url === "/tutorials") {
    return (
      <main className="app-main">
        <TutorialIndexPage key="tut"/>
      </main>
    );
  }

  // Else if url = "/donations", go to the about page.
  if (url === "/donations") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Donations' page component here."}
      </main>
    );
  }

  // Else if url = "/sponsors", go to the about page.
  if (url === "/sponsors") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Sponsors' page component here."}
      </main>
    );
  }

  // And else if none of those URL types was matched, go to a 404 error page.
  return (
    <main className="app-main">
      {"404 error: Missing page."}
    </main>
  );
}

