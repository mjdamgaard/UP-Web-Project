
import * as UserReference from "./UserReference.jsx";
import * as ChangeUsernameMenu from "./ChangeUsernameMenu.jsx";
import * as NewPostField from "./NewPostField.jsx";
import * as UserPostWall from "./UserPostWall.jsx";


export function render({userID, ownUserID}) {
  return (
    <div className="home-page">
      <h2 className="title"><UserReference key="title" userID={userID} /></h2>
      {
        (userID && ownUserID === userID) ? <>
          <ChangeUsernameMenu key={"ch-uname-" + userID} userID={userID} />
          <hr/>
          <NewPostField key="post" userID={userID} />
          <hr/>
        </> : undefined
      }
      <UserPostWall key="wall" userID={userID} ownUserID={ownUserID} />
    </div>
  );
}