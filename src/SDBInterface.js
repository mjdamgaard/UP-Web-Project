import {useState, createContext, useContext} from "react";

import {DBRequestManager} from "/src/DBRequestManager.js";
import {
  AccountContextProvider, SessionContext, AccountManagerContext
} from "/src/AccountContext.js";


export const dbReqManager = new DBRequestManager();
// export const accountManager = new AccountManager(null);

// export const SessionContext = createContext();


export const SDBInterface = () => {
  const [appPage, setAppPage] = useState("home");
  const [colNum, setColNum] = useState(1);

  accountManager.setSession = setSession;

  if (typeof(Storage) === "undefined") {
    alert(
      "This web application requires browser support for local storage " +
      "in order to function correctly. It seems that your browser does " +
      "not support local storage."
    );
  }

  return (
    <AccountContextProvider>
    {/* <AppPageContext.Provider value={[appPage, setAppPage]}> */}
      <div>
        <InterfacePage
          setAppPage={setAppPage}
          colNum={colNum} setColNum={setColNum}
          style={appPage == "home" ? {} : {display: none}}
        />
        <TutorialPage
          setAppPage={setAppPage}
          style={appPage == "tutorial" ? {} : {display: none}}
        />
        <LoginPage
          setAppPage={setAppPage}
          style={appPage == "login" ? {} : {display: none}}
        />
        <SignupPage
          setAppPage={setAppPage}
          style={appPage == "signup" ? {} : {display: none}}
        />
      </div>
    {/* </AppPageContext.Provider> */}
    </AccountContextProvider>
  );
};

const InterfacePage = ({colNum, setColNum}) => {
  return (
    <div>
      <InterfaceHeader setAppPage={setAppPage} setColNum={setColNum} />
      <InterfaceMain colNum={colNum} />
    </div>
  );
};
