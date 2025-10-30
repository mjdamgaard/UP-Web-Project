
import {substring} from 'string';
import {
  fetchConstructedEntityID, postConstructedEntity,
} from "/1/1/entities.js";

import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";

import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";


export function render({url, history, userID, homeURL = ""}) {
  let {userEntID} = this.state;
  // TODO: Consider modifying the history object here such that the descendants
  // who use pushState() or replaceState() doesn't have to prepend the homeURL
  // themselves.
  this.provideContext("history", history);
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

  // Subtract the homeURL from url before passing it to AppMain and AppHeader.
  url = substring(url, homeURL.length);

  return (
    <div className="app">
      <AppHeader key="h" url={url} history={history} homeURL={homeURL} />
      <AppMain key="m" url={url} history={history} homeURL={homeURL} />
    </div>
  );
}



export const actions = {
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
  "postUserEntity",
];


export const styleSheetPaths = [
  abs("./style.css"),
  abs("./variable_components/VariableComponent.css"),
];
