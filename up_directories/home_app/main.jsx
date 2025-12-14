
import {clearPermissions} from 'query';
import {
  fetchConstructedEntityID, postConstructedEntity,
} from "/1/1/entities.js";
import {urlActions, urlEvents} from "./urlActions.js";

import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";

import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";


export function render({
  url, history, userID, homeURL = "", localStorage, sessionStorage
}) {
  let {userEntID} = this.state;
  this.provideContext("history", history);
  this.provideContext("userID", userID);
  this.provideContext("userEntID", userEntID ? userEntID : undefined);
  this.provideContext("homeURL", homeURL);
  // TODO Implement an item in the AppHeader for going to a score handler
  // settings menu. Where the component from scoreHandler.getSettingsMenu() is
  // shown, followed by an expandable 'Change score handler' sub-menu (with a
  // warning attached), where the user can type in a route for an alternative
  // score handler.
  this.provideContext("scoreHandler", scoreHandler01);

  if (userID && userEntID === undefined) {
    fetchConstructedEntityID("/1/1/em1.js", "User", ["1", userID]).then(
      entID => {
        this.setState(state => ({...state, userEntID: entID ?? false}));
      }
    );
  }

  return (
    <div className="app">
      <AppHeader key="h" url={url} history={history} homeURL={homeURL} />
      <AppMain key="m" url={url} history={history} homeURL={homeURL}
        localStorage={localStorage} sessionStorage={sessionStorage}
      />
    </div>
  );
}



export const actions = {
  ...urlActions,
  "pushState": function([state, url]) {
    clearPermissions(() => this.props.history.pushState(state, url));
    return true;
  },
  "replaceState": function([state, url]) {
    clearPermissions(() => this.props.history.replaceState(state, url));
    return true;
  },
  "back": function() {
    clearPermissions(() => this.props.history.back());
    return true;
  },
  "forward": function() {
    clearPermissions(() => this.props.history.forward());
    return true;
  },
  "go": function(delta) {
    clearPermissions(() => this.props.history.go(delta));
    return true;
  },
  "postUserEntity": function() {
    let {userID} = this.props;
    return new Promise(resolve => {
      let {userEntID} = this.state;
      if (!userID) {
        resolve(false);
      }
      else if (userEntID) {
        resolve(userEntID);
      }
      else {
        postConstructedEntity("/1/1/em1.js", "User", ["1", userID]).then(
          entID => {
            this.setState(state => ({...state, userEntID: entID}));
            resolve(entID);
          }
        );
      }
    });
  },
};

export const events = [
  ...urlEvents,
  "pushState",
  "replaceState",
  "postUserEntity",
];


export const styleSheetPaths = [
  abs("./style.css"),
  abs("./variable_components/ComponentEntityPage.css"),
  abs("./entity_lists/EntityList.css"),
];
