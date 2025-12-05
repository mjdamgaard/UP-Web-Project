
import {substring, indexOf} from 'string';
import {encodeURI, decodeURI} from 'query';
import {fetchEntityID} from "/1/1/entities.js";

import * as UPIndexPage from "./UPIndexPage.jsx";
import * as ProfilePage from "./ProfilePage.jsx";
import * as EntityPage from "./variable_components/EntityPage.jsx";
import * as FileBrowser from "./file_browsing/FileBrowser.jsx";
import * as TutorialIndexPage from "./tutorials/index.jsx";
import * as ComponentEntityPage
from "./variable_components/ComponentEntityPage.jsx";

const PAGE_CACHE_SIZE = 5;


export function getInitialState() {
  let cacheRef = new MutableArray();
  cacheRef[0] = [];
  return {cacheRef: cacheRef};
}


export function render(props) {
  let {cacheRef} = this.state;
  let cache = cacheRef[0];

  return renderHelper(props);

  // Call renderHelper() to get the jsxElement to render, along with its key.
  let [key, jsxElement] = renderHelper(props);

  // If key already exists in the cache, do not update it. ..Hm, I guess it
  // ought to be an LRU cache, so maybe I should reintroduce that class and use
  // to define.. well to export a ObjectObject version of it in a dev library,
  // maybe.. ..Hm, maybe so, yeah.. ..Oh, wait, isn't there a very simple way
  // to implement a LRU cache with JS: Just use the spread operator to generate
  // a new object, then turn that object into an entries array, cut it off, and
  // turn it back into an object (or keep it as an entries array). Yeah, that
  // ought to work..

  return <div className="main-container">
    {jsxElement}
  </div>;
}


export function renderHelper({
  url = "", history, homeURL, localStorage, sessionStorage
}) {
  let tailURL = substring(url, homeURL.length);

  // If the tailURL is empty, replace it with "up" ('up' for 'user-programmed'),
  // taking the user to the user-defined home page.
  if (!tailURL) {
    history.replaceState(
      history.state,
      homeURL + "/up"
    );
    return <div className="fetching">{"..."}</div>;
  }

  // If the tailURL is of the form "/up[/...]", go to a page with the current
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
  
  // Else if tailURL starts with "/profile", go to the profile page. 
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

  // Else if tailURL is of the form "/entPath" + encodedEntPath, fetch the
  // entity ID and then redirect to the "/e/" + entID tailURL.
  if (firstSegment === "entPath") {
    let entPath = decodeURI(substring(tailURL, 8));
    fetchEntityID(entPath).then(entID => {
      if (entID) {
        history.replaceState(history.state, homeURL + "/e/" + entID);
      }
      else {
        let encEntPath = encodeURI(entPath);
        history.replaceState(history.state, homeURL + "/f" + encEntPath);
      }
    });
    return (
      <main className="app-main">
        <div className="fetching">{"..."}</div>
      </main>
    );
  } 

  // Else if tailURL is of the form "/e/<entID>", go to the EntityPage of the
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

  // Else if tailURL is of the form "/c/<entID>[/<name>/...]", go to the
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

  // Else if tailURL is of the form "/f" + uriEncodedRoute (where 'f' might
  // stand for 'file' or 'fetch' if you will), go to the file browser app with
  // that route.
  if (firstSegment === "f") {
    let route = decodeURI(substring(tailURL, 2));
    return (
      <main className="app-main">
        <FileBrowser key="f" route={route} />
      </main>
    );
  }


  // Else if tailURL = "/about", go to the about page.
  if (tailURL === "/about") {
    return (
      <main className="app-main">
        {"TODO: Insert 'About' page component here."}
      </main>
    );
  }

  // Else if tailURL = "/tutorials", go to a tutorial index page, which
  // similarly to the home page is also supposed to be a variable, user-
  // determined page some point. TODO: Implement that.
  if (tailURL === "/tutorials") {
    return (
      <main className="app-main">
        <TutorialIndexPage key="tut"/>
      </main>
    );
  }

  // Else if tailURL = "/donations", go to the about page.
  if (tailURL === "/donations") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Donations' page component here."}
      </main>
    );
  }

  // Else if tailURL = "/sponsors", go to the about page.
  if (tailURL === "/sponsors") {
    return (
      <main className="app-main">
        {"TODO: Insert 'Sponsors' page component here."}
      </main>
    );
  }

  // And else if none of those tailURL types was matched, go to a 404 error
  // page.
  return (
    <main className="app-main">
      {"404 error: Missing page."}
    </main>
  );
}

