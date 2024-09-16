


// TODO: I should make accountManager a global instead of a context variable.



import {useState, createContext, useMemo} from "react";
import $ from 'jquery';
import {
  useStateAndReducers, useDispatch
} from "./useStateAndReducers.js"

export const SessionContext = createContext();
export const AccountManagerContext = createContext();

if (typeof(Storage) === "undefined") {
  alert(
  "This web application requires browser support for local storage " +
  "in order to function correctly. It seems that your browser does " +
  "not support local storage."
  );
}

// Let me use a static class instead of a context, why not? (And it means that
// I can import it for the SimpleInstListGenerator class.) ... Hm, or maybe this
// is actually more complicated.. Let me just useContext for now, then..



export const AccountContextProvider = (props) => {
  const {children} = props;
  const [dispatch, passData] = useDispatch(props);


  const [session, setSession] = useState(localStorage.session ?? false);

  const accountManager = useMemo(
    () => new AccountManager(setSession),
    []
  );

  return passData(
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


  logout(callback) {
    callback ??= () => undefined;

    if (!this.isLoggedIn) {
      callback(false);
      return;
    }

    let reqData = {
      u: this.inputUserID,
      ses: this.sesIDHex,
    };

    localStorage.removeItem("session");
    this.setSession(false);

    $.post("http://localhost:80/logout_handler.php", reqData, (result) => {
      callback(result);
    });
  }

  // TODO: Consider hashing passwords (with a constant salt) before sending
  // to server, just so that a user don't accidentally reveal their password
  // to others if looking at past HTTP(s) requests in the browser's network
  // monitor, while others look on.

  login(userNameOrID, password, callback) {
    let reqData = {
      u: userNameOrID,
      pw: password,
    };
    $.post("http://localhost:80/login_handler.php", reqData, (result) => {
      if (result.exitCode == 0) {
        let session = localStorage.session = JSON.stringify({
          userID: result.outID,
          sesIDHex: result.sesIDHex,
          expTime: result.expTime,
        });
        this.setSession(session);
      }
      callback(result);
    });
  }

  // TODO: Consider making an update_session_handler and then an
  // updateSession() method here, such that users can in priciple stay logged
  // in if they keep visiting the site.

  createNewAccount(username, email, password, callback) {
    let reqData = {
      n: username,
      em: email,
      pw: password,
    };
    let url = "http://localhost:80/account_creation_handler.php";
    $.post(url, reqData, (result) => {
      if (result.exitCode == 0) {
        let session = localStorage.session = JSON.stringify({
          userID: result.outID,
          sesIDHex: result.sesIDHex,
          expTime: result.expTime,
        });
        this.setSession(session);
      }
      callback(result);
    });
  }
}
