
import * as ILink from 'ILink.jsx';
import * as UserReference from "./UserReference.jsx";


export function render({userID}) {
  return <header className="app-header">
    <ILink key="logo" href="~/">
      <span className="logo">{"SOME example app"}</span>
    </ILink>
    <ILink key="friends" href="~/friends">
      <span className="menu-item">{"Friends"}</span>
    </ILink>
    <span className="separator"></span>
    <ILink key="user" href={"~/u/" + userID}>
      <UserReference userID={userID} />
    </ILink>
  </header>;
}
