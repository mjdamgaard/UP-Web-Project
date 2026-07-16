
import {clearPermissions} from 'query';
import {
  fetchConstructedEntityID, postConstructedEntity,
} from "/1/1/entities.js";
import {urlActions, urlEvents} from "./urlActions.js";

import * as AppHeader from "./AppHeader.jsx";
import * as AppMain from "./AppMain.jsx";

import * as mainStyle from "./style.css";
import * as compEntPageStyle from
  "../entity_browser/variable_components/ComponentEntityPage.css";
import * as entListStyle from "../entity_browser/entity_lists/EntityList.css";
import * as expElemStyle from
  "../entity_browser/entity_elements/ExpandableElement.css";
import * as genEntElemStyle from
  "../entity_browser/entity_elements/GeneralEntityElement.css";
import * as dropDownBoxStyle from "../utilities/DropDownBox.css";
import * as entPageWTabsStyle from "../utilities/EntityPageWithTabs.css";
import * as tabbedPagesStyle from "../utilities/TabbedPages.css";


import {scoreHandler02} from "/1/1/score_handling/ScoreHandler01/em.js";


export function render({url, homeURL = ""}) {
  let url = this.getPath();
  let {userEntID} = this.state;
  this.setContext("userEntID", userEntID ? userEntID : undefined);
  this.setContext("homeURL", homeURL);
  // TODO Implement an item in the AppHeader for going to a score handler
  // settings menu. Where the component from scoreHandler.getSettingsMenu() is
  // shown, followed by an expandable 'Change score handler' sub-menu (with a
  // warning attached), where the user can type in a route for an alternative
  // score handler.
  this.setContext("scoreHandler", scoreHandler02);

  if (userID && userEntID === undefined) {
    fetchConstructedEntityID("/1/1/em1.js", "User", ["1", userID]).then(
      entID => {
        this.setState(state => ({...state, userEntID: entID ?? false}));
      }
    );
  }

  return (
    <div innerStyle={[
      mainStyle, compEntPageStyle, entListStyle, expElemStyle, genEntElemStyle,
      dropDownBoxStyle, entPageWTabsStyle, tabbedPagesStyle,
      ]}>
      <div className="app">
        <AppHeader key="h" url={url} history={history} homeURL={homeURL} />
        <AppMain key="m" url={url} history={history} homeURL={homeURL}
          localStorage={localStorage} sessionStorage={sessionStorage}
        />
      </div>
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
