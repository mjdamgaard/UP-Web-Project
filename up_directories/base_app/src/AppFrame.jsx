
import * as ILink from 'ILink';
import * as AppLoader from "./AppLoader.jsx";
import * as AccountMenu from "./AccountMenu.jsx";


export function render({baseAppPage, appLoaderProps}) {
  let {hideHeader, hideMargins} = this.state;
  return (
    <div className="app-frame">
      <div className={"app-header" + (hideHeader ? " hidden": "")}>
        <ILink key="logo" href="~/">
          <span className="logo">UP Web</span>
        </ILink>
        <div className="items">
          {(headerItems)}
        </div>
        <AccountMenu key="menu" isLoggedIn={} />
      </div>
      <div className={"base-app-page" + (baseAppPage ? "" : " hidden")}>
        {(baseAppPage)}
      </div>
      {(appLoaderProps ? <AppLoader key="l" {...appLoaderProps} /> : undefined)}
    </div>
  );
}


const headerItems = <>
  <ILink key="about" href="~/about">
    <span>About</span>
  </ILink>

  {/* <ILink key="tut" href="~/tutorials">
    <span className="menu-item">{"Tutorials"}</span>
  </ILink> */}

  {/* <ILink key="apps" href="~/apps">
    <span className="menu-item">{"Apps"}</span>
  </ILink> */}

  {/* <ILink key="comp" href="~/ep/1/1/em1.js;get/components">
    <span className="menu-item">{"Components"}</span>
  </ILink> */}

  {/* <ILink key="proj" href="~/ep/1/1/em1.js;get/projects">
    <span className="menu-item">{"Projects"}</span>
  </ILink>
  <ILink key="disc" href="~/ep/1/1/em1.js;get/discussionsClass">
    <span className="menu-item">{"Discussions"}</span>
  </ILink>
  <ILink key="contr" href="~/ep/1/1/em1.js;get/contributions">
    <span className="menu-item">{"Contributions"}</span>
  </ILink> */}
</>;



const accountMenuContent = <>
  <div id="account-menu-header">
    <div id="user-name-display"></div>
    <div id="user-icon">
      <img className="general-user-icon" src="/assets/user-4254.svg" alt="" />
    </div>
  </div>

  <div className="items">
    <div id="account-page-item" className="when-logged-in">
      <span>Account</span>
    </div>
    <div id="profile-page-item" className="when-logged-in">
      <span>Profile</span>
    </div>
    <div id="logout-item" className="when-logged-in">
      <span>Log out</span>
    </div>
    <div id="login-item" className="when-logged-out">
        <span>Log in</span>
    </div>
    <div id="create-account-item" className="when-logged-out">
      <span>Sign up</span>
    </div>
  </div>
</>;