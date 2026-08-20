
import {logout} from 'account';

import placeholders from "~/placeholders.js";

const {this: {
  directories: {
    "home_app": homeAppDirID,
  },
}} = placeholders;


export function render({isLoggedIn}) {
  let {isOpen, response} = this.state;
  let username = this.getContext("username");
  return (
    <div className={"account-menu" + (isOpen ? " open" : "")} onClick={() => {
      return false;
    }}>
      <div className="account-menu-header" onClick={() => this.do("toggle")}>
        <div className="user-name-display">{username}</div>
        <div className="user-icon"><span>👤</span></div>
      </div>

      <div className="items">
        <div className={isLoggedIn ? "" : " inactive"} onClick={() => {
          this.do("goTo", `/o-${homeAppDirID}/account`);
        }}>
          <span>Account</span>
        </div>
        <div className={isLoggedIn ? "" : " inactive"} onClick={() => {
          logout().then(errMsg => {
            if (errMsg) {
              console.error(errMsg);
            } else {
              this.do("close");
            }
          });
        }}>
          <span>Log out</span>
        </div>
        <div className={isLoggedIn ? " inactive" : ""} onClick={() => {
          this.do("goTo", `/o-${homeAppDirID}/login`);
        }}>
          <span>Log in</span>
        </div>
        <div className={isLoggedIn ? " inactive" : ""} onClick={() => {
          this.do("goTo", `/o-${homeAppDirID}/signup`);
        }}>
          <span>Sign up</span>
        </div>
      </div>
    </div>
  );
}


export const actions = {
  "toggle": function() {
    this.setState(state => ({...state, isOpen: !state.isOpen}));
  },
  "open": function() {
    this.setState(state => ({...state, isOpen: true}));
  },
  "close": function() {
    this.setState(state => ({...state, isOpen: false}));
  },
  "goTo": function(url) {
    this.do("close");
    this.pushURL(url);
  },
};

export const methods = [
  "close",
]
