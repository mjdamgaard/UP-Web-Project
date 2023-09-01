import {useState, createContext, useContext} from "react";

import {DBRequestManager} from "/src/DBRequestManager.js";
import {
  AccountContextProvider, SessionContext, AccountManagerContext
} from "/src/contexts/AccountContext.js";
import {
  ColumnsContext, ColumnManager,
} from "/src/contexts/ColumnsContext.js";


export const dbReqManager = new DBRequestManager();


export const SDBInterface = () => {
  const [appPage, setAppPage] = useState("home");

  return (
    <AccountContextProvider>
    {/* <AppPageContext.Provider value={[appPage, setAppPage]}> */}
      <div>
        <InterfacePage
          setAppPage={setAppPage}
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


const initColKey = JSON.stringify({entID: 10, n: 0});

const InterfacePage = ({colNum, setColNum}) => {
  const [columns, setColumns] = useState({
    keys: [initColKey],
    fst: 0, // first visible column from the left.
    num: 1, // number of visible columns on the screen.
    focus: 0, // The column currently in focus. (TODO: Implement further.)
  });

  const columnManager = new ColumnManager(columns, setColumns);

  return (
    <ColumnsContext.Provider value={[columns, columnManager]}>
      <div>
        <InterfaceHeader setAppPage={setAppPage} setColNum={setColNum} />
        <InterfaceMain colNum={colNum} />
      </div>
    </ColumnsContext.Provider>
  );
};
