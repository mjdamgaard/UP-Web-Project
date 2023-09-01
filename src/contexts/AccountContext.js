
import {useState, createContext} from "react";
import {AccountManager} from "/src/AccountManager.js";

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
