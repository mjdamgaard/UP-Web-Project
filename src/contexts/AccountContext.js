
import {useState, createContext} from "react";
import $ from 'jquery';

export const SessionContext = createContext();
export const AccountManagerContext = createContext();

if (typeof(Storage) === "undefined") {
  alert(
  "This web application requires browser support for local storage " +
  "in order to function correctly. It seems that your browser does " +
  "not support local storage."
  );
}

export const AccountContextProvider = ({children}) => {
  const [session, setSession] = useState(localStorage.session ?? false);

  const accountManager = new AccountManager(setSession);

  return (
    <SessionContext.Provider value={session}>
    <AccountManagerContext.Provider value={accountManager}>
      {children}
    </AccountManagerContext.Provider>
    </SessionContext.Provider>
  );
};





export class AccountManager {
  constructor(setSession) {
    this.setSession = setSession;
    
    if (typeof(Storage) === "undefined") {
      alert(
        "This web application requires browser support for local " +
        "storage in order to function correctly. It seems that your " +
        "browser does not support local storage."
      );
      return;
    }
  }

  get session() {
    return JSON.parse(localStorage.session ?? "null");
  }
  get userID() {
    return this.session.userID;
  }
  get sesIDHex() {
    return this.session.sesIDHex;
  }
  get expTime() {
    return this.session.expTime;
  }

  get isLoggedIn() {
    return this.session && this.expTime + 10 < Date.now();
  }

  get inputUserID() {
    return this.isLoggedIn ? this.userID : 0;
  }

  // TODO: Reimplement at some point to allow for other user-specific
  // possibilities.
  get queryUserPriorityArr() {
    return [this.inputUserID, 82];
  }
  // TODO: Reimplement at some point to allow for other user-specific
  // possibilities.
  get stdQueryUserID() {
    return 82;
  }


  logout(obj, callbackData, callback) {
    if (!callback) {
      callback = callbackData ?? (x => void(0));
      callbackData = null;
    }
    if (!this.isLoggedIn) {
      callback(obj, false, callbackData);
      return;
    }

    localStorage.removeItem("session");
    this.setSession(false);

    let reqData = {
      u: this.inputUserID,
      ses: this.sesIDHex,
    };
    $.post("logout_handler.php", reqData, function(result) {
      callback(obj, result, callbackData);
    });
  }

  // TODO: Consider hashing passwords (with a constant salt) before sending
  // to server, just so that a user don't accidentally reveal their password
  // to others if looking at past HTTP(s) requests in the browser's network
  // monitor, while others look on.

  login(userNameOrID, password, obj, callbackData, callback) {
    if (!callback) {
      callback = callbackData ?? (x => void(0));
      callbackData = null;
    }
    let reqData = {
      u: userNameOrID,
      pw: password,
    };
    $.post("login_handler.php", reqData, function(result) {
      if (result.exitCode == 0) {
        let session = localStorage.session = JSON.stringify({
          userID: result.outID,
          sesIDHex: result.sesIDHex,
          expTime: result.expTime,
        });
        this.setSession(session);
      }
      callback(obj, result, callbackData);
    });
  }

  // TODO: Consider making an update_session_handler and then an
  // updateSession() method here, such that users can in priciple stay logged
  // in if they keep visiting the site.

  createNewAccount(username, email, password, obj, callbackData, callback) {
    if (!callback) {
      callback = callbackData ?? (x => void(0));
      callbackData = null;
    }
    let reqData = {
      n: username,
      em: email,
      pw: password,
    };
    $.post("account_creation_handler.php", reqData, function(result) {
      if (result.exitCode == 0) {
        let session = localStorage.session = JSON.stringify({
          userID: result.outID,
          sesIDHex: result.sesIDHex,
          expTime: result.expTime,
        });
        this.setSession(session);
      }
      callback(obj, result, callbackData);
    });
  }
}
