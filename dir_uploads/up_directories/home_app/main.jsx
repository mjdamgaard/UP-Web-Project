
import {
  fetchConstructedEntityID, postConstructedEntity,
} from "/1/1/entities.js";

import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";



export function render({url, history, userID}) {
  let {userEntID} = this.state;
  this.provideContext("history", history);
  this.provideContext("userEntID", userEntID ? userEntID : undefined);

  if (userID && userEntID === undefined) {
    fetchConstructedEntityID("/1/1/em1.js", "User", [userID]).then(entID => {
      this.setState(state => ({...state, userEntID: entID ?? false}));
    });
  }

  return (
    <div className="app">
      <AppHeader key="h" />
      <AppMain key="m" url={url} />
    </div>
  );
}



export const actions = {
  "goToPage": function(pageIdent) {
    this.call("m", "pageIdent", pageIdent);
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
        postConstructedEntity("/1/1/em1.js", "User", [userID]).then(entID => {
          this.setState(state => ({...state, userEntID: entID}));
          resolve(entID);
        });
      }
    });
  },
};

export const events = [
  "goToPage",
  "postUserEntity",
];


export const stylePath = "./style.css";
