
import {getHomeDirID} from 'route';
import * as ILink from 'ILink';
import * as Warning from "./Warning.jsx";
import * as AccountMenu from "./account_menu/AccountMenu.jsx";
import * as AppLoader from "./AppLoader.jsx";

const homeDirID = getHomeDirID();



export function render({children, appLoaderProps}) {
  let userID = this.getContext("userID");
  let {hideHeader, hideMargins, warningProps} = this.state;
  this.setContext("headerIsHidden", hideHeader);
  this.setContext("marginsAreHidden", hideMargins);

  if (appLoaderProps) {
    children = <AppLoader key="a" {...appLoaderProps} />;
  }

  return <div className="app-frame" onClick={() => this.call("am", "close")}>
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
  </div>;
}


const headerItems = <>
  <ILink key="about" href={`/o-${homeDirID}/about`}>
    <span>About</span>
  </ILink>
  {/* <ILink key="tut" href={`/o-${homeDirID}/tutorials`} >
    <span>Tutorials</span>
  </ILink> */}
</>;




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