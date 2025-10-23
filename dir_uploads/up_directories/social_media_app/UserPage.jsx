
import * as UserReference from "./UserReference.jsx";
import * as ChangeUsernameMenu from "./ChangeUsernameMenu.jsx";


export function render({userID, ownUserID}) {
  return (
    <div className="home-page">
      <h2 className="title"><UserReference key="title" userID={userID} /></h2>
      {
        (userID && ownUserID === userID) ? <>
          <ChangeUsernameMenu key={"ch-uname-" + userID} userID={userID} />
          <hr/>
          <div>{"TODO: Insert a section for making a new post."}</div>
          <hr/>
        </> : undefined
      }
      <div>{"TODO: Insert a section with the user's post wall."}</div>
    </div>
  );
}