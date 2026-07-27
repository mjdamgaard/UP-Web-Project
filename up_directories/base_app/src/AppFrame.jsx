
import * as ILink from 'ILink';
import * as AppLoader from "./AppLoader.jsx";
import * as AccountMenu from "./AccountMenu.jsx";


// IMPORTANT: For anyone looking to build a different AppFrame, note that any
// link that does not start with "o-" or "s-" can potentially be hijacked by
// a currently loaded app, namely via its "stdFirstSegment" and/or its
// "additionalURLs" (see ./AppLoader.jsx). So if a link is in anyway sensitive,
// and should not be hijacked by an untrusted loaded app, use an "o-" or "s-"
// app URL. (And for sensitive pages like the login page, etc., it's a good
// idea to use, what we here call "overlay pages," i.e. pages without their own
// URLs that just goes on top if the current page.
// By the way, for such pages, make sure to only use input fields that do not
// allow their focus to be grabbed from elsewhere. 


export function render({children, appLoaderProps}) {
  let userID = this.getContext("userID");
  let {hideHeader, hideMargins, overlayPageContent} = this.state;
  this.setContext("headerIsHidden", hideHeader);
  this.setContext("marginsAreHidden", hideMargins);
  return (
    <div className="app-frame">
      <div className={
        "overlay-page-container" + (overlayPageContent ? " open" : "")
      }>
        {(overlayPageContent)}
      </div>
      <header className={"app-header" + (hideHeader ? " hidden": "")}>
        <ILink key="logo" href="~/">
          <span className="logo">UP Web</span>
        </ILink>
        <div className="items">
          {(headerItems)}
        </div>
        <AccountMenu key="menu" isLoggedIn={userID ? true : false} />
      </header>
      <main className="app-main">
        <div className="margin left"></div>
        <div className="app-container">
          {(children)}
        </div>
        {(appLoaderProps ?
          <AppLoader key="l" {...appLoaderProps} /> : undefined
        )}
        <div className="margin right"></div>
      </main>
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




export const actions = {
  "showOverlayPage": function(overlayPageContent) {
    this.setState(
      state => ({...state, overlayPageContent: overlayPageContent})
    );
    this.call("menu", "close");
  },
  "removeOverlayPage": function() {
    this.setState(
      state => ({...state, overlayPageContent: undefined})
    );
    this.call("menu", "close");
  },
  "hideHeader": function() {
    this.setState(state => ({...state, hideHeader: true}));
  },
  "showHeader": function() {
    this.setState(state => ({...state, hideHeader: false}));
  },
  "hideMargins": function() {
    this.setState(state => ({...state, hideMargins: true}));
  },
  "showMargins": function() {
    this.setState(state => ({...state, hideMargins: false}));
  },
};

export const events = [
  "showOverlayPage",
  "removeOverlayPage",
  "showHeader",
  "hideMargins",
  "showMargins",
];