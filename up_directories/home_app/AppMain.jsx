
import {substring, indexOf} from 'string';
import {decodeURIComponent, encodeURIComponent} from 'query';
import {fetchEntityID} from "/1/1/entities.js";

import * as UPIndexPage from "./UPIndexPage.jsx";
import * as ProfilePage from "./ProfilePage.jsx";
import * as EntityPage from "./variable_components/EntityPage.jsx";
import * as FileBrowser from "./file_browsing/FileBrowser.jsx";
import * as TutorialIndexPage from "./tutorials/index.jsx";
import * as ComponentEntityPage
from "./variable_components/ComponentEntityPage.jsx";


export function render({
  url = "", history, homeURL, localStorage, sessionStorage
}) {
  let tailURL = substring(url, homeURL.length);

  // If the relURL is empty, replace it with "up" ('up' for 'user-programmed'),
  // taking the user to the user-defined home page.
  if (!tailURL) {
    history.replaceState(
      history.state,
      homeURL + "/up"
    );
    return <div className="fetching">{"..."}</div>;
  }

  // If the relURL is of the form "/up[/...]", go to a page with the current
  // top-rated user-programmed page component for redirecting the the user
  // further to page/app that fits the subsequent part of the url.
  let indOfSecondSlash = indexOf(tailURL, "/", 1);
  let firstSegment = (indOfSecondSlash === -1) ?
    substring(tailURL, 1) : substring(tailURL, 1, indOfSecondSlash);
  if (firstSegment === "up") {
    return (
      <main className="app-main">
        <UPIndexPage key="idx" url={url} history={history} homeURL={homeURL} />
      </main>
    );
  }
  
  // Else if relURL starts with "/profile", go to the profile page. 
  if (firstSegment === "profile") {
    let indOfThirdSlash = indexOf(tailURL, "/", 9);
    let endOfID = (indOfThirdSlash === -1) ? undefined : indOfThirdSlash;
    let entID = substring(tailURL, 9, endOfID);
    let tailURL = substring(tailURL, 9 + entID.length);
    return (
      <main className="app-main">
        <ProfilePage key="_profile"
          url={url} homeURL={homeURL} tailURL={tailURL}
        />
      </main>
    );
  } 

  // Else if relURL is of the form "/entPath/<encoded entPath>"", fetch the
  // entity ID and then redirect to the "/e/" + entID relURL.
  if (firstSegment === "entPath") {
    let entPath = decodeURIComponent(substring(tailURL, 9));
    fetchEntityID(entPath).then(entID => {
      if (entID) {
        history.replaceState(history.state, homeURL + "/e/" + entID);
      }
      else {
        let encEntPath = encodeURIComponent(entPath);
        history.replaceState(history.state, homeURL + "/f/" + encEntPath);
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
    let indOfThirdSlash = indexOf(tailURL, "/", 3);
    let endOfID = (indOfThirdSlash === -1) ? undefined : indOfThirdSlash;
    let entID = substring(tailURL, 3, endOfID);
    let tailURL = substring(tailURL, 3 + entID.length);
    return (
      <main className="app-main">
        <EntityPage key={"e-" + entID}
          entKey={entID} url={url} homeURL={homeURL} tailURL={tailURL}
        />
      </main>
    );
  }

  // Else if relURL is of the form "/c/<entID>[/<name>/...]", go to the
  // componentPage of the given entity, expecting it to be a component entity.
  if (firstSegment === "c") {
    let indOfThirdSlash = indexOf(tailURL, "/", 3);
    let endOfID = (indOfThirdSlash === -1) ? undefined : indOfThirdSlash;
    let entID = substring(tailURL, 3, endOfID);
    let tailURL = substring(tailURL, 3 + entID.length);
    return (
      <main className="app-main">
        <ComponentEntityPage key={"c-" + entID}
          entKey={entID} url={url} homeURL={homeURL} tailURL={tailURL}
          localStorage={localStorage} sessionStorage={sessionStorage}
        />
      </main>
    );
  } 

  // Else if relURL is of the form "/f" + uriEncodedRoute (where 'f' might
  // stand for 'file' or 'fetch' if you will), go to the file browser app with
  // that route.
  if (firstSegment === "f") {
    let route = decodeURIComponent(substring(tailURL, 3));
    return (
      <main className="app-main">
        <FileBrowser key="f" route={route} />
      </main>
    );
  }


  // Else if relURL = "/about", go to the about page.
  if (tailURL === "/about") {
    return (
      <main className="app-main">
        {"TODO: Insert 'About' page component here."}
      </main>
    );
  }

  // Else if relURL = "/tutorials", go to a tutorial index page, which
  // similarly to the home page is also supposed to be a variable, user-
  // determined page some point. TODO: Implement that.
  if (tailURL === "/tutorials") {
    return (
      <main className="app-main">
        <TutorialIndexPage key="tut"/>
      </main>
    );
  }

  // Else if relURL = "/donations", go to the about page.
  if (tailURL === "/donations") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Donations' page component here."}
      </main>
    );
  }

  // Else if relURL = "/sponsors", go to the about page.
  if (tailURL === "/sponsors") {
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

