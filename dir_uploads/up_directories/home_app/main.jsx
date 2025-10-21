
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
  // who use pushState or replaceState doesn't have to prepend the homeURL
  // themselves.. well, on the other hand, maybe this is not really worth the
  // effort..
  this.provideContext("history", history);
  this.provideContext("userEntID", userEntID ? userEntID : undefined);
  this.provideContext("homeURL", homeURL);
  // TODO Implement an item in the AppHeader for going to a score handler
  // settings menu. And for this menu, first of all implement an 'Advanced
  // settings sub-menu, extendable and with a stark warning when extended,
  // where the user can actually just type in the entPath of their preferred
  // score handler object (an instance, not a class). And as for the non-
  // advanced part of this menu, it doesn't matter if this is empty to begin
  // with, such that there is only the advanced menu. (But at some point.. Ah,
  // maybe we could even just let the score handler object define the component
  // used for the non-advanced menu, and maybe even a component for the
  // advanced menu, which might then come before or after the score handler
  // path submission field. That would make sense, indeed; then the score
  // handler object gets to define how users interface with its settings
  // itself.)
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
];
