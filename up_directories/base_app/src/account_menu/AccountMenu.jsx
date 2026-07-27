
import {logout} from 'account';


export function render({isLoggedIn}) {
  let {isOpen} = this.state;
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
          this.trigger("showOverlayPage", accountPage);
        }}>
          <span>Account</span>
        </div>
        <div className={isLoggedIn ? "" : " inactive"} onClick={() => {
          this.trigger("showOverlayPage", profilePage);
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
          this.trigger("showOverlayPage", loginPage);
        }}>
          <span>Log in</span>
        </div>
        <div className={isLoggedIn ? " inactive" : ""} onClick={() => {
          this.trigger("showOverlayPage", signUpPage);
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









const loginPage = <>
  {/* <div className="go-back-button"></div>
  <div className="page-content">
    <h2>Log in</h2>
    <form action="javascript:void(0);">
      <div className="form-group">
        <label>Username</label>
        <input type="text" className="form-control username"></input>
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" className="form-control password"></input>
      </div>
      <button type="submit" className="btn btn-primary">
        Log in
      </button>
    </form>
    <div className="response-display text-warning"></div>
    </div> */}
</>;