
import {substring} from 'string';
import {
  fetchConstructedEntityID, postConstructedEntity,
} from "/1/1/entities.js";

import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";

import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";


export function render({url, history, userID, homeURL = ""}) {
  let {userEntID} = this.state;
  this.provideContext("history", history);
  this.provideContext("userEntID", userEntID ? userEntID : undefined);
  this.provideContext("homeURL", homeURL);
  this.provideContext("scoreHandler", scoreHandler01);

  if (userID && userEntID === undefined) {
    fetchConstructedEntityID("/1/1/em1.js", "User", ["1", userID]).then(
      entID => {
        this.setState(state => ({...state, userEntID: entID ?? false}));
      }
    );
  }

  // Subtract the homeURL from url before passing it to AppMain.
  url = substring(url, homeURL.length);

  return (
    <div className="app">
      <AppHeader key="h" />
      <AppMain key="m" url={url} />
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
