
import {getHomeDirID} from 'route';
import * as ILink from 'ILink';
import * as Warning from "./Warning.jsx";
import * as AccountMenu from "./account_menu/AccountMenu.jsx";

const homeDirID = getHomeDirID();


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

// TODO: Remove overlay pages, turning them into actual pages with their own
// URL, and then also introduce a blacklist of URLs (using substrings ending in
// wildcards) that the stdFirstSegment and additionalURLs cannot use. Then
// correct the above warning/instruction.
// UPDATE: Now I've blacklisted all additionalURLs that doesn't start with a
// hexadecimal first segment, and all stdFirstSegments that isn't of the form
// /(o-)?[0-9a-f]+/. Next up: reimplementing the overlay pages.


export function render({children, style}) {
  let userID = this.getContext("userID");
  let {hideHeader, hideMargins, warningProps} = this.state;
  this.setContext("headerIsHidden", hideHeader);
  this.setContext("marginsAreHidden", hideMargins);
  return <div innerStyle={style}>
    <div className="app-frame" onClick={() => this.call("am", "close")}>
      <header className={"app-header" + (hideHeader ? " hidden": "")}>
        <ILink key="logo" href="/">
          <span className="logo">UP-Web.org</span>
        </ILink>
        <div className="items">
          {(headerItems)}
        </div>
        <AccountMenu key="am" isLoggedIn={userID ? true : false} />
      </header>
      <div className="warning-container">
        {(!warningProps ? undefined : <Warning key="w" {...warningProps} />)}
      </div>
      <main className={"app-main" + (hideMargins ? " no-margins" : "")}>
        <div className="click-blocker"></div>
        <div className="margin left"></div>
        <div className="app-container no-overflow">
          {(warningProps?.isHarmful ? undefined : children)}
        </div>
        <div className="margin right"></div>
      </main>
    </div>
  </div>;
}


const headerItems = <>
  <ILink key="about" href={`/o-${homeDirID}/about`}>
    <span>About</span>
  </ILink>
  <ILink key="tut" href={`/o-${homeDirID}/tutorials`} >
    <span>Tutorials</span>
  </ILink>
</>;

const warning = <div>
  <div>
    This app has not 
  </div>
</div>




export const actions = {
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
  "hideFrame": function() {
    this.setState(state => ({...state, hideMargins: true, hideHeader: true}));
  },
  "showFrame": function() {
    this.setState(state => ({...state, hideMargins: false, hideHeader: false}));
  },
  "hideWarning": function() {
    this.setState(state => ({...state, warningProps: undefined}));
  },
  "showWarning": function(warningProps) {
    this.setState(state => ({...state, warningProps: warningProps}));
  },
};

export const events = [
  "hideHeader",
  "showHeader",
  "hideMargins",
  "showMargins",
  "hideFrame",
  "showFrame",
  "hideWarning",
  "showWarning",
];