
import {logout} from 'account';
import * as LoginPage from "./LoginPage.jsx";
import * as SignupPage from "./SignupPage.jsx";
import * as AccountPage from "./AccountPage.jsx";
import * as ProfilePage from "./ProfilePage.jsx";


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
          this.trigger("openOverlayPage", <AccountPage />);
        }}>
          <span>Account</span>
        </div>
        <div className={isLoggedIn ? "" : " inactive"} onClick={() => {
          this.trigger("openOverlayPage", <ProfilePage />);
        }}>
          <span>Profile</span>
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
          this.trigger("openOverlayPage", <LoginPage />);
        }}>
          <span>Log in</span>
        </div>
        <div className={isLoggedIn ? " inactive" : ""} onClick={() => {
          this.trigger("openOverlayPage", <SignupPage />);
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
};

export const methods = [
  "close",
]
