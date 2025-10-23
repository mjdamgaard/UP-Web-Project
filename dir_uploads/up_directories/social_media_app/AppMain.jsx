
import {slice, substring, at, indexOf} from 'string';

import * as HomePage from "./Homepage.jsx";
import * as UserPage from "./UserPage.jsx";
import * as FriendsPage from "./FriendsPage.jsx";


export function render({url = "", userID}) {
  if (at(url, -1) === "/") {
    url = slice(url, 0, -1);
  }

  // If the url is equal to "", go to the home page.
  if (!url) {
    return (
      <main className="app-main">
        <HomePage key="home" userID={userID} />
      </main>
    );
  }

  // Else if url is of the form "/u/" + userID, go to the UserPage.
  let urlStart = slice(url, 0, 3);
  if (urlStart === "/u/") {
    let indOfThirdSlash = indexOf(url, "/", 3);
    let endOfID = (indOfThirdSlash === -1) ? undefined : indOfThirdSlash;
    let urlUserID = slice(url, 3, endOfID);
    let urlRemainder = substring(url, 3 + urlUserID.length);
    return (
      <main className="app-main">
        <UserPage key="u"
          userID={urlUserID} ownUserID={userID}
          url={urlRemainder} pageURL={"~/u/" + urlUserID}
        />
      </main>
    );
  }  
 
  // Else if url = "/friends", go to the friends page.
  if (url === "/friends") {
    return (
      <main className="app-main">
        <FriendsPage key="u" userID={userID} />
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

